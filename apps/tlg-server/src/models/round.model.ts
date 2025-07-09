import type { UserModel } from "./user.model";

export type RoundStatus = "active" | "cooldown" | "finished";

export type RoundModel = {
	id: string;
	start: Date;
	end: Date;
	cooldown: number;
	winner: string | null;
	totalScore: number;
	taps: number;
	winnerUser: UserModel | null;
	bestScore: number;
};

export type RawRoundModel = Omit<RoundModel, "id" | "winnerUser"> & {
	_id: string;
};

export type RoundResponse = RoundModel & {
	status: RoundStatus;
};

export type CreateRoundParams = {
	start: Date;
	end: Date;
};

export type GetRoundParams = {
	id: string;
};
