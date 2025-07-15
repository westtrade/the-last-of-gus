import { lazy, Suspense } from "react";
import { Route, Routes, Outlet, Link } from "react-router";
import {
	QueryClient,
	QueryClientProvider,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { api } from "@shared";
import logoSrc from "./assets/title.png";

const queryClient = new QueryClient();

const LazyRound = lazy(() => import("../features/round/ui/Round.tsx"));
const LazyRounds = lazy(() => import("../features/rounds/ui/Rounds.tsx"));
const LazyAuth = lazy(() => import("../features/auth/ui/Auth.tsx"));

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

export const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="container">
				<Link to="/" className="header">
					<img src={logoSrc} className="header__logo" />
				</Link>

				<div className="container__content">
					<Suspense
						fallback={<div className="loading">Loading...</div>}
					>
						<Routes>
							<Route element={<AuthLock />}>
								<Route path="/" element={<LazyRounds />} />
								<Route
									path="/round/:roundId"
									element={<LazyRound />}
								/>
							</Route>
						</Routes>
					</Suspense>
				</div>
			</div>
		</QueryClientProvider>
	);
};
