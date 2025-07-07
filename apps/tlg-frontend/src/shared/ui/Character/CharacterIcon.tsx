import React, { type FC } from "react";
import { CharacterHead } from "./CharacterHead";

import "./CharacterIcon.style.sass";

interface Props {
	className?: string;
}

export const CharacterIcon: FC<Props> = ({ className }) => {
	return (
		<div className={`character-icon ${className}`}>
			<CharacterHead className="character-icon__icon" />
		</div>
	);
};
