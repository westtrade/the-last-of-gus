declare module "*.module.scss" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";
declare module "*.webp";
declare module "*.png" {
	const src: string;
	export default src;
}
declare module "*?prefetch" {
	const src: string;
	export default src;
}
