import { app, HTTP_PORT, NODE_ENV } from "@server";

app.listen(
	{
		port: HTTP_PORT,
		hostname: "0.0.0.0",
	},
	() => {
		console.log(
			`🚀 Server started at http://0.0.0.0:${HTTP_PORT} in ${NODE_ENV} mode`
		);
	}
);
