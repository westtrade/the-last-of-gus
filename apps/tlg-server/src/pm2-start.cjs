import("./node.ts").catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});
