import {
	type CountOptions,
	type CursorOptions,
	type DbAdapter,
	type FilterOptions,
	type QueryOptions,
} from "moleculer-db";

import type { Service, ServiceBroker } from "moleculer";
import _ from "lodash";
import { ulid } from "ulid";

import redis, {
	type ChainableCommander,
	type Redis,
	type RedisOptions,
} from "ioredis";

type AnyRedisOption = string | number | (RedisOptions & { prefix?: string });

export class RedisDBAdapter<T> implements DbAdapter {
	private redis!: Redis;
	private broker!: ServiceBroker;
	private service!: Service;
	private prefix: string = "entity";
	private options: AnyRedisOption[];

	constructor(port: number, host: string, options: RedisOptions);
	constructor(path: string, options: RedisOptions);
	constructor(port: number, options: RedisOptions);
	constructor(port: number, host: string);
	constructor(options: RedisOptions);
	constructor(port: number);
	constructor(path: string);
	constructor();
	/**
	 * Creates an instance of RedisDBAdapter.
	 * @param {RedisOptions & { prefix?: string }} options IORedis options
	 * @memberof RedisDBAdapter
	 */
	constructor(...options: AnyRedisOption[]) {
		this.options = options;
	}

	/**
	 * Initialize adapter
	 *
	 * @param {ServiceBroker} broker
	 * @param {Service} service
	 * @memberof RedisDBAdapter
	 */
	init(broker: ServiceBroker, service: Service): void {
		this.broker = broker;
		this.service = service;

		this.redis = new redis(...this.options);
		this.prefix = this.service.name ?? this.prefix;
	}

	/**
	 * Connect to database
	 *
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async connect(): Promise<void> {}

	/**
	 * Disconnect from database
	 *
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async disconnect(): Promise<void> {
		await this.redis.quit();
	}

	/**
	 * Create a prefixed key for entity
	 *
	 * @param {string | number} id
	 * @returns {string}
	 * @memberof RedisDBAdapter
	 */
	private makeKey(id: string | number) {
		return `${this.prefix}:${id}`;
	}

	/**
	 * Find all entities by filters.
	 *
	 * Available filter props:
	 * 	- limit
	 *  - offset
	 *  - sort
	 *  - search
	 *  - searchFields
	 *  - query
	 *
	 * @param {Object} filters
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async find<T>({
		query = {},
		search,
		searchFields,
		limit: limitInput,
		offset: offsetInput,
		sort,
		fields,
	}: CursorOptions): Promise<T[] | Partial<T>[]> {
		const searchFieldsArray = Array.isArray(searchFields)
			? searchFields
			: searchFields?.split(",").map((field) => field.trim());

		const offset = Number(offsetInput ?? 0);
		const limit = Number(limitInput ?? Infinity);

		const results: T[] = [];
		// let index = 0;

		const idField = this.service?.settings.idField;
		if (query[idField]) {
			query["_id"] = query[idField];
			delete query[idField];
		}

		for await (const entity of this.entityIterator(
			query,
			search,
			searchFieldsArray
		)) {
			// if (index < offset) {
			// 	continue;
			// }

			results.push(entity);

			// if (results.length >= limit) {
			// 	break;
			// }
			// index++;
		}

		const sortFields = Array.isArray(sort)
			? sort
			: sort?.split(",").map((field) => field.trim()) || [];

		const keys = sortFields?.map((field) => field.replace(/^-/, ""));
		const orders = sortFields?.map((field) =>
			field.startsWith("-") ? "desc" : "asc"
		);

		let dataPipeline = _<T | Partial<T>>(results);

		if (sortFields.length) {
			dataPipeline = dataPipeline.orderBy(keys, orders);
		}

		const pickedFields = Array.isArray(fields)
			? fields
			: fields?.split(",").map((field) => field.trim());

		if (pickedFields?.length) {
			dataPipeline = dataPipeline.map((entity) =>
				_.pick(entity, pickedFields)
			);
		}

		return dataPipeline.value().slice(offset, offset + limit);
	}

	/**
	 * Find an entity by query
	 *
	 * @param {Object} query
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async findOne<Q extends QueryOptions, T>(
		query: Q
	): Promise<T | Partial<T> | null> {
		const results = await this.find<T>({ query, limit: 1 });
		return results.length > 0 ? results[0] : null;
	}

	/**
	 * Find an entity by ID
	 *
	 * @param {any} id
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async findById(id: any): Promise<object | null> {
		const value = await this.redis.get(this.makeKey(id));
		if (!value) {
			return null;
		}

		return JSON.parse(value);
	}

	/**
	 * Find all entites by IDs
	 *
	 * @param {Array<Number>} ids
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async findByIds(ids: (string | number)[]): Promise<object[]> {
		if (!ids.length) {
			return [];
		}

		const pipeline = this.redis.pipeline();
		ids.forEach((id) => {
			pipeline.get(this.makeKey(id));
		});

		const results = await pipeline.exec();

		return (
			results
				?.map(([error, value]) => {
					if (error) {
						this.broker.logger.error(error);
						return null;
					}

					try {
						return JSON.parse(value as string);
					} catch (error) {
						this.broker.logger.error(error);
						return null;
					}
				})
				.filter(Boolean) || []
		);
	}

	/**
	 * Get count of filtered entites
	 *
	 * Available filter props:
	 *  - search
	 *  - searchFields
	 *  - query
	 *
	 * @param {Object} [filters={}]
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async count(filters: CountOptions = {}): Promise<number> {
		const { query = {}, search, searchFields } = filters;

		const searchFieldsArray = Array.isArray(searchFields)
			? searchFields
			: searchFields?.split(",").map((field) => field.trim());

		let total = 0;

		for await (const _ of this.entityIterator(
			query,
			search,
			searchFieldsArray
		)) {
			total++;
		}

		return total;
	}

	/**
	 * Insert an entity
	 *
	 * @param {Object} entity
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async insert<T>(
		entity: Record<string, any>,
		pipeline?: ChainableCommander
	): Promise<T> {
		if (!entity) {
			throw new Error("Entity is required");
		}

		const idField = this.service?.settings.idField ?? "_id";
		entity._id = entity[idField] ?? ulid();

		const key = this.makeKey(entity._id);
		const val = JSON.stringify(entity);

		const target = pipeline ?? this.redis.pipeline();

		await target
			.set(key, val)
			.sadd(`${this.prefix}:ids`, entity._id.toString());

		if (!pipeline) {
			await target.exec();
		}

		return entity;
	}

	/**
	 * Insert multiple entities
	 *
	 * @param {Array<Object>} entities
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async insertMany(...entities: object[]): Promise<object[]> {
		if (!entities.length) {
			return [];
		}

		const pipeline = this.redis.pipeline();
		const results: object[] = [];

		for (const entity of entities) {
			const result = await this.insert(entity, pipeline);
			results.push(result);
		}

		await pipeline.exec();
		return results;
	}

	/**
	 * Update many entities by `query` and `update`
	 *
	 * @param {Object} query
	 * @param {Object} update
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async updateMany<Q extends QueryOptions>(
		query: Q,
		{ $set: update }: { $set: object } = { $set: {} }
	): Promise<number> {
		const idField = this.service?.settings.idField;

		let updatedCount = 0;
		const pipeline = this.redis.pipeline();

		if (query[idField]) {
			delete query[idField];
		}

		for await (const entity of this.entityIterator(query)) {
			const updatedEntity = {
				...entity,
				...update,
				_id: entity._id,
			};

			const key = this.makeKey(entity._id);
			const val = JSON.stringify(updatedEntity);

			pipeline.set(key, val);
			updatedCount++;
		}

		if (updatedCount > 0) {
			await pipeline.exec();
		}

		return updatedCount;
	}

	/**
	 * Update an entity by ID
	 *
	 * @param {string|number} id
	 * @param {Object} update
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async updateById<T>(
		id: string | number,
		{ $set: update }: { $set: object } = { $set: {} }
	): Promise<T> {
		const raw = await this.redis.get(this.makeKey(id));
		if (!raw) {
			throw new Error(`Entity with ID '${id}' not found`);
		}

		let entity: Record<string, any> = JSON.parse(raw);

		delete update._id;

		if (this.service.settings.idField) {
			delete update[this.service.settings.idField];
		}

		const updatedEntity = {
			...entity,
			...update,
			_id: entity._id,
		};

		const val = JSON.stringify(updatedEntity);
		await this.redis.set(this.makeKey(id), val);

		return updatedEntity;
	}

	/**
	 * Remove many entities which are matched by `query`
	 *
	 * @param {Object} query
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async removeMany(query: QueryOptions): Promise<number> {
		let removedCount = 0;

		const pipeline = this.redis.pipeline();

		for await (const entity of this.entityIterator(query)) {
			if (entity._id === undefined) {
				continue;
			}

			await pipeline.del(this.makeKey(entity._id));
			await pipeline.srem(`${this.prefix}:ids`, entity._id.toString());

			removedCount++;
		}

		await pipeline.exec();
		return removedCount;
	}

	/**
	 * Remove an entity by ID
	 *
	 * @param {number|string} id
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async removeById(
		id: number | string,
		pipeline?: ChainableCommander
	): Promise<any> {
		const key = this.makeKey(id);
		const target = pipeline ?? this.redis.pipeline();

		target.del(key);
		target.srem(`${this.prefix}:ids`, id.toString());

		if (!pipeline) {
			await target.exec();
		}

		return { id };
	}

	/**
	 * Clear all entities from DB
	 *
	 * @returns {Promise}
	 * @memberof RedisDBAdapter
	 */
	async clear(): Promise<void> {
		const ids = await this.redis.smembers(`${this.prefix}:ids`);
		if (ids.length === 0) {
			return;
		}

		const pipeline = this.redis.pipeline();
		ids.forEach((id) => this.removeById(id, pipeline));
		await pipeline.exec();
	}

	async *entityIterator(
		query?: QueryOptions,
		search?: string,
		searchFieldsArray?: string[]
	) {
		const ids = await this.redis.smembers(`${this.prefix}:ids`);
		for (const id of ids) {
			const val = await this.redis.get(`${this.prefix}:${id}`);
			if (!val) {
				continue;
			}

			const entity = JSON.parse(val);
			if (!this.matchesFilter(entity, query, search, searchFieldsArray)) {
				continue;
			}

			yield entity;
		}
	}

	private matchesFilter(
		entity: Record<string, any>,
		query?: QueryOptions,
		search?: string,
		searchFieldsArray?: string[]
	): boolean {
		let match = query
			? Object.entries(query).every(([k, v]) => entity[k] === v)
			: true;

		if (match && search) {
			const fieldsToSearch = searchFieldsArray ?? Object.keys(entity);
			match = fieldsToSearch.some((field) => {
				const val = entity[field];
				return (
					typeof val === "string" &&
					val.toLowerCase().includes(search.toLowerCase())
				);
			});
		}

		return match;
	}

	/**
	 * Transforms 'idField' into '_id'
	 * @param {Object} entity
	 * @param {String} idField
	 * @memberof RedisDBAdapter
	 * @returns {Object} Modified entity
	 */
	beforeSaveTransformID(
		entity: Record<string, any>,
		idField: string
	): object {
		if (idField !== "_id") {
			entity[idField] = entity._id;
			delete entity._id;
		}

		return entity;
	}

	/**
	 * Transforms '_id' into user defined 'idField'
	 * @param {Object} entity
	 * @param {String} idField
	 * @memberof RedisDBAdapter
	 * @returns {Object} Modified entity
	 */
	afterRetrieveTransformID<R>(
		entity: Record<string, any>,
		idField: string
	): R {
		if (idField !== "_id") {
			entity[idField] = entity._id;
			delete entity._id;
		}

		return entity;
	}

	/**
	 * Convert DB entity to JSON object
	 *
	 * @param {any} entity
	 * @returns {Object}
	 * @memberof DbAdapter
	 */
	entityToObject(entity: object): object {
		return entity;
	}
}
