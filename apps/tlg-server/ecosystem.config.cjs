const { name } = require("./package.json");

module.exports = {
	apps: [
		{
			name,
			script: "./src/pm2-start.cjs",
			interpreter: "bun",
			args: "run --bun src/node.ts",
			ignore_watch: ["node_modules", "logs"],
			max_memory_restart: "500M",
			exec_mode: "fork",
		},
	],
};
