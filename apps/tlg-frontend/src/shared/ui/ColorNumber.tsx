// ColorNumber.tsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormatNumber, MutedZeros, usePrev } from "@shared";

import style from "./ColorNumber.module.scss";

type Diff = {
	id: number;
	value: number;
	colorClass: string;
};

type Props = {
	value: number;
	duration?: number;
};

export const ColorNumber: React.FC<Props> = ({ value, duration = 500 }) => {
	const [diffs, setDiffs] = useState<Diff[]>([]);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const prevValue = usePrev(value) || 0;

	useEffect(() => {
		const diffValue = value - prevValue;
		if (diffValue !== 0) {
			const colorClass = diffValue > 0 ? style.increase : style.decrease;
			const id = Date.now() + Math.random();

			const newDiff: Diff = {
				id,
				value: diffValue,
				colorClass,
			};

			setDiffs((prev) => [newDiff]);

			const timeout = setTimeout(() => {
				setDiffs((prev) => prev.filter((d) => d.id !== id));
				timeoutsRef.current = timeoutsRef.current.filter(
					(t) => t !== timeout
				);
			}, duration);

			timeoutsRef.current.push(timeout);
		}

		return () => {};
	}, [duration, prevValue]);

	useEffect(() => {
		return () => {
			timeoutsRef.current.forEach(clearTimeout);
		};
	}, []);

	return (
		<span className={style.wrapper}>
			<MutedZeros value={value.toString().padStart(10, "0")} />

			<AnimatePresence>
				{diffs.map(({ id, value, colorClass }) => (
					<motion.span
						key={id}
						initial={{
							opacity: 1,
							y: value < 0 ? 0 : -45,
						}}
						animate={{
							opacity: 0,
							y: value < 0 ? 45 : 0,
						}}
						exit={{ opacity: 0 }}
						transition={{
							duration: duration / 1000,
							ease: "linear",
						}}
						className={`${style.flyingNumber} ${colorClass}`}
					>
						{value > 0 ? "+" : "-"}

						<FormatNumber value={Math.abs(value)} />
					</motion.span>
				))}
			</AnimatePresence>
		</span>
	);
};
