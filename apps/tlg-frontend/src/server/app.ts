import { Elysia, file } from "elysia";
import { createServer as createViteServer } from "vite";
import { connect } from "elysia-connect-middleware";
import { staticPlugin } from "@elysiajs/static";
import {
	roundsApi,
	authApi,
	type AuthApi,
	type RoundsApi,
} from "@server/routes";

import { NODE_ENV } from "./config";

const apiRoutes = new Elysia({ prefix: "/api" })
	.use(roundsApi as RoundsApi)
	.use(authApi as AuthApi);

export const app = new Elysia()
	.use(apiRoutes)
	.onError(({ code, error, set }) => {
		set.status = error.code ?? error.cause?.code ?? 500;

		let form: Record<string, string> | undefined = undefined;

		let message = error.message;

		if ("data" in error && Array.isArray(error.data)) {
			form = Object.fromEntries(
				error.data.map((el: any) => [el.field, el.type])
			);

			message = "validation_error";
		}

		return {
			code,
			message,
			data: error.data,
			form,
		};
	})
	.onRequest(async ({ request }) => {
		const endpoint = new URL(request.url).pathname;

		if (endpoint.startsWith("/api")) {
			return apiRoutes.handle(request);
		}
	});

if (NODE_ENV !== "production") {
	const vite = await createViteServer({
		server: { middlewareMode: true },
	});

	app.use(connect(vite.middlewares));
} else {
	app.get("/", ({ set }) => {
		set.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
		set.headers["Pragma"] = "no-cache";
		set.headers["Expires"] = "0";

		return file("dist/index.html");
	})
		.use(
			staticPlugin({
				assets: "dist",
				prefix: "",
				alwaysStatic: true,
				indexHTML: true,
				headers: {
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			})
		)
		.get("/*", () => file("dist/index.html"));
}

export type ServerApi = typeof apiRoutes;
