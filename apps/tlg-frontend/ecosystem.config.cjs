const { name } = require("./package.json");

module.exports = {
	apps: [
		{
			name,
			script: "./src/pm2-start.cjs",
			interpreter: "bun",
			args: "run --bun",
			ignore_watch: ["node_modules", "logs"],
			max_memory_restart: "500M",
			exec_mode: "fork",
			env: {
				NODE_ENV: "production",
				SERVICES: "taps,rounds,users",
				LOG_LEVEL: "fatal",
				TRANSPORTER: "redis://localhost:6379",
				REDIS_QUEUE_ENDPOINT: "redis://localhost:6379",
				HTTP_PORT: 3004,
			},
		},
	],
};
