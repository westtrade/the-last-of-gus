import { useRef, useState } from "react";

export const useAvgTapMeter = (tapsLimit: number = 100) => {
	const taps = useRef<number[]>([]);
	const [value, setValue] = useState(0);

	const tap = () => {
		const now = performance.now();
		taps.current.push(now);
		taps.current = taps.current
			.reverse()
			.filter((t, idx) => idx <= tapsLimit)
			.reverse();

		const avg =
			taps.current.length === 0 || now - taps.current[0] === 0
				? 0
				: (taps.current.length / (now - taps.current[0])) * 100_000;

		setValue(avg);
	};

	return { tap, value };
};
