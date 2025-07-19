export const NODE_ENV = process.env.NODE_ENV || "production";
export const NODE_APP_INSTANCE = Number.parseInt(
	process.env.NODE_APP_INSTANCE || "0"
);
export const HTTP_PORT =
	Number.parseInt(process.env.HTTP_PORT || "3000") + NODE_APP_INSTANCE;
