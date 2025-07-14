import Elysia from "elysia";
import { broker, brokerEvents } from "@westtrade/tlg-server";

await broker.start();
export const brokerPlugin = new Elysia()
	.decorate("broker", broker)
	.decorate("brokerEvents", brokerEvents.events)
	.decorate("subscriptionHandler", (data: unknown) => {});
