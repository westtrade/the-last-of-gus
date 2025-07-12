import Elysia from "elysia";
import { broker } from "@westtrade/tlg-server";

await broker.start();
export const brokerPlugin = new Elysia().decorate("broker", broker);
