import { useMemo } from "react";
import { usePrev } from "./usePrev";

export const useDiff = (value: number) => {
	const prevValue = usePrev(value);
	return useMemo(
		() => (prevValue === null ? null : value - (prevValue || 0)),
		[prevValue, value]
	);
};
