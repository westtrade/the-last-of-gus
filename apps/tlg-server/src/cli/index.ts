#!/usr/bin/env bun
import { cac } from "cac";
import pm2, { type Monit, type Pm2Env } from "pm2";
import { name, version } from "../../package.json";

import ecosystem from "../../ecosystem.config.cjs";

const [shortName] = name.split("/").reverse();

const cli = cac(shortName);

cli.command("status", "Check server status").action(async () => {
	try {
		const { promise, reject, resolve } = Promise.withResolvers();
		pm2.connect((err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});

		await promise;
		const promises: Promise<
			[
				string,
				{
					name?: string;
					pid?: number;
					pm_id?: number;
					monit?: Monit;
					pm2_env?: Pm2Env;
				}[]
			]
		>[] = [];

		for (const app of ecosystem.apps) {
			const { promise, reject, resolve } = Promise.withResolvers<
				[
					string,
					{
						name?: string;
						pid?: number;
						pm_id?: number;
						monit?: Monit;
						pm2_env?: Pm2Env;
					}[]
				]
			>();
			promises.push(promise);

			pm2.describe(app.name, (err, appInfo) =>
				err ? reject(err) : resolve([app.name, appInfo])
			);
		}

		const apps = await Promise.all(promises);
		for (const [name, instances] of apps) {
			const statuses = instances
				.map((instance) => {
					return `${
						instance.pm2_env?.status === "errored"
							? `🔴`
							: instance.pm2_env?.status === "stopped"
							? `⏹️`
							: `🟢`
					} instance ${instance.pm2_env?.pm_id}`;
				})
				.join("\n");

			console.log(
				`${name}: ${instances.length} instance(s). ${
					statuses ? ` \n\n${statuses} \n` : ""
				}`
			);
		}
	} catch (error) {
		console.error(`❌ Error while stopping ${shortName}:`, err);
		process.exit(1);
	} finally {
		pm2.disconnect();
	}
});

cli.command("start [services]", "Start server")
	.option("--instances <number>", "Number of instances")
	.action(async (inputServices, options) => {
		const instances =
			"instances" in options
				? parseInt((options.instances ?? "-1").toString())
				: undefined;

		const services =
			inputServices === undefined
				? undefined
				: inputServices
						.replaceAll(",", " ")
						.replace(/ +/g, " ")
						.split(" ")
						.filter(Boolean);

		const promises = [];
		for (const app of ecosystem.apps) {
			const { promise, reject, resolve } = Promise.withResolvers();
			promises.push(promise);

			await new Promise((resolve, reject) => {
				pm2.describe(app.name, (err, appInfo) => {
					if (err) {
						return reject(err);
					}

					if (appInfo.length) {
						pm2.delete(app.name, (err) => {
							if (err) {
								return reject(err);
							}
							resolve();
						});
					} else {
						resolve();
					}
				});
			});

			pm2.start(
				{
					...app,
					instances: instances ?? app.instances ?? -1,
					env: {
						...(app.env ?? {}),
						["SERVICES"]:
							services?.join(",") ?? app.env?.["SERVICES"],
					},
				},
				(err) => (err ? reject(err) : resolve())
			);
		}

		try {
			await Promise.all(promises);
			await new Promise((resolve, reject) => {
				pm2.dump((err) => (err ? reject(err) : resolve()));
			});

			console.log(
				`✅ ${shortName} ${
					services === undefined
						? "all services"
						: `with services: ${services.join(", ")}`
				} - successfully started!`
			);
		} catch (err) {
			console.error(`❌ Error while stopping ${shortName}:`, err);
			process.exit(1);
		} finally {
			pm2.disconnect();
		}
	});

cli.command("stop", "🛑 Stop server").action(async () => {
	const promises = [];
	for (const app of ecosystem.apps) {
		const { promise, reject, resolve } = Promise.withResolvers();
		pm2.stop(app.name, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});

		promises.push(promise);
	}

	try {
		await Promise.all(promises);
		console.log(`✅ ${shortName} successfully stopped!`);
	} catch (err) {
		console.error(`❌ Error while stopping ${shortName}:`, err);
		process.exit(1);
	} finally {
		pm2.disconnect();
	}
});

cli.command("restart", "🔄 Restart server").action(async (options) => {
	const promises = [];
	for (const app of ecosystem.apps) {
		const { promise, reject, resolve } = Promise.withResolvers();
		pm2.restart(app.name, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});

		promises.push(promise);
	}

	try {
		await Promise.all(promises);
		console.log(`✅ ${shortName} successfully restarted!`);
	} catch (err) {
		console.error(`❌ Error while stopping ${shortName}:`, err);
		process.exit(1);
	} finally {
		pm2.disconnect();
	}
});

cli.command("repl", "Start a REPL session").action(async () => {});

cli.help();
cli.version(version);
cli.parse();

if (process.argv.length <= 2) {
	cli.outputHelp();
}
