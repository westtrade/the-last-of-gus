import Eev from "eev";

export const makeBrokerEvents = () => {
	const events = new Eev();
	const middleware = {
		broadcast(next: any) {
			return (eventName: string, payload: any, opts: any) => {
				events.emit(eventName, payload);
				return next(eventName, payload, opts);
			};
		},
	};

	return {
		events,
		middleware,
	};
};
