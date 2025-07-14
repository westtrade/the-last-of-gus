import type { ServiceSchema, Context } from "moleculer";
import DbService from "moleculer-db";
import dayjs from "dayjs";
import { RedisDBAdapter } from "../adapters";
import {
	COOLDOWN_DURATION,
	REDIS_QUEUE_ENDPOINT,
	ROUND_DURATION,
} from "../../moleculer-config/config";

import type {
	RawRoundModel,
	RoundModel,
	RoundResponse,
} from "../models/round.model";

function mapRound(round: RoundModel) {
	const now = new Date();

	const result: Partial<RoundResponse> = {
		...round,
	};

	if ("status" in round) {
		result.status = dayjs(now).isBefore(round.start)
			? "cooldown"
			: dayjs(now).isAfter(round.end)
			? "finished"
			: "active";
	}

	return result;
}

export const RoundService: ServiceSchema = {
	name: "rounds",
	mixins: [DbService],

	adapter: new RedisDBAdapter<RawRoundModel>(REDIS_QUEUE_ENDPOINT),

	settings: {
		idField: "id",
		fields: [
			"id",
			"start",
			"end",
			"cooldown",
			"winner",
			"totalScore",
			"status",
			"taps",
			"winnerUser",
			"bestScore",
		],

		populates: {
			winnerUser: {
				action: "users.getSafe",
				field: "winner",
			},
		},
	},

	hooks: {
		after: {
			create(ctx, round) {
				return mapRound(round);
			},

			get(ctx, round) {
				return mapRound(round);
			},

			list(ctx, res) {
				res.rows = res.rows.map(mapRound);
				return res;
			},
		},
	},

	actions: {
		clear: {
			async handler(ctx) {
				return this.adapter.clear();
			},
		},

		create: {
			params: {
				start: "date|optional|convert",
				end: "date|optional|convert",
			},
			async handler(
				ctx: Context<{
					start: Date;
					end: Date;
				}>
			) {
				const { start: startInput, end: endInput } = ctx.params;
				const start =
					startInput ??
					dayjs().add(COOLDOWN_DURATION, "second").toDate();

				const round = this.adapter.afterRetrieveTransformID(
					await this.adapter.insert({
						start,
						end:
							endInput ??
							dayjs(start).add(ROUND_DURATION, "second").toDate(),
						totalScore: 0,
						taps: 0,
						winner: null,
						status: null,
					}),

					this.settings.idField
				);
				await ctx.broker.cacher?.clean("rounds.*");

				return round;
			},
		},
	},
};
