import type { ServiceSchema, Context, ServiceBroker } from "moleculer";
import DbService from "moleculer-db";

//@ts-ignore
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
	ErrorResponse,
	RoundModel,
	CreateTapParams,
} from "../models";
import { CacheSyncMixin } from "../mixins";
import {
	COOLDOWN_DURATION,
	REDIS_QUEUE_ENDPOINT,
	ROUND_DURATION,
} from "../../moleculer-config/config";

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
				job: Job<
					CreateTapParams & {
						userId: string;
					}
				>
			): Promise<TapResponse | ErrorResponse> {
				const { userId, roundId, clientId } = job.data;

				const self = this as typeof TapService;
				const broker = self.broker as ServiceBroker;
				const adapter = self.adapter as RedisDBAdapter<RawTapModel>;
				const settings = self.settings as any;

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
					const users = await broker.call<
						Record<string, UserResponse>,
						{
							id: (string | null)[];
						}
					>("users.getSafe", {
						id: [round.winner],
					});

					const winnerUser = users[round.winner ?? ""] || null;

					broker.broadcast("taps.tap", {
						tap: undefined,
						round: { ...round, winnerUser },
						clientId,
					});

					console.error("round_not_active");

					return {
						status: "error",
						shortCode: "round_not_active",
						code: 404,
					};
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

				if (!!rawTap && typeof rawTap?._id === "string") {
					rawTap = await adapter.updateById(rawTap._id, {
						$set: {
							score: (rawTap.score ?? 0) + addScore,
							taps: (rawTap.taps ?? 0) + 1,
							userId,
							roundId,
						},
					});
				}

				if (rawTap === null) {
					rawTap = (await adapter.insertWithExpiration(
						{
							userId,
							roundId,
							taps: 1,
							score: addScore,
						},
						(ROUND_DURATION + COOLDOWN_DURATION) * 1_000
					)) satisfies RawTapModel;
				}

				if (rawTap.score !== undefined && rawTap.score > bestScore) {
					bestScore = rawTap.score;
					winner = userId;
				}

				const roundState = await broker.call<
					RoundModel,
					Partial<RoundModel>
				>("rounds.update", {
					id: roundId,
					taps: round.taps + 1,
					totalScore: round.totalScore + addScore,
					bestScore,
					winner,
				});

				const users = await broker.call<
					Record<string, UserResponse>,
					{
						id: (string | null)[];
					}
				>("users.getSafe", {
					id: [roundState.winner],
				});

				const winnerUser = users[roundState.winner ?? ""] || null;

				if (!rawTap) {
					broker.logger.error("tap_not_found");

					return {
						status: "error",
						shortCode: "tap_not_found",
						code: 404,
					};
				}

				const tap = {
					...adapter.afterRetrieveTransformID<TapModel>(
						rawTap,
						settings.idField
					),
					addScore,
				};

				broker.broadcast("cache.clear", {
					serviceNames: ["rounds", "taps"],
				});

				broker.broadcast("taps.tap", {
					tap,
					round: { ...roundState, winnerUser },
					clientId,
				});

				return tap;
			},
		},
	},

	actions: {
		ensureUserTap: {
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

				const adapter = this.adapter as RedisDBAdapter<RawTapModel>;

				let rawTap = await adapter.findOne<
					FindOneTapParams,
					RawTapModel
				>({
					userId: me.id,
					roundId: ctx.params.roundId,
				});

				if (!rawTap) {
					rawTap = await adapter.insertWithExpiration(
						{
							userId: me.id,
							roundId: ctx.params.roundId,
							taps: 0,
							score: 0,
						},
						(ROUND_DURATION + COOLDOWN_DURATION) * 1_000
					);
				}

				const addScore = me.role === "nikita" ? 0 : 1;
				return {
					...adapter.afterRetrieveTransformID<TapModel>(
						rawTap!,
						this.settings.idField
					),
					addScore,
				};
			},
		},

		tap: {
			params: { roundId: "string", clientId: "string|optional" },
			async handler(ctx: Context<CreateTapParams, { token?: string }>) {
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
						clientId: ctx.params.clientId,
					}
				);

				const tap = await tapJob.finished();
				return tap;
			},
		},
	},
};
