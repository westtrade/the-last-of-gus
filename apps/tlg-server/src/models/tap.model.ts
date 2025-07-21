export type TapModel = {
	id: string;
	userId: string;
	roundId: string;
	taps: number;
	score: number;
};

export type RawTapModel = Omit<TapModel, "id"> & {
	_id?: string;
};

export type TapResponse = TapModel & {
	addScore: number;
};

export type CreateTapParams = {
	roundId: string;
	clientId?: string;
};

export type FindOneTapParams = {
	userId: string;
	roundId: string;
};
