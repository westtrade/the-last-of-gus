import { useEffect, useRef, useState } from "react";

export function usePrev<T>(value: T): T | null {
	const current = useRef<T>(null);
	const [prev, setPrev] = useState<T | null>(null);

	useEffect(() => {
		setPrev(current.current);
		current.current = value;
	}, [value]);

	return prev;
}
