import { broker } from "./broker";
import { SERVICES } from "./config";

await broker.start();

console.log(
	`🚀 Server started on node ${broker.nodeID} with services: ${SERVICES} 🚀`
);
