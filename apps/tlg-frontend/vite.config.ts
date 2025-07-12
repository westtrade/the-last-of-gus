import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths({ loose: true })],
	css: {
		modules: {
			generateScopedName(name, filename = "", css) {
				const file =
					filename
						.split("/")
						.pop()
						.replace(/\.[^/.]+$/, "")
						.replace(".module", "")
						.toLowerCase() || "__";

				return `${file}__${name
					.replace(/([a-z])([A-Z])/g, "$1-$2")
					.toLowerCase()}-${Math.random()
					.toString(36)
					.substring(2, 8)}`;
			},
		},
	},
});
