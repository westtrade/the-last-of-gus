import { useCallback, type ReactEventHandler } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader } from "shared/ui";

import { api } from "lib/api";

import style from "./Auth.module.scss";

export const Auth = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (params) => {
			const { data, error } = await api.auth.login.post(params);
			if (error) {
				throw error;
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
			mutation.mutate({
				username: formData.get("username"),
				password: formData.get("password"),
			});
		},
		[mutation]
	);

	return (
		<form className={style.wrapper} onSubmit={handleSubmit}>
			<label htmlFor="field-username" className={style.label}>
				Username
			</label>
			<input
				type="text"
				className={style.input}
				name="username"
				id="field-username"
				autoComplete="username"
			/>

			<label htmlFor="field-password" className={style.label}>
				Password
			</label>
			<input
				type="password"
				className={style.input}
				name="password"
				id="field-password"
				autoComplete="current-password"
			/>

			<button
				disabled={mutation.isPending}
				type="submit"
				className={style.submit}
			>
				Login
				{mutation.isPending && <Loader />}
			</button>

			{mutation.error && (
				<div className={style.error}>User not found</div>
			)}
		</form>
	);
};
