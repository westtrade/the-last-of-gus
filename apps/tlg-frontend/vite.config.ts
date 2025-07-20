import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import viteCompression from "vite-plugin-compression";
import prefetchPlugin from "vite-plugin-bundle-prefetch";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [
					[
						"babel-plugin-react-compiler",
						{
							target: "19",
							experimental: true,
						},
					],
				],
			},
		}),
		tsconfigPaths({ loose: true }),
		viteCompression({
			algorithm: "brotliCompress",
		}),
		viteCompression({
			algorithm: "gzip",
		}),
		// prefetchPlugin(),
		ViteImageOptimizer({}),
	],
	css: {
		modules: {
			generateScopedName(name, filename = "", css) {
				if (css.includes("@keyframes")) {
					return name;
				}

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
