export type Roles = "admin" | "nikita" | "survivor";

export type UserModel = {
	id: string;
	username: string;
	password: string;
	role: Roles;
};

export type RawUserModel = Omit<UserModel, "id"> & {
	_id: string;
};

export type UserResponse = Omit<UserModel, "password"> & {
	token?: string;
};

export type AuthMeta = {
	token: string;
};

export type JwtPayload = Pick<UserModel, "id" | "role">;

export type CreateOrLoginParams = {
	username: string;
	password: string;
};

export interface GetUserParams {
	id: string;
}
