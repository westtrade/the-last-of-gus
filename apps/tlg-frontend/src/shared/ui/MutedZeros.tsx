import React, { type ReactNode, useMemo } from "react";
import clsx from "clsx";

import style from "./MutedZeros.module.scss";

type Props = {
	value: string;
	className?: string;
};

export const MutedZeros = ({ className, value }: Props) => {
	const [zeros, other] = useMemo(() => {
		const [_, zeros, other] = value.match(/^(0*)(\d+)$/);

		return [zeros, other];
	}, [value]);

	return (
		<div className={clsx(style.wrapper, className)}>
			<span className={style.zeros}>{zeros}</span>
			{other}
		</div>
	);
};
