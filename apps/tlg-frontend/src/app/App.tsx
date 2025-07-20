import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Outlet, Link } from "react-router";
import {
	QueryClient,
	QueryClientProvider,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { api, Preloader } from "@shared";
import logoSrc from "./assets/title.png";
import notFoundSrc from "@shared/assets/404bgCarpet.png";

const queryClient = new QueryClient();

const LazyRound = lazy(() => import("../features/round/ui/Round.tsx?prefetch"));
const LazyRounds = lazy(
	() => import("../features/rounds/ui/Rounds.tsx?prefetch")
);
const LazyAuth = lazy(() => import("../features/auth/ui/Auth.tsx?prefetch"));

const AuthLock = () => {
	const { isPending, error, data } = useSuspenseQuery({
		queryKey: ["auth"],
		queryFn: async () => {
			const { data } = await api.auth.me.get();
			return data;
		},
	});

	return <>{data ? <Outlet /> : <LazyAuth />}</>;
};

const NotFoundPage = () => {
	return (
		<div className="not-found">
			<img src={notFoundSrc} width="100%" className="not-found__cover" />
		</div>
	);
};

export const App = () => {
	useEffect(() => {
		globalThis.PRELOADER.isStopped = true;
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<div className="container">
				<Link to="/" className="header">
					<img src={logoSrc} className="header__logo" />
				</Link>

				<div className="container__content">
					<Suspense fallback={<Preloader />}>
						<Routes>
							<Route element={<AuthLock />}>
								<Route path="/" element={<LazyRounds />} />
								<Route
									path="/round/:roundId"
									element={<LazyRound />}
								/>
							</Route>

							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</Suspense>
				</div>
			</div>
		</QueryClientProvider>
	);
};
