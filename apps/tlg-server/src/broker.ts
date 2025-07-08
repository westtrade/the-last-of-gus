import { ServiceBroker, type ServiceSchema } from "moleculer";
import * as services from "./services";
import { SERVICES } from "./config";

export const broker = new ServiceBroker({
	nodeID: process.env.NODE_ID || `tlg-server-node-${process.pid}`,
});

function loadServices(
	broker: ServiceBroker,
	availableServices: Record<string, ServiceSchema<any>>,
	enabledServices: string
) {
	const services =
		enabledServices === "*"
			? Object.keys(availableServices)
			: enabledServices.split(",").map((service) => service.trim());

	for (const service of services) {
		if (!availableServices[service]) {
			throw new Error(
				`Service ${service} not found. Available services: ${Object.keys(
					availableServices
				).join(", ")}	`
			);
		}
		broker.createService(availableServices[service]);
	}
}

loadServices(
	broker,
	Object.fromEntries(
		Object.values(services).map((service) => [service.name, service])
	),
	SERVICES
);
