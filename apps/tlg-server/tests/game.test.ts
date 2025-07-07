import { describe, it, expect, beforeAll } from "vitest";
import { ServiceBroker } from "moleculer";
import { RoundService, TapService, UserService } from "../src/services";

describe("Game Services", () => {
	const broker = new ServiceBroker({
		nodeID: "test-node",
		logLevel: "fatal",
	});

	beforeAll(async () => {
		broker.createService(UserService);
		broker.createService(RoundService);
		broker.createService(TapService);
		await broker.start();
	});

	it("should create or login user", async () => {
		const Ivan = await broker.call("users.createOrLogin", {
			username: "ivan",
			password: "123`",
		});

		expect(Ivan).toHaveProperty("token", expect.any(String));

		const me = await broker.call("users.me", undefined, {
			meta: {
				token: Ivan.token,
			},
		});

		expect(me).toHaveProperty("username", "ivan");
		expect(me).toHaveProperty("role", "survivor");
	});

	it("should create a round", async () => {
		const Admin = await broker.call("users.createOrLogin", {
			username: "admin",
			password: "123`",
		});

		const round = await broker.call("rounds.create", undefined, {
			meta: {
				token: Admin.token,
			},
		});

		expect(round).toHaveProperty("start");
		expect(round).toHaveProperty("end");
		expect(round).toHaveProperty("status", "cooldown");
	});

	it("should tap in active round", async () => {
		const Admin = await broker.call("users.createOrLogin", {
			username: "admin",
			password: "123`",
		});

		const round = await broker.call(
			"rounds.create",
			{
				start: new Date(),
			},
			{
				meta: {
					token: Admin.token,
				},
			}
		);

		const tapRes = await broker.call(
			"taps.tap",
			{
				roundId: round.id,
			},
			{
				meta: {
					token: Admin.token,
				},
			}
		);

		expect(tapRes).toHaveProperty("score", 1);
	});

	it("should return 0 for nikita", async () => {
		const Admin = await broker.call("users.createOrLogin", {
			username: "admin",
			password: "123`",
		});

		const Nikita = await broker.call("users.createOrLogin", {
			username: "Никита",
			password: "pass",
		});

		const Andrey = await broker.call("users.createOrLogin", {
			username: "Андрей",
			password: "pass",
		});

		const round = await broker.call(
			"rounds.create",
			{
				start: new Date(),
			},
			{
				meta: {
					token: Admin.token,
				},
			}
		);

		const taps = await Promise.all([
			broker.call(
				"taps.tap",
				{
					roundId: round.id,
				},
				{
					meta: {
						token: Nikita.token,
					},
				}
			),
			broker.call(
				"taps.tap",
				{
					roundId: round.id,
				},
				{
					meta: {
						token: Nikita.token,
					},
				}
			),
			broker.call(
				"taps.tap",
				{
					roundId: round.id,
				},
				{
					meta: {
						token: Nikita.token,
					},
				}
			),
			broker.call(
				"taps.tap",
				{
					roundId: round.id,
				},
				{
					meta: {
						token: Nikita.token,
					},
				}
			),
			broker.call(
				"taps.tap",
				{
					roundId: round.id,
				},
				{
					meta: {
						token: Andrey.token,
					},
				}
			),
		]);

		const nikitaTaps = taps.filter(({ userId }) => userId === Nikita.id);
		const andreyTaps = taps.filter(({ userId }) => userId === Andrey.id);

		expect(taps).toHaveLength(5);
		expect(nikitaTaps).toHaveLength(4);
		expect(andreyTaps).toHaveLength(1);
		expect(nikitaTaps.every(({ score }) => score === 0)).toStrictEqual(
			true
		);
		expect(nikitaTaps.map(({ taps }) => taps).sort()).toStrictEqual([
			1, 2, 3, 4,
		]);

		await expect(
			broker.call("rounds.get", {
				id: round.id,
			})
		).resolves.toMatchObject({
			totalScore: 1,
			taps: 5,
		});
	});
});
