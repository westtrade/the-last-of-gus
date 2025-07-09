export const isNikita = (username: string) => {
	return ["nikita", "никита", "niкita", "niкitа", "nikitа"].includes(
		username.toLowerCase()
	);
};

export const isAdmin = (username: string) => {
	return "admin" === username;
};
