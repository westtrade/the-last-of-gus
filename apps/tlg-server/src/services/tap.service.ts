import type { ServiceSchema, Context, ServiceBroker } from "moleculer";
import DbService from "moleculer-db";
import QueueService from "moleculer-bull";
import type { Job } from "bull";
import { RedisDBAdapter } from "../adapters/RedisDBAdapter";
import type {
	TapModel,
	FindOneTapParams,
	GetUserParams,
	RawTapModel,
	TapResponse,
	UserResponse,
	GetRoundParams,
	RoundResponse,
} from "../models";
import { REDIS_QUEUE_ENDPOINT } from "../../moleculer-config/config";

export const TapService: ServiceSchema = {
	name: "taps",
	mixins: [DbService, QueueService(REDIS_QUEUE_ENDPOINT)],

	adapter: new RedisDBAdapter<RawTapModel>(REDIS_QUEUE_ENDPOINT),

	settings: {
		idField: "id",
		fields: ["id", "userId", "roundId", "taps", "score"],
	},

	queues: {
		"game.tap": {
			name: "taps-queue",
			concurrency: 1,
			async process(
				job: Job<{
					userId: string;
					roundId: string;
				}>
			): Promise<TapResponse> {
				const { userId, roundId } = job.data;

				const broker = this.broker as ServiceBroker;
				const adapter = this.adapter as RedisDBAdapter<RawTapModel>;
				const settings = this.settings as any;

				const [user, round] = await Promise.all([
					broker.call<UserResponse, GetUserParams>("users.get", {
						id: userId,
					}),
					broker.call<RoundResponse, GetRoundParams>("rounds.get", {
						id: roundId,
					}),
				]);

				let bestScore = round.bestScore ?? 0;
				let winner = round.winner ?? null;

				if (round.status !== "active") {
					throw new Error("round_not_active");
				}

				let rawTap = await adapter.findOne<
					FindOneTapParams,
					RawTapModel
				>({
					userId,
					roundId,
				});

				const totalTaps = round.taps + 1;
				const addScore =
					user.role === "nikita" ? 0 : totalTaps % 11 === 0 ? 10 : 1;

				if (rawTap !== null) {
					rawTap = await adapter.updateById(rawTap._id, {
						score: rawTap.score + addScore,
						taps: rawTap.taps + 1,
						userId,
						roundId,
					});
				}

				if (rawTap === null) {
					rawTap = (await adapter.insert({
						userId,
						roundId,
						taps: 1,
						score: addScore,
					})) satisfies RawTapModel;
				}

				if (rawTap.score > bestScore) {
					bestScore = rawTap.score;
					winner = userId;
				}

				await broker.call("rounds.update", {
					id: roundId,
					taps: round.taps + 1,
					totalScore: round.totalScore + addScore,
					bestScore,
					winner,
				});

				if (!rawTap) {
					throw new Error("tap_not_found");
				}

				const tap = adapter.afterRetrieveTransformID<TapModel>(
					rawTap,
					settings.idField
				);

				return {
					...tap,
					addScore,
				};
			},
		},
	},

	actions: {
		tap: {
			params: { roundId: "string" },
			async handler(
				ctx: Context<{ roundId: string }, { token?: string }>
			) {
				const me = await ctx.call<UserResponse, undefined>(
					"users.me",
					undefined,
					{
						meta: {
							token: ctx.meta.token,
						},
					}
				);

				const tapJob: Job = await this.createJob(
					"game.tap",
					"taps-queue",
					{
						roundId: ctx.params.roundId,
						userId: me.id,
					}
				);

				const tap = await tapJob.finished();
				return tap;
			},
		},
	},
};
