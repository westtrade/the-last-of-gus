import { useCallback, useRef, useState } from "react";
import { random, sample, debounce } from "lodash";

export type Tap = {
	x: number;
	y: number;
};
export interface FallingHeads {
	id: number | string;
	x: number;
	y: number;
	toX: number;
	toY: number | number[];
}

export interface AmountLabel {
	id: number | string;
	amount: number | string;
	initialX: number;
	initialY: number;
	resultY: number;
}

export const useScoreLabels = () => {
	const tapsRef = useRef<Record<string, Tap>>({});
	const [labels, setAmountLabels] = useState<AmountLabel[]>([]);
	const [heads, setHeads] = useState<FallingHeads[]>([]);

	const addTap = useCallback((point: Tap) => {
		const clientId = Math.random().toString(16).slice(2);
		tapsRef.current[clientId] = point;
		return clientId;
	}, []);

	const addTapResponse = useCallback((clientId: string, addScore: number) => {
		const tap = tapsRef.current[clientId] ?? null;
		delete tapsRef.current[clientId];

		if (tap) {
			const { x, y } = tap;

			const totalItems = random(1, 3);

			const instances: FallingHeads[] = [];
			for (let index = 1; index <= totalItems; index++) {
				instances.push({
					id: Date.now() + index,
					x,
					y,
					toX: x + random(5, 65) * sample([-1, 1]),
					toY: [y, y - random(-5, 45), y + 150],
				});
			}

			setHeads((prevInstances) => {
				return [...instances, ...prevInstances].slice(0, 10);
			});

			setAmountLabels((labels) => {
				const newLabels = [
					{
						id: `${Date.now()}.${random()}.${labels.length}`,
						amount: addScore,
						initialX: x,
						initialY: y,
						resultY: y - 180,
					},
					...labels.slice(0, 5),
				];

				return newLabels;
			});
		}
	}, []);

	const removeHead = useCallback((headId: string) => {
		setHeads((heads) => {
			return heads.filter((head) => head.id === headId);
		});
	}, []);

	return {
		addTap,
		addTapResponse,
		labels,
		heads,
		removeHead,
	};
};
