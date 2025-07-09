import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "node:path";
import _, { omit } from "lodash";

import { JWT_SECRET } from "../../moleculer-config/config";
import type {
	JwtPayload,
	AuthMeta,
	RawUserModel,
	UserModel,
	UserResponse,
	CreateOrLoginParams,
} from "../models";
import { isAdmin, isNikita } from "../libs";

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
			async handler(
				ctx: Context<undefined, AuthMeta>
			): Promise<UserResponse> {
				const { token } = ctx.meta;
				const { id: userId } = jwt.verify(
					token,
					JWT_SECRET
				) as JwtPayload;

				let rawUser: RawUserModel | null = await this.adapter.findById(
					userId
				);

				if (!rawUser) {
					throw new Error("user_not_found");
				}

				const user = this.adapter.afterRetrieveTransformID(
					rawUser,
					this.settings.idField
				) as UserModel;

				return {
					..._.omit(user, ["password"]),
					token,
				};
			},
		},

		createOrLogin: {
			params: { username: "string", password: "string" },
			async handler(ctx: Context<CreateOrLoginParams>) {
				const { username, password: passwordInput } = ctx.params;

				let rawUser: RawUserModel | null = await this.adapter.findOne({
					username,
				});

				if (rawUser) {
					if (
						!(await bcrypt.compare(passwordInput, rawUser.password))
					) {
						throw new Error("invalid_password");
					}
				} else {
					const role = isAdmin(username)
						? "admin"
						: isNikita(username)
						? "nikita"
						: "survivor";

					const password = await bcrypt.hash(passwordInput, 10);
					rawUser = await this.adapter.insert({
						username,
						password,
						role,
					});
				}

				const user: UserModel = this.adapter.afterRetrieveTransformID(
					rawUser,
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
