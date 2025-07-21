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
import cookie from "cookie";

export const roundsApi = new Elysia({ prefix: "/rounds" })
	.use(brokerPlugin)

	.get(
		"/",
		async ({ query, broker }) => {
			return broker.call<
				ListResponse<RoundResponse>,
				ListParams<RoundResponse>
			>("rounds.list", query);
		},
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

					fields: t.Optional(t.String()),
					populate: t.Optional(t.String()),
				})
			),
		}
	)

	.get("/count", async ({ broker }) => broker.call<number>("rounds.count"))

	.post("/", async ({ cookie, broker }) => {
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
	})

	.post(
		"/tap",
		async ({ body, cookie, broker }) => {
			const token = cookie.sessionToken.toString();

			return await broker.call<TapResponse, CreateTapParams>(
				"taps.tap",
				body,
				{
					meta: { token },
				}
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
	)

	.get(
		"/:roundId",
		async ({ broker, cookie, params: { roundId } }) => {
			const token = cookie.sessionToken.toString();

			return (await broker.mcall(
				{
					round: {
						action: "rounds.get",
						params: { id: roundId, populate: "winnerUser" },
					},
					tap: { action: "taps.ensureUserTap", params: { roundId } },
				},
				{ meta: { token } }
			)) as {
				round: RoundResponse;
				tap: TapResponse;
			};
		},
		{
			params: t.Object({
				roundId: t.String(),
			}),
			cookie: t.Object({
				sessionToken: t.Optional(t.String()),
			}),
		}
	)

	.ws("/:roundId/ws", {
		error(...args) {
			console.log("WS error", ...args);
		},
		async open(ws) {
			const { broker, brokerEvents, request } = ws.data;
			const { sessionToken: token } = cookie.parse(
				request.headers.get("Cookie") || ""
			) satisfies {
				sessionToken?: string;
			};

			const me = await broker.call<UserResponse, undefined>(
				"users.me",
				undefined,
				{
					meta: { token },
				}
			);

			ws.data.subscriptionHandler = (data) => {
				const { tap, round } = data as {
					tap: TapResponse;
					round: RoundResponse;
				};

				if (me.id === tap.userId) {
					ws.send(data);
				} else {
					ws.send({ round });
				}
			};

			brokerEvents.on("taps.tap", ws.data.subscriptionHandler);
		},

		async message(ws, message) {
			const { broker, request, params } = ws.data;
			const { sessionToken: token } = cookie.parse(
				request.headers.get("Cookie") || ""
			) satisfies {
				sessionToken?: string;
			};
			broker.call<TapResponse, CreateTapParams>(
				"taps.tap",
				{ roundId: params.roundId },
				{ meta: { token } }
			);
		},
		close(ws, code, reason) {
			const { brokerEvents, subscriptionHandler } = ws.data;
			brokerEvents.off("taps.tap", subscriptionHandler);
		},
	});

export type RoundsApi = typeof roundsApi;
