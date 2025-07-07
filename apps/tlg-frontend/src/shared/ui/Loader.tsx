import React, { type ReactNode } from "react";
import clsx from "clsx";

import style from "./Loader.module.scss";

type Props = {
	className?: string;
};

export const Loader = ({ className }: Props) => {
	return <span className={clsx(style.wrapper)}></span>;
};
