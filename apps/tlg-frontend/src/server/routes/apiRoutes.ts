import { Elysia } from "elysia";
import { authRoutes } from "@server/routes/authRoutes";
import { roundsRoutes } from "@server/routes/roundsRoutes";

export const apiRoutes = new Elysia({ prefix: "/api" })
	.use(authRoutes)
	.use(roundsRoutes);

apiRoutes.onError(({ code, error, set }) => {
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
});
