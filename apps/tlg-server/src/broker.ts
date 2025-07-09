import { ServiceBroker, type BrokerOptions } from "moleculer";
import moleculerConfig from "../moleculer-config/moleculer.config";
import { loadServices } from "./libs";
import * as services from "./services";

import { SERVICES } from "../moleculer-config/config";

export const broker = new ServiceBroker({
	nodeID:
		process.env.NODE_ID ||
		`tlg-server-node-${process.pid}-${Math.random()
			.toString(36)
			.substring(7)}`,
	...moleculerConfig,
} as BrokerOptions);

loadServices(
	broker,
	Object.fromEntries(
		Object.values(services).map((service) => [service.name, service])
	),
	SERVICES
);
