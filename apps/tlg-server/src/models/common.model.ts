type SortField<T> = (keyof T & string) | `-${keyof T & string}`;

export interface ListParams<T = any> {
	populate?: keyof T | (keyof T)[];
	fields?: (keyof T)[] | keyof T;
	page?: number;
	pageSize?: number;
	sort?: SortField<T> | SortField<T>[] | string | string[];
	search?: string;
	searchFields?: (keyof T)[];
	query?: Partial<T>;
}

export interface ListResponse<T = any> {
	rows: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
