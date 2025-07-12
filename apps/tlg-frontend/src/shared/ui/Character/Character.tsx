import React, {
	useCallback,
	useMemo,
	useRef,
	useState,
	type FC,
	type TouchEventHandler,
} from "react";
import { random, sample, debounce } from "lodash";
import { motion, AnimatePresence, useCycle } from "framer-motion";

import { CharacterLevel0 } from "./levels/CharacterLevel0";
import { CharacterLevel1 } from "./levels/CharacterLevel1";
import { CharacterLevel2 } from "./levels/CharacterLevel2";
import { CharacterHead } from "./CharacterHead";
import { FormatNumber } from "../FormatNumber";

import "./Character.style.sass";

interface Props {
	onHit?: TouchEventHandler<HTMLButtonElement>;
	level?: number;
	changePerClick?: string;
}

const levels = [CharacterLevel0, CharacterLevel1, CharacterLevel2];

interface FallingHeads {
	id: number | string;
	x: number;
	y: number;
	toX: number;
	toY: number | number[];
}

interface AmountLabel {
	id: number | string;
	amount: number | string;
	initialX: number;
	initialY: number;
	resultY: number;
}

export const Character: FC<Props> = ({
	onHit,
	level = 0,
	changePerClick = 0,
}) => {
	const CurrentLevel = useMemo(() => {
		return levels.at(level) || (levels.at(-1) as FC);
	}, [level]);

	const [bounceAnimation, cycle] = useCycle(
		{ scale: 1, y: 0 },
		{ scale: 0.8, y: 16 }
	);

	let timer: Timer;

	const [amountLabels, setAmountLabels] = useState<AmountLabel[]>([]);
	const [heads, setHeads] = useState<FallingHeads[]>([]);

	function addLabels(x: number, y: number, changePerClick: string | number) {
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
					amount: changePerClick,
					initialX: x,
					initialY: y,
					resultY: y - 180,
				},
				...labels.slice(0, 5),
			];

			return newLabels;
		});
	}

	const handleTap = useCallback(
		debounce((event: TouchEvent) => {
			const touches = Array.from(event.targetTouches);
			const targetElement = event.target as HTMLElement;

			const elementPosition = targetElement.getBoundingClientRect();
			for (const touch of touches) {
				const x = touch.clientX - elementPosition.left - 2;
				const y = touch.clientY - elementPosition.top - 6;
				addLabels(x, y, changePerClick);
			}

			clearTimeout(timer);
			cycle();

			timer = setTimeout(cycle, 100);

			if (onHit) {
				onHit(event);
			}
		}, 10),
		[changePerClick]
	);

	const handleClick = useCallback(
		debounce((event: MouseEvent) => {
			const hasTouchEvents =
				"ontouchstart" in window ||
				navigator.maxTouchPoints > 0 ||
				navigator.msMaxTouchPoints > 0 ||
				window.matchMedia("(pointer: coarse)").matches;

			if (hasTouchEvents) {
				return;
			}

			const targetElement = event.target as HTMLElement;
			const elementPosition = targetElement.getBoundingClientRect();
			const x = event.clientX - elementPosition.left - 2;
			const y = event.clientY - elementPosition.top - 6;
			addLabels(x, y, changePerClick);

			clearTimeout(timer);
			cycle();

			timer = setTimeout(cycle, 100);

			if (onHit) {
				onHit(event);
			}
		}, 10),
		[changePerClick]
	);

	const handleAnimationComplete = useCallback((id: number | string) => {
		setHeads((prevInstances) =>
			prevInstances.filter((instance) => instance.id !== id)
		);
	}, []);

	const animationElement = useRef<HTMLDivElement>(null);

	return (
		<div className="character">
			<motion.div
				className="character__wrapper"
				animate={bounceAnimation}
				transition={{
					duration: 0.2,
				}}
			>
				<button
					type="button"
					className="character__element"
					onTouchEnd={handleTap}
					onClick={handleClick}
				>
					<CurrentLevel />
				</button>
			</motion.div>

			<div className="character__animation" ref={animationElement}>
				<AnimatePresence>
					{amountLabels.map((label) => {
						return (
							<motion.div
								className="character__reward"
								key={label.id}
								initial={{
									x: label.initialX,
									y: label.initialY,
									opacity: 1,
								}}
								animate={{
									y: label.resultY,
									opacity: 0,
								}}
								transition={{
									ease: "easeInOut",
									duration: 0.6,
								}}
							>
								<FormatNumber value={label.amount} />
							</motion.div>
						);
					})}

					{heads.map(({ id, x, y, toX, toY }) => {
						return (
							<motion.div
								className="character__falling-head"
								key={id}
								initial={{ x, y, opacity: 1 }}
								animate={{
									x: toX,
									y: toY,
									opacity: [1, 0.9, 0.9, 0.9, 0.5, 0.5, 0],
								}}
								transition={{
									duration: 0.6,
									ease: "easeInOut",
								}}
								exit={{ opacity: 0 }}
								onAnimationComplete={() =>
									handleAnimationComplete(id)
								}
								data-key={id}
								data-x={x}
								data-y={y}
							>
								<CharacterHead />
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			<svg
				viewBox="0 0 130 129"
				fill="none"
				className="character__shiny"
				role="graphics-symbol"
			>
				<path
					d="M129.758 64.456C129.758 54.7725 127.578 45.2132 123.38 36.4867L65.2336 64.456H129.758Z"
					fill="url(#paint0_radial_40_53)"
				/>
				<path
					d="M97.4955 8.57671C89.1093 3.73495 79.7409 0.842834 70.0848 0.114777L65.2336 64.456L97.4955 8.57671Z"
					fill="url(#paint1_radial_40_53)"
				/>
				<path
					d="M32.9716 8.57671C24.5855 13.4185 17.3966 20.0857 11.938 28.0841L65.2336 64.456L32.9716 8.57671Z"
					fill="url(#paint2_radial_40_53)"
				/>
				<path
					d="M0.709717 64.4561C0.709718 74.1396 2.88928 83.6989 7.08682 92.4254L65.2336 64.456L0.709717 64.4561Z"
					fill="url(#paint3_radial_40_53)"
				/>
				<path
					d="M32.9716 120.335C41.3578 125.177 50.7262 128.069 60.3823 128.797L65.2336 64.456L32.9716 120.335Z"
					fill="url(#paint4_radial_40_53)"
				/>
				<path
					d="M97.4955 120.335C105.882 115.494 113.071 108.826 118.529 100.828L65.2336 64.456L97.4955 120.335Z"
					fill="url(#paint5_radial_40_53)"
				/>
				<defs>
					<radialGradient
						id="paint0_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
					<radialGradient
						id="paint1_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
					<radialGradient
						id="paint2_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
					<radialGradient
						id="paint3_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
					<radialGradient
						id="paint4_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
					<radialGradient
						id="paint5_radial_40_53"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(65.2336 64.456) rotate(34.3574) scale(64.8645)"
					>
						<stop stopColor="white" />
						<stop offset="1" stopColor="white" stopOpacity="0" />
					</radialGradient>
				</defs>
			</svg>

			<svg
				viewBox="0 0 124 29"
				className="character__shadow"
				role="graphics-symbol"
			>
				<ellipse
					cx="62"
					cy="14.5"
					rx="62"
					ry="14.5"
					fill="url(#paint0_radial_32_100)"
				/>
				<defs>
					<radialGradient
						id="paint0_radial_32_100"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="translate(62 14.5) scale(62 14.5)"
					>
						<stop offset="0.65" stopColor="#6FA535" />
						<stop
							offset="1"
							stopColor="#6FA535"
							stopOpacity="0.2"
						/>
					</radialGradient>
				</defs>
			</svg>
		</div>
	);
};
