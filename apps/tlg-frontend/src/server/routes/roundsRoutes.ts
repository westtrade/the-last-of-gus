import { Elysia, t } from "elysia";
import { brokerPlugin } from "@server";
import type {
	CreateTapParams,
	GetRoundParams,
	ListParams,
	ListResponse,
	RoundResponse,
	TapResponse,
	UserResponse,
} from "@westtrade/tlg-server";

export const roundsRoutes = new Elysia({ prefix: "/rounds" }).use(brokerPlugin);

roundsRoutes.get(
	"",
	async ({ query, broker }) =>
		broker.call<ListResponse<RoundResponse>, ListParams<RoundResponse>>(
			"rounds.list",
			query
		),
	{
		query: t.Optional(
			t.Object({
				page: t.Number({
					default: 1,
					minimum: 1,
				}),

				pageSize: t.Number({
					default: 10,
					minimum: 2,
					maximum: 25,
				}),

				sort: t.String({
					default: "-start",
				}),
			})
		),
	}
);

roundsRoutes.get("count", async ({ broker }) =>
	broker.call<number>("rounds.count")
);

roundsRoutes.post("", async ({ cookie, broker }) => {
	const token = cookie.sessionToken.toString();

	const user = await broker.call<UserResponse, undefined>(
		"users.me",
		undefined,
		{ meta: { token } }
	);

	if (user.role !== "admin") {
		throw new Error("forbidden");
	}

	return broker.call<RoundResponse>("rounds.create");
});

roundsRoutes.post(
	"tap",
	async ({ body, cookie, broker }) => {
		const token = cookie.sessionToken.toString();

		return await broker.call<TapResponse, CreateTapParams>(
			"taps.tap",
			body,
			{ meta: { token } }
		);
	},
	{
		body: t.Object({
			roundId: t.String(),
		}),
		cookie: t.Object({
			sessionToken: t.Optional(t.String()),
		}),
	}
);

roundsRoutes.get(
	":roundId",
	async ({ broker, params: { roundId } }) => {
		return broker.call<RoundResponse, GetRoundParams>("rounds.get", {
			id: roundId,
		});
	},
	{
		params: t.Object({
			roundId: t.String(),
		}),
	}
);
