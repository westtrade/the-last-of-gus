import type { ServiceBroker, ServiceSchema } from "moleculer";

export function loadServices(
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
