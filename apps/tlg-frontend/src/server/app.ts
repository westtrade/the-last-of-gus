import { Elysia } from "elysia";
import { createServer as createViteServer } from "vite";
import { connect } from "elysia-connect-middleware";
import { staticPlugin } from "@elysiajs/static";
import { apiRoutes } from "@server/routes";
import { NODE_ENV } from "./config";

export const app = new Elysia()
	.use(apiRoutes)
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
	app.use(
		staticPlugin({
			assets: "dist",
			prefix: "",
			alwaysStatic: true,
			indexHTML: true,
		})
	);
}

export type ServerApi = typeof apiRoutes;
