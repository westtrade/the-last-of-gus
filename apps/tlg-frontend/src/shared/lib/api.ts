import { treaty } from "@elysiajs/eden";
import type { ServerApi } from "@server";

export const { api } = treaty<ServerApi>(location.origin);
