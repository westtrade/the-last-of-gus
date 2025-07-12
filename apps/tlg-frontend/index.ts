import { app, HTTP_PORT } from "@server";

app.listen(HTTP_PORT, (server) => {
	console.log(`🚀 Server started at http://localhost:${HTTP_PORT}`);
});
