export const formatTime = (ms: number) => {
	const secondsFromStart = Math.abs(Math.floor(ms / 1000));

	const minutesFromStart = Math.floor(secondsFromStart / 60)
		.toString()
		.padStart(2, "0");
	const currentSecond = (secondsFromStart % 60).toString().padStart(2, "0");

	return `${minutesFromStart}:${currentSecond}`;
};
