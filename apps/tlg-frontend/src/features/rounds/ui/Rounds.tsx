import React, {
	useCallback,
	useEffect,
	useState,
	type ReactEventHandler,
} from "react";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import { api } from "lib/api";
import { IconLogout, Loader, useNow } from "shared";
import dayjs from "dayjs";
import SimpleBar from "simplebar-react";
import { Link } from "react-router";
import { roundState } from "lib/roundState";

import "simplebar-react/dist/simplebar.min.css";
import style from "./Rounds.module.scss";

type Props = {
	className?: string;
};

export const Rounds = ({ className }: Props) => {
	const queryClient = useQueryClient();
	const me = queryClient.getQueryData(["auth"]);

	const createRoundMutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.rounds.post();
			if (error) {
				throw error;
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roundsList"] });
		},
	});

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

	const handleCreateRound = useCallback(() => {
		createRoundMutation.mutate();
	}, [createRoundMutation]);

	const rounds = useInfiniteQuery({
		queryKey: ["roundsList"],
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			if (lastPage.totalPages === lastPage.page) {
				return;
			}

			return lastPage.page + 1;
		},
		queryFn: async (params) => {
			const { data, error } = await api.rounds.get({
				query: {
					page: params.pageParam,
				},
			});

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const now = useNow();

	const [reachBottom, setReachBottom] = useState(false);
	useEffect(() => {
		if (reachBottom) {
			rounds.fetchNextPage().then(() => {
				setReachBottom(false);
			});
		}
	}, [reachBottom]);

	const reachBottomHandler = useCallback<ReactEventHandler<HTMLDivElement>>(
		(event) => {
			const scrollabelElement = event.currentTarget.querySelector(
				".simplebar-content-wrapper"
			);

			const reachedBottomNewState =
				scrollabelElement?.scrollHeight ===
				(scrollabelElement?.scrollTop || 0) +
					(scrollabelElement?.clientHeight || 0);

			if (
				reachedBottomNewState !== reachBottom &&
				reachBottom === false
			) {
				setReachBottom(reachedBottomNewState);
			}
		},
		[reachBottom]
	);

	return (
		<div className={clsx(style.wrapper, className)}>
			<div className={style.panel}>
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
					onClick={logoutMutation.mutate}
					disabled={logoutMutation.isPending}
				>
					<IconLogout />
				</button>
			</div>

			<div className={style.roundsTable}>
				{rounds.data?.pages?.at?.(0)?.total === 0 && (
					<div className={style.empty}>Nothing yet...</div>
				)}

				{rounds.data?.pages?.at?.(0)?.total !== 0 && (
					<>
						<SimpleBar
							className={style.tableContent}
							onScrollCapture={reachBottomHandler}
						>
							<div
								className={clsx(
									style.roundsHead,
									style.roundsRow
								)}
							>
								<div className={style.headCell}>ID</div>
								<div className={style.headCell}>
									Start - End
								</div>
								<div className={style.headCell}>Status</div>
							</div>

							{rounds.data?.pages.map(({ rows }, idx) => {
								return (
									<React.Fragment key={idx}>
										{rows?.map(({ id, start, end }) => {
											return (
												<Link
													key={id}
													to={`/round/${id}`}
													className={clsx(
														style.row,
														style.roundsRow
													)}
												>
													<div className={style.cell}>
														{id}
													</div>
													<div className={style.cell}>
														{dayjs(start).format(
															"DD/MM/YY HH:mm:ss"
														)}{" "}
														-&nbsp;
														{dayjs(end).format(
															"DD/MM/YY HH:mm:ss"
														)}
													</div>
													<div className={style.cell}>
														{roundState(
															now.value,
															start,
															end
														)}
													</div>
												</Link>
											);
										})}
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
