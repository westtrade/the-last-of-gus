import dayjs, { type Dayjs } from "dayjs";

export const roundState = (
	now: number | Date | Dayjs,
	start: number | Date | Dayjs | undefined,
	end: number | Date | Dayjs | undefined
) => {
	const nowDayjs = dayjs(now);

	return nowDayjs.isBefore(start)
		? "cooldown"
		: nowDayjs.isAfter(end)
		? "finished"
		: "active";
};
