import { Elysia, t } from "elysia";
import { createServer as createViteServer } from "vite";
import { connect } from "elysia-connect-middleware";

import { broker, UserResponse } from "@westtrade/tlg-server";
await broker.start();

console.log(process.env.HTTP_PORT);

const vite = await createViteServer({
	server: { middlewareMode: true },
});

const auth = new Elysia({ prefix: "/auth" })
	.get(
		"/me",
		async ({ cookie }) => {
			await broker.waitForServices(["users"]);

			const result = await broker.call<UserResponse, undefined>(
				"users.me",
				undefined,
				{
					meta: {
						token: cookie.sessionToken.toString(),
					},
				}
			);

			return result;
		},
		{
			cookie: t.Object({
				sessionToken: t.Optional(t.String()),
			}),
		}
	)

	.post(
		"/logout",
		async ({ cookie }) => {
			cookie.sessionToken.remove();

			return { success: true };
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
			await broker.waitForServices(["users"]);

			const result = await broker.call("users.createOrLogin", body);
			cookie.sessionToken.set({
				value: result.token,
				path: "/",
				httpOnly: true,
				// sameSite: "strict"
			});

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
			await broker.waitForServices(["taps"]);

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
			await broker.waitForServices(["rounds"]);

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
			await broker.waitForServices(["rounds"]);

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
			await broker.waitForServices(["users", "rounds"]);

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
