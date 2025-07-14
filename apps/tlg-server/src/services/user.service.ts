import type { ServiceSchema, Context } from "moleculer";
import DbService, { MemoryAdapter } from "moleculer-db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "node:path";
import _, { omit } from "lodash";
import { isAdmin, isNikita } from "../libs";

import { JWT_SECRET } from "../../moleculer-config/config";
import type {
	JwtPayload,
	AuthMeta,
	RawUserModel,
	UserModel,
	UserResponse,
	CreateOrLoginParams,
} from "../models";

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

		getSafe: {
			params: {
				id: "array|item:string|optional",
			},
			cache: {
				keys: ["id"],
				ttl: 40,
			},
			async handler(ctx: Context<{ id: string }>) {
				const rawUsersMap = (await this.actions.get(
					ctx.params
				)) as Record<string, UserResponse>;

				return Object.fromEntries(
					Object.values(rawUsersMap).map((rawUser) => [
						rawUser.id,
						_.omit(rawUser, "password"),
					])
				);
			},
		},

		createOrLogin: {
			params: {
				username: "string|min:3|max:16",
				password: "string|min:3|max:16",
			},
			async handler(ctx: Context<CreateOrLoginParams>) {
				const { username, password: passwordInput } = ctx.params;

				let rawUser: RawUserModel | null = await this.adapter.findOne({
					username,
				});

				if (rawUser) {
					if (
						!(await bcrypt.compare(passwordInput, rawUser.password))
					) {
						throw new Error("user_not_found");
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
