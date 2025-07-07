import React, { useMemo, type FC } from "react";
import millify from "millify";

interface Props {
	value: number | string | undefined;
}

export const FormatNumber: FC<Props> = ({ value = "" }) => {
	const label = useMemo(
		() => millify(Number.parseFloat(value.toString())),
		[value]
	);
	return <>{label}</>;
};
