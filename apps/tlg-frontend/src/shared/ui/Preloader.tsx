import React, { type ReactNode } from "react";
import clsx from "clsx";

import "./Preloader.scss";

type Props = {
	children?: ReactNode;
	className?: string;
};

export const Preloader = ({ children }: Props) => {
	return (
		<div className="preloader _complete">
			<div className="_border">
				<div className="_content">
					<div className="_cards">
						<div className="_card">
							<div className="_stack _animation1">
								<div className="_icon">
									<svg
										className="_img _gouse-guss"
										fill="none"
									>
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg
										className="_img _gouse-ill"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg
										className="_img _gouse-normal"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
							</div>
						</div>

						<div className="_card">
							<div className="_stack _animation2">
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
							</div>
						</div>

						<div className="_card">
							<div className="_stack _animation3">
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
							</div>
						</div>
						<div className="_card">
							<div className="_stack _animation4">
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
							</div>
						</div>
						<div className="_card">
							<div className="_stack _animation5">
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
							</div>
						</div>
						<div className="_card">
							<div className="_stack _animation6">
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-normal">
										<use xlinkHref="#gouse-normal"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-ill">
										<use xlinkHref="#gouse-ill"></use>
									</svg>
								</div>
								<div className="_icon">
									<svg className="_img _gouse-guss">
										<use xlinkHref="#gouse-guss"></use>
									</svg>
								</div>
							</div>
						</div>
					</div>

					<div className="_message" id="page-preloader-message"></div>
				</div>
			</div>
		</div>
	);
};
