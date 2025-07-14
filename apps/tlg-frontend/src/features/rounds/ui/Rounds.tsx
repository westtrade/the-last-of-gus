import React, { useCallback, useEffect, useRef } from "react";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import { api, IconLogout, Loader, roundState, useNow } from "@shared";
import dayjs from "dayjs";
import SimpleBar from "simplebar-react";
import { Link } from "react-router";
import type {
	ListResponse,
	RoundResponse,
	UserResponse,
} from "@westtrade/tlg-server";
import type SimpleBarCore from "simplebar-core";

import "simplebar-react/dist/simplebar.min.css";
import style from "./Rounds.module.scss";

const SCROLL_CHECK_OFFSET = 20;
const PAGE_SIZE = 25;

const Header = () => {
	const queryClient = useQueryClient();
	const me = queryClient.getQueryData<UserResponse>(["auth"]);

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.auth.logout.post();
			if (error) {
				throw error;
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
	});

	const createRoundMutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.rounds.post();
			if (error?.value) {
				throw error?.value;
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["roundsList"],
			});
		},
	});

	const handleCreateRound = useCallback(() => {
		createRoundMutation.mutate();
	}, [createRoundMutation]);

	return (
		<div className={style.header}>
			{me?.role === "admin" ? (
				<button
					role="button"
					className={style.createRound}
					onClick={handleCreateRound}
					disabled={createRoundMutation.isPending}
				>
					Create round
					{createRoundMutation.isPending && <Loader />}
				</button>
			) : (
				""
			)}
			<div className={style.username}>{me?.username}</div>

			<button
				className={style.logoutButton}
				onClick={() => logoutMutation.mutate()}
				disabled={logoutMutation.isPending}
			>
				<IconLogout />
			</button>
		</div>
	);
};

const Row = ({
	id,
	start,
	end,
	winnerUser,
	bestScore,
	totalScore,
}: RoundResponse) => {
	const now = useNow();

	return (
		<Link
			key={id}
			to={`/round/${id}`}
			className={clsx(style.row, style.roundsRow)}
		>
			<div className={style.cell}>{id}</div>
			<div className={style.cell}>
				{dayjs(start).format("DD/MM HH:mm:ss")} -&nbsp;
				{dayjs(end).format("DD/MM HH:mm:ss")}
			</div>
			<div className={style.cell}>
				{winnerUser && (
					<span>
						{winnerUser.username} ({bestScore}/{totalScore})
					</span>
				)}
			</div>
			<div className={style.cell}>
				{roundState(now.value, start, end)}
			</div>
		</Link>
	);
};

export const Rounds = () => {
	const scrollableElementRef = useRef<SimpleBarCore>(null);

	const roundsQuery = useInfiniteQuery<ListResponse<RoundResponse>>({
		queryKey: ["roundsList"],
		initialPageParam: 1,
		refetchInterval: 1_000,
		getNextPageParam: ({ page, totalPages, rows }) => {
			return page === totalPages || rows.length === 0
				? undefined
				: page + 1;
		},
		queryFn: async (params) => {
			const { data, error } = await api.rounds.get({
				query: {
					page: params.pageParam as number,
					pageSize: PAGE_SIZE,
					populate: "winnerUser",
				},
			});

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const checkBottomIsReached = useCallback(() => {
		const scrollableElement =
			scrollableElementRef.current?.contentWrapperEl;

		const {
			scrollHeight = 0,
			scrollTop = 0,
			clientHeight = 0,
		} = scrollableElement || {};

		const reachedBottom =
			scrollHeight - SCROLL_CHECK_OFFSET <= scrollTop + clientHeight;

		if (
			!scrollableElement ||
			!reachedBottom ||
			!roundsQuery.hasNextPage ||
			roundsQuery.isFetchingNextPage
		) {
			return;
		}

		roundsQuery.fetchNextPage();
	}, [scrollableElementRef.current, roundsQuery]);

	useEffect(() => {
		if (!roundsQuery.isFetching) {
			checkBottomIsReached();
		}
	}, [roundsQuery]);

	return (
		<div className={style.wrapper}>
			<Header />

			<div className={style.roundsTable}>
				{roundsQuery.data?.pages.at?.(0)?.total === 0 && (
					<div className={style.empty}>Nothing yet...</div>
				)}

				{roundsQuery.data?.pages?.at?.(0)?.total !== 0 && (
					<>
						<div
							className={clsx(style.roundsHead, style.roundsRow)}
						>
							<div className={style.headCell}>ID</div>
							<div className={style.headCell}>Start - End</div>
							<div className={style.headCell}>Winner</div>
							<div className={style.headCell}>Status</div>
						</div>

						<SimpleBar
							className={style.tableContent}
							onScrollCapture={checkBottomIsReached}
							ref={scrollableElementRef}
						>
							{roundsQuery.data?.pages.map(({ rows }, idx) => {
								return (
									<React.Fragment key={idx}>
										{rows?.map((row) => (
											<Row {...row} key={row.id} />
										))}
									</React.Fragment>
								);
							})}
						</SimpleBar>
					</>
				)}
			</div>
		</div>
	);
};
