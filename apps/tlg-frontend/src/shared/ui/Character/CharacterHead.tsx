import React, { type FC } from "react";

import characterHeadSrc from "./assets/head.png";

import "./CharacterHead.style.sass";

interface Props {
	className?: string;
}

export const CharacterHead: FC<Props> = ({ className = "" }) => {
	return (
		<img src={characterHeadSrc} className={`${className} character-head`} />
	);
};
