import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	RoundResponse,
	TapResponse,
	UserResponse,
} from "@westtrade/tlg-server";
import { useParams } from "react-router";
import {
	api,
	Character,
	formatTime,
	roundState,
	useNow,
	useAvgTapMeter,
	ColorNumber,
	usePrev,
} from "@shared";
import type { EdenWS } from "@elysiajs/eden/treaty";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(duration);
dayjs.extend(relativeTime);

import style from "./Round.module.scss";
import { backgroundMusic, tapSound } from "@shared/lib/sounds";

const MAX_POSSIBLE_TAPS = 690;

export const Round = () => {
	const queryClient = useQueryClient();
	const me = queryClient.getQueryData<UserResponse>(["auth"]);
	const { roundId = "-1" } = useParams<{ roundId: string }>();
	const now = useNow();
	const roundControllerRef = useRef<EdenWS<any> | null>(null);

	const round = useQuery({
		queryKey: ["round", roundId],
		queryFn: async () => {
			const { data, error } = await api.rounds({ roundId }).get();

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const [data, setData] = useState<{
		round: RoundResponse;
		tap: TapResponse;
	}>({
		round: {
			roundId: "-1",
			name: "",
			start: 0,
			end: 0,
			totalScore: 0,
			bestScore: 0,
			winnerUserId: null,
			winnerUser: null,
		},
		tap: {
			id: "-1",
			userId: "-1",
			roundId: "-1",
			score: 0,
			addScore: 0,
			taps: 0,
		},
	});

	useEffect(() => {
		setData((state) => {
			const currentRound = round.data?.round ?? state.round;
			const tap = round.data?.tap ?? state.tap;

			return {
				round: currentRound,
				tap,
			};
		});
	}, [round.data]);

	const roundProgress = useMemo(() => {
		const { round: roundData, tap: tapData } = data;

		const state = roundState(now.value, roundData?.start, roundData?.end);

		const myScore = tapData?.score ?? 0;
		const addScore = tapData?.addScore ?? 0;

		const isActive = state === "active";

		const currentNow = Date.now();
		const actualNow = currentNow > now.value ? currentNow : now.value;

		const message =
			state === "finished"
				? `Winner: ${roundData?.winnerUser?.username} (${roundData?.bestScore}/${roundData?.totalScore})`
				: state === "cooldown"
				? `<span class="${style.timeLeft}">${formatTime(
						dayjs(roundData?.start).diff(actualNow)
				  )}</span> until the round starts`
				: `Time left: <span class="${style.timeLeft}">${formatTime(
						dayjs(actualNow).diff(roundData?.end)
				  )}</span>`;

		return {
			isActive,
			addScore,
			myScore,
			message,
			state,
		};
	}, [now, data]);

	useEffect(() => {
		const { round: roundData } = round.data ?? {};
		const state = roundState(now.value, roundData?.start, roundData?.end);

		const currentNow = Date.now();
		const actualNow = currentNow > now.value ? currentNow : now.value;

		if (
			dayjs(roundData?.start).diff(actualNow) < 15_000 &&
			!backgroundMusic.playing() &&
			state !== "finished"
		) {
			const musicId = backgroundMusic.play();
			backgroundMusic.fade(0, 0.3, 2000, musicId);
		} else if (state === "finished") {
			backgroundMusic.stop();
		}
	}, [round.data, now]);

	useEffect(() => {
		backgroundMusic.stop();
		return () => {
			backgroundMusic.stop();
		};
	}, []);

	const tapMeter = useAvgTapMeter(1_000);

	const onTapHandler = useCallback(() => {
		if (roundControllerRef.current) {
			console.time("tap");
			roundControllerRef.current.send("tap");

			tapSound.play("click");
			tapMeter.tap();
		}
	}, [roundControllerRef.current, tapMeter]);

	useEffect(() => {
		roundControllerRef.current = api.rounds({ roundId }).ws.subscribe();

		roundControllerRef.current.subscribe(({ data }) => {
			console.timeEnd("tap");
			queryClient.setQueryData(["round", roundId], data);
		});

		return () => {
			roundControllerRef.current?.close();
		};
	}, [roundId]);

	const tapsPower = useMemo(() => {
		const { round: roundData } = round.data ?? {};
		const state = roundState(now.value, roundData?.start, roundData?.end);

		if (state !== "active") {
			return 0;
		}

		return Math.round((tapMeter.value / MAX_POSSIBLE_TAPS) * 100);
	}, [round.data, tapMeter.value]);

	const characterLevel = useMemo(() => {
		const { round: roundData, tap: tapData } = round.data ?? {};
		const state = roundState(now.value, roundData?.start, roundData?.end);

		if (state === "cooldown") {
			return 0;
		}

		if (
			roundData?.bestScore === tapData?.score &&
			roundData?.bestScore !== 0
		) {
			return 1;
		}

		if (
			(tapData?.score ?? 0) < (roundData?.bestScore ?? 0) * 0.3 &&
			roundData?.bestScore !== 0
		) {
			return 2;
		}

		return 0;
	}, [round.data]);

	return (
		<div className={style.wrapper}>
			<div className={style.panel}>
				<div className={style.username}>{me?.username}</div>
			</div>

			<div
				className={style.character}
				style={{
					"--taps-power": `${tapsPower}%`,
				}}
			>
				<Character
					level={characterLevel}
					changePerClick={`${roundProgress.addScore > 1 ? "🦠" : 1}`}
					onHit={onTapHandler}
					isActive={roundProgress.isActive}
				/>
			</div>
			<div className={style.panelBottom}>
				<div className={style.state}>
					{roundProgress.state === "active"
						? "🟢 Round is active!"
						: roundProgress.state === "finished"
						? "🔴 Round is finished!"
						: "🧊 Cooldown..."}
				</div>

				<div
					dangerouslySetInnerHTML={{ __html: roundProgress.message }}
				></div>

				{["active", "finished"].includes(roundProgress.state) && (
					<div>
						My score: <ColorNumber value={roundProgress.myScore} />
					</div>
				)}
			</div>
		</div>
	);
};
