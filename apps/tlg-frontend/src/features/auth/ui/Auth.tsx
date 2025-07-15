import { useCallback, useEffect, type ReactEventHandler } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, api } from "@shared";
import type { CreateOrLoginParams } from "@westtrade/tlg-server";

import style from "./Auth.module.scss";
import { authErrors } from "../const";

export const Auth = () => {
	const queryClient = useQueryClient();

	const createOrLogin = useMutation({
		mutationFn: async (credentials: CreateOrLoginParams) => {
			const { data, error } = await api.auth.login.post(credentials);

			if (error?.value) {
				throw error?.value;
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
		},
	});

	const handleSubmit = useCallback<ReactEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);

			createOrLogin.mutate({
				username: formData.get("username")?.toString() ?? "",
				password: formData.get("password")?.toString() ?? "",
			});
		},
		[createOrLogin]
	);

	return (
		<form className={style.wrapper} onSubmit={handleSubmit}>
			<label htmlFor="field-username" className={style.label}>
				Username
			</label>

			<div className={style.inputWrapper}>
				<div className={style.inputInner}>
					<input
						type="text"
						className={style.input}
						name="username"
						id="field-username"
						autoComplete="username"
						autoFocus={true}
					/>
				</div>
			</div>

			<label htmlFor="field-password" className={style.label}>
				Password
			</label>

			<div className={style.inputWrapper}>
				<div className={style.inputInner}>
					<input
						type="password"
						className={style.input}
						name="password"
						id="field-password"
						autoComplete="current-password"
					/>
				</div>
			</div>

			<button
				disabled={createOrLogin.isPending}
				type="submit"
				className={style.submit}
			>
				Login
				{createOrLogin.isPending && <Loader />}
			</button>

			{createOrLogin.error && (
				<div className={style.error}>
					{authErrors[createOrLogin.error.message] ?? "Unknown error"}
				</div>
			)}
		</form>
	);
};

export default Auth;
