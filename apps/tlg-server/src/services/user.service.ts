import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "node:path";
import omit from "lodash.omit";

import { JWT_SECRET } from "../config";

export const UserService: ServiceSchema = {
	name: "users",
	mixins: [DbService],

	adapter: new MemoryAdapter({
		filename: path.resolve(__dirname, "../../data/users.db"),
	}),

	settings: {
		idField: "id",
		fields: ["id", "username", "password", "role"],
	},

	actions: {
		me: {
			async handler(ctx: Context<undefined, { token: string }>) {
				const { token } = ctx.meta;

				const { id: userId } =
					(jwt.verify(token, JWT_SECRET) as {
						id: string;
					}) || {};

				let user = await this.adapter.findById(userId);
				if (!user) {
					throw new Error("user_not_found");
				}

				user = this.adapter.afterRetrieveTransformID(
					user,
					this.settings.idField
				);

				return {
					...omit(user, ["password"]),
					token,
				};
			},
		},

		createOrLogin: {
			params: { username: "string", password: "string" },
			async handler(
				ctx: Context<{ username: string; password: string }>
			) {
				const { username, password: passwordInput } = ctx.params;

				let user = await this.adapter.findOne({ username });

				if (user) {
					if (!(await bcrypt.compare(passwordInput, user.password))) {
						throw new Error("invalid_password");
					}
				} else {
					const role =
						username === "admin"
							? "admin"
							: [
									"nikita",
									"никита",
									"niкita",
									"niкitа",
									"nikitа",
							  ].includes(username.toLowerCase())
							? "nikita"
							: "survivor";

					const password = await bcrypt.hash(passwordInput, 10);
					user = await this.adapter.insert({
						username,
						password,
						role,
					});
				}

				user = this.adapter.afterRetrieveTransformID(
					user,
					this.settings.idField
				);

				const token = jwt.sign(
					{ id: user.id, role: user.role },
					JWT_SECRET
				);
				return {
					...omit(user, ["password"]),
					token,
				};
			},
		},
	},
};
