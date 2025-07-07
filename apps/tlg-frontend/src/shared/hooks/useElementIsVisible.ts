import { useState, useEffect } from "react";

export const useElementIsVisible = (
	elementQuery: string | undefined,
	options: IntersectionObserverInit & {
		defaultValue?: boolean;
	} = {}
) => {
	const [value, setIsVisible] = useState(options?.defaultValue ?? false);
	useEffect(() => {
		if (!elementQuery) {
			setIsVisible(false);
			return;
		}
		const element = document.querySelector(elementQuery);

		if (!element) {
			setIsVisible(false);
			console.warn(`Element with class "${elementQuery}" not found`);
			return;
		}

		const rect = element.getBoundingClientRect();
		setIsVisible(
			rect.top >= 0 &&
				rect.left >= 0 &&
				rect.bottom <= window.innerHeight &&
				rect.right <= window.innerWidth
		);

		const observer = new IntersectionObserver(
			([entry]) => setIsVisible(entry.isIntersecting),
			{
				root: null,
				rootMargin: "0px",
				threshold: 0.1,
				...options,
			}
		);

		observer.observe(element);

		return () => {
			observer.unobserve(element);
		};
	}, [elementQuery, options]);

	return { value };
};
