import { useEffect, useState } from "react";

export const useNow = () => {
	const [value, setValue] = useState(Date.now());

	useEffect(() => {
		let timer: NodeJS.Timeout;
		const cycle = () => {
			timer = setTimeout(() => {
				setValue(Date.now());
				cycle();
			}, 1_000);
		};

		cycle();

		return () => {
			clearTimeout(timer);
		};
	});

	return { value };
};
