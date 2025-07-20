import type { ServiceSchema } from "moleculer";

export const CacheSyncMixin: Partial<ServiceSchema> = {
	events: {
		"cache.clear"(this, payload: { serviceNames: string[] }) {
			if (
				!payload?.serviceNames ||
				!payload.serviceNames.includes(this.name)
			) {
				return;
			}

			const pattern = `${this.name}.*`;
			this.logger.debug(`Clearing local cache with pattern: ${pattern}`);
			if (this.broker.cacher) {
				this.broker.cacher.clean(pattern);
			}
		},
	},

	hooks: {
		after: {
			create(ctx) {
				ctx.broker.broadcast("cache.clear", {
					serviceNames: [this.name],
				});
			},
			insert(ctx) {
				ctx.broker.broadcast("cache.clear", {
					serviceNames: [this.name],
				});
			},
			update(ctx) {
				ctx.broker.broadcast("cache.clear", {
					serviceNames: [this.name],
				});
			},
			remove(ctx) {
				ctx.broker.broadcast("cache.clear", {
					serviceNames: [this.name],
				});
			},
			clear(ctx) {
				ctx.broker.broadcast("cache.clear", {
					serviceNames: [this.name],
				});
			},
		},
	},
};
