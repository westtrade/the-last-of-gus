import { Elysia, t } from "elysia";
import { createServer as createViteServer } from "vite";
import { connect } from "elysia-connect-middleware";

import { broker } from "@westtrade/tlg-server";

await broker.start();

const vite = await createViteServer({
	server: { middlewareMode: true },
});

const auth = new Elysia({ prefix: "/auth" })
	.get(
		"/me",
		async ({ cookie }) => {
			const result = await broker.call("users.me", undefined, {
				meta: {
					token: cookie.sessionToken.toString(),
				},
			});

			return result;
		},
		{
			cookie: t.Object({
				sessionToken: t.Optional(t.String()),
			}),
		}
	)
	.post(
		"/login",
		async ({ body, cookie }) => {
			const result = await broker.call("users.createOrLogin", body);
			cookie.sessionToken.value = result.token;
			cookie.sessionToken.path = "/";
			cookie.sessionToken.httpOnly = true;
			// cookie.sessionToken.sameSite = "strict";

			return result;
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
			cookie: t.Object({
				sessionToken: t.Optional(t.String()),
			}),
		}
	);

const rounds = new Elysia({ prefix: "/rounds" })
	.post(
		"/tap",
		async ({ body, cookie }) => {
			const tap = await broker.call("taps.tap", body, {
				meta: {
					token: cookie.sessionToken.toString(),
				},
			});

			return tap;
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
		"/",
		async ({ query }) => {
			return broker.call("rounds.list", {
				pageSize: 16,
				sort: "-start",
				page: query.page,
			});
		},
		{
			query: t.Optional(
				t.Object({
					page: t.Optional(
						t.Number({
							default: 1,
							min: 1,
						})
					),
				})
			),
		}
	)
	.get(
		"/:roundId",
		async ({ params: { roundId } }) => {
			return broker.call("rounds.get", { id: roundId });
		},
		{
			params: t.Object({
				roundId: t.String(),
			}),
		}
	)
	.post(
		"/",
		async ({ cookie }) => {
			const user = await broker.call("users.me", undefined, {
				meta: {
					token: cookie.sessionToken.toString(),
				},
			});

			const role = user.role;

			if (role !== "admin") {
				throw new Error("forbidden");
			}

			const createResult = await broker.call("rounds.create");
			return createResult;
		},
		{
			body: t.Object({}),
		}
	);

const api = new Elysia({
	prefix: "/api",
})
	.onError(({ code, error, set }) => {
		set.status = error.cause?.code || 500;

		console.error(error);

		return {
			code,
			message: error.message,
		};
	})
	.use(auth)
	.use(rounds);

export const app = new Elysia()
	.onRequest(async ({ request }) => {
		const endpoint = new URL(request.url).pathname;
		if (endpoint.startsWith("/api")) {
			return api.handle(request);
		}
	})
	.use(connect(vite.middlewares));

export type ServerApp = typeof app;
