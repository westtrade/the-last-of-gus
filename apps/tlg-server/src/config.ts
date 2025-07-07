export const JWT_SECRET = process.env.JWT_SECRET || "fluffy cat";
export const COOLDOWN_DURATION = Number.parseInt(
	process.env.COOLDOWN_DURATION || "30"
);
export const ROUND_DURATION = Number.parseInt(
	process.env.ROUND_DURATION || "60"
);
export const REDIS_QUEUE_ENDPOINT =
	process.env.REDIS_QUEUE_ENDPOINT || `redis://0.0.0.0:6379`;
