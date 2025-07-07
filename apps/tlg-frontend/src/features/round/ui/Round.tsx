import React, {
	useCallback,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useParams } from "react-router";
import { api } from "lib/api";
import { Character, useNow } from "shared";
import { roundState } from "lib/roundState";
import dayjs from "dayjs";
import { formatTime } from "lib/formatTime";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(duration);
dayjs.extend(relativeTime);

import style from "./Round.module.scss";

type Props = {
	className?: string;
};

export const Round = ({ className }: Props) => {
	const queryClient = useQueryClient();
	const me = queryClient.getQueryData(["auth"]);
	const params = useParams<{
		roundId: string;
	}>();

	const hitRef = useRef(1);

	const round = useQuery({
		queryKey: ["round", params.roundId],
		queryFn: async () => {
			const { data, error } = await api.rounds[params.roundId].get();

			if (error) {
				throw error;
			}

			return data;
		},
		enabled: Boolean(params.roundId),
	});

	const tap = useMutation<{
		roundId: string;
	}>({
		mutationFn: async (body) => {
			const { data, error } = await api.rounds.tap.post(body);
			if (error) {
				throw error;
			}

			return data;
		},

		onSuccess(data, variables, context) {
			hitRef.current = data.addScore;
		},
	});

	const now = useNow();

	const roundProgress = useMemo(() => {
		const myScore = tap.data?.score ?? 0;
		const state = roundState(now.value, round.data?.start, round.data?.end);

		const message =
			state === "finished"
				? `Winner `
				: state === "cooldown"
				? `${formatTime(
						dayjs(round.data?.start).diff(now.value)
				  )} until the round starts`
				: `Time left: ${formatTime(
						dayjs(now.value).diff(round.data?.end)
				  )}`;

		return {
			myScore,
			message,
			state,
		};
	}, [round.data, now, tap.data]);

	const onTapHandler = useCallback(() => {
		tap.mutate(params);
	}, [params]);

	return (
		<div className={clsx(style.wrapper, className)}>
			<div className={style.panel}>
				<div className={style.username}>{me?.username}</div>
			</div>

			<div className={style.character}>
				<Character
					level={1}
					changePerClick={`${hitRef.current}`}
					onHit={onTapHandler}
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

				<div>{roundProgress.message}</div>

				{["active", "finished"].includes(roundProgress.state) && (
					<div>My score: {roundProgress.myScore}</div>
				)}
			</div>
		</div>
	);
};
