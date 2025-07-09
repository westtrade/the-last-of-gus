import { HTTP_PORT } from "server/config";
import { app } from "./src/server";

app.listen(HTTP_PORT, (server) => {
	console.log(`🚀 Server started at http://localhost:${HTTP_PORT}`);
});
