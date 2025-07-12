import { Elysia, t } from "elysia";
import type { CreateOrLoginParams, UserResponse } from "@westtrade/tlg-server";
import { brokerPlugin } from "@server/plugins";

export const authRoutes = new Elysia({ prefix: "/auth" }).use(brokerPlugin);

authRoutes.get(
	"/me",
	async ({ cookie, broker }) => {
		const token = cookie.sessionToken.toString();

		await broker.waitForServices(["users"]);
		return await broker.call<UserResponse, undefined>(
			"users.me",
			undefined,
			{ meta: { token } }
		);
	},
	{
		cookie: t.Object({ sessionToken: t.Optional(t.String()) }),
	}
);

authRoutes.post(
	"/logout",
	async ({ cookie }) => {
		cookie.sessionToken.remove();
		return { success: true };
	},
	{
		cookie: t.Object({ sessionToken: t.Optional(t.String()) }),
	}
);

authRoutes.post(
	"/login",
	async ({ body, cookie, broker }) => {
		await broker.waitForServices(["users"]);

		const user = await broker.call<UserResponse, CreateOrLoginParams>(
			"users.createOrLogin",
			body
		);

		cookie.sessionToken.set({
			value: user.token,
			path: "/",
			httpOnly: true,
			// sameSite: "strict"
		});

		return user;
	},
	{
		body: t.Object({ username: t.String(), password: t.String() }),
		cookie: t.Object({ sessionToken: t.Optional(t.String()) }),
	}
);
