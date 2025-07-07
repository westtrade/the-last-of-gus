import { treaty } from "@elysiajs/eden";
import type { ServerApp } from "../server/index";

const serverApp = treaty<ServerApp>("localhost:3000");

export const api = serverApp.api;
