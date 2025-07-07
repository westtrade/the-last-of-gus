import { Route, Routes, Outlet, Link } from "react-router";
import { Auth, Round, Rounds } from "features";
import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { api } from "lib/api";

import logoSrc from "./assets/title.png";

const queryClient = new QueryClient();

const AuthLock = () => {
	const { isPending, error, data } = useQuery({
		queryKey: ["auth"],
		queryFn: async () => {
			const { data } = await api.auth.me.get();
			return data;
		},
	});

	return <>{data ? <Outlet /> : <Auth />}</>;
};

export const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="container">
				<Link to="/" className="header">
					<img src={logoSrc} className="header__logo" />
				</Link>

				<div className="container__content">
					<Routes>
						<Route element={<AuthLock />}>
							<Route path="/" element={<Rounds />} />
							<Route path="/round/:roundId" element={<Round />} />
						</Route>
					</Routes>
				</div>
			</div>
		</QueryClientProvider>
	);
};
