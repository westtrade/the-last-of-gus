import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import dayjs from "dayjs";
import path from "node:path";

import {
	COOLDOWN_DURATION,
	ROUND_DURATION,
} from "../../moleculer-config/config";
import type { RoundModel, RoundResponse } from "../models/round.model";

function mapRound(round: RoundModel) {
	const now = new Date();
	const status = dayjs(now).isBefore(round.start)
		? "cooldown"
		: dayjs(now).isAfter(round.end)
		? "finished"
		: "active";

	const result: RoundResponse = {
		...round,
		status,
	};

	return result;
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
			"winnerUser",
		],

		populate: {
			winnerUser: {
				action: "users.get",
				params(ctx: any, doc: RoundModel) {
					if (!doc.winner) {
						return null;
					}

					return {
						id: doc.winner,
					};
				},
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
					}),

					this.settings.idField
				);

				return round;
			},
		},
	},
};
