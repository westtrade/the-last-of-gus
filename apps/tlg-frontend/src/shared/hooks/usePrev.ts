import { useEffect, useRef } from "react";

export function usePrev<T>(value: T): T | null {
	const current = useRef<T>(null);
	const prev = useRef<T>(null);

	useEffect(() => {
		prev.current = current.current;
		current.current = value;
	}, [value]);

	return prev.current;
}
