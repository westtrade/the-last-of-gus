import { ServiceBroker } from "moleculer";
import { RoundService, TapService, UserService } from "./services";

export const broker = new ServiceBroker({
	nodeID: process.env.NODE_ID || `tlg-server-node-${process.pid}`,
});

broker.createService(UserService);
broker.createService(RoundService);
broker.createService(TapService);
