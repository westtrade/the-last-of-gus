import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import QueueService from "moleculer-bull";
import path from "node:path";

import { REDIS_QUEUE_ENDPOINT } from "../config";
import type { Job } from "bull";

export const TapService: ServiceSchema = {
	name: "taps",
	mixins: [DbService, QueueService(REDIS_QUEUE_ENDPOINT)],
	adapter: new MemoryAdapter({
		filename: path.resolve(__dirname, "../../data/taps.db"),
	}),

	settings: {
		idField: "id",
		fields: ["id", "userId", "roundId", "taps", "score"],
	},

	queues: {
		"game.tap": {
			name: "taps-queue",
			concurrency: 1,
			async process(job: Job) {
				const { userId, roundId } = job.data as {
					userId: string;
					roundId: string;
				};

				const [user, round] = await Promise.all([
					this.broker.call("users.get", { id: userId }),
					this.broker.call("rounds.get", { id: roundId }),
				]);

				if (round.status !== "active") {
					throw new Error("round_not_active");
				}

				let tap = await this.adapter.findOne({ userId, roundId });

				const totalTaps = round.taps + 1;
				const addScore =
					user.role === "nikita" ? 0 : totalTaps % 11 === 0 ? 10 : 1;

				if (tap) {
					tap = await this.adapter.updateById(tap._id, {
						score: tap.score + addScore,
						taps: tap.taps + 1,
						userId,
						roundId,
					});
				} else {
					if (!tap) {
						tap = await this.adapter.insert({
							userId,
							roundId,
							taps: 1,
							score: addScore,
						});
					}
				}

				await this.broker.call("rounds.update", {
					id: roundId,
					taps: round.taps + 1,
					totalScore: round.totalScore + addScore,
				});

				return {
					id: job.data.id,
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
				const me = await ctx.call("users.me", undefined, {
					meta: {
						token: ctx.meta.token,
					},
				});

				const tapJob: Job = await this.createJob(
					"game.tap",
					"taps-queue",
					{
						roundId: ctx.params.roundId,
						userId: me.id,
					}
				);

				const tap = this.adapter.afterRetrieveTransformID(
					await tapJob.finished(),
					this.settings.idField
				);

				return tap;
			},
		},
	},
};
