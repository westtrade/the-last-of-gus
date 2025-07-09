import type {
	ServiceSchema,
	Context,
	BrokerNode,
	ServiceBroker,
} from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import QueueService from "moleculer-bull";

import { REDIS_QUEUE_ENDPOINT } from "../../moleculer-config/config";
import type { Job } from "bull";
import { RedisDBAdapter } from "../adapters/RedisDBAdapter";
import {
	TapModel,
	UserModel,
	type AuthMeta,
	type FindOneTapParams,
	type GetUserParams,
	type RawTapModel,
	type TapResponse,
	type UserResponse,
} from "../models";
import type {
	GetRoundParams,
	RoundModel,
	RoundResponse,
} from "../models/round.model";

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

				const [user, round] = await Promise.all([
					broker.call<UserResponse, GetUserParams>("users.get", {
						id: userId,
					}),
					broker.call<RoundResponse, GetRoundParams>("rounds.get", {
						id: roundId,
					}),
				]);

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

				if (rawTap) {
					rawTap = await adapter.updateById(rawTap._id, {
						score: rawTap.score + addScore,
						taps: rawTap.taps + 1,
						userId,
						roundId,
					});
				} else {
					if (!rawTap) {
						rawTap = await adapter.insert({
							userId,
							roundId,
							taps: 1,
							score: addScore,
						});
					}
				}

				await broker.call("rounds.update", {
					id: roundId,
					taps: round.taps + 1,
					totalScore: round.totalScore + addScore,
				});

				if (!rawTap) {
					throw new Error("tap_not_found");
				}

				const tap = adapter.afterRetrieveTransformID<TapModel>(
					rawTap,
					this.settings.idField
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
