import { homedir } from "node:os";
import { join } from "node:path";

export const REGISTRY_URL = process.env.MLNPM_REGISTRY || "https://mlnpm.onrender.com";
export const CACHE_DIR = join(homedir(), ".mlnpm", "cache");
export const MLNPM_SECTION = "mlnpm";
export const POSTINSTALL_COMMAND = "mlnpm restore";
