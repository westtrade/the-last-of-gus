import { Elysia, t } from "elysia";
import type { CreateOrLoginParams, UserResponse } from "@westtrade/tlg-server";
import { brokerPlugin } from "@server/plugins";

export const authApi = new Elysia({ prefix: "/auth" })
	.use(brokerPlugin)
	.get(
		"/me",
		async ({ cookie, broker }) => {
			const token = cookie.sessionToken.toString();

			return await broker.call<UserResponse, undefined>(
				"users.me",
				undefined,
				{ meta: { token } }
			);
		},
		{
			cookie: t.Object({ sessionToken: t.Optional(t.String()) }),
		}
	)
	.post(
		"/logout",
		async ({ cookie }) => {
			cookie.sessionToken.remove();
			return { success: true };
		},
		{
			cookie: t.Object({ sessionToken: t.Optional(t.String()) }),
		}
	)
	.post(
		"/login",
		async ({ body, cookie, broker }) => {
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

export type AuthApi = typeof authApi;
