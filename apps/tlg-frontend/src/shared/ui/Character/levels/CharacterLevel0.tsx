import React, { type FC } from "react";
import characterImageSrc from "../assets/char-1.png?prefetch";

export const CharacterLevel0: FC = () => {
	return <img data-level="2" src={characterImageSrc} width="100%" />;
};
