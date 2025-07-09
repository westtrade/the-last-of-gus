import { broker } from "./broker";
import { SERVICES } from "../moleculer-config/config";

await broker.start();

console.log(
	`🚀 Server started on node ${broker.nodeID}${
		SERVICES === "*" ? "" : ` with services: ${SERVICES}`
	}`
);
