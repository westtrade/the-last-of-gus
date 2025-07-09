const JWT_SECRET = process.env.JWT_SECRET || "fluffy cat";
const COOLDOWN_DURATION = Number.parseInt(
	process.env.COOLDOWN_DURATION || "30"
);
const ROUND_DURATION = Number.parseInt(process.env.ROUND_DURATION || "60");
const REDIS_QUEUE_ENDPOINT =
	process.env.REDIS_QUEUE_ENDPOINT || `redis://0.0.0.0:6379`;
const SERVICES = process.env.SERVICES || "*";
const TRANSPORTER = process.env.TRANSPORTER || "redis://localhost:6379";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

module.exports = {
	JWT_SECRET,
	COOLDOWN_DURATION,
	ROUND_DURATION,
	REDIS_QUEUE_ENDPOINT,
	SERVICES,
	TRANSPORTER,
	LOG_LEVEL,
};
