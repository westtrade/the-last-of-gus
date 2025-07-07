import React, { type FC } from "react";
import characterImageSrc from "../assets/char-2.png";

export const CharacterLevel1: FC = () => {
	return <img data-level="1" src={characterImageSrc} width="100%" />;
};
