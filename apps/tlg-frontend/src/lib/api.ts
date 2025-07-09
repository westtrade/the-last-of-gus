import { treaty } from "@elysiajs/eden";
import type { ServerApp } from "../server/index";

const serverApp = treaty<ServerApp>(location.origin);

export const api = serverApp.api;
