import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import dayjs from "dayjs";

import path from "node:path";

import { COOLDOWN_DURATION, ROUND_DURATION } from "../config";

function mapRound(round: any) {
	const now = new Date();

	round.status = dayjs(now).isBefore(round.start)
		? "cooldown"
		: dayjs(now).isAfter(round.end)
		? "finished"
		: "active";

	return round;
}

export const RoundService: ServiceSchema = {
	name: "rounds",
	mixins: [DbService],

	adapter: new MemoryAdapter({
		filename: path.resolve(__dirname, "../../data/rounds.db"),
	}),

	settings: {
		idField: "id",
		fields: [
			"id",
			"start",
			"end",
			"cooldown",
			"winner",
			"totalScore",
			"taps",
		],
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
					}),
					this.settings.idField
				);

				return round;
			},
		},
	},
};
