import chalk from "chalk";
import { log } from "../utils/logger.js";
import {
    listCache,
    clearCache,
    getCacheRoot,
} from "../utils/cache-helpers.js";

export async function cacheListCommand(): Promise<void> {
    const entries = listCache();

    log.br();

    if (entries.length === 0) {
        log.info("No models cached.");
        log.info(`Cache directory: ${getCacheRoot()}`);
        log.br();
        return;
    }

    log.header(`  Global model cache (${getCacheRoot()}):\n`);

    console.log(
        "  " +
        chalk.dim(
            padRight("Package", 35) +
            padRight("Version", 15) +
            "Size",
        ),
    );
    console.log("  " + chalk.dim("─".repeat(65)));

    let totalBytes = 0;

    for (const entry of entries) {
        const entryBytes = entry.files.reduce((sum, f) => sum + f.size, 0);
        totalBytes += entryBytes;

        console.log(
            "  " +
            padRight(chalk.white(entry.name), 35) +
            padRight(chalk.cyan(entry.version), 15) +
            chalk.yellow(formatBytes(entryBytes)),
        );
    }

    log.br();
    log.plain(`Total: ${chalk.bold(formatBytes(totalBytes))}`);
    log.br();
}

export async function cacheCleanCommand(
    packageName?: string,
): Promise<void> {
    log.br();

    if (packageName) {
        clearCache(packageName);
        log.success(`Cleared cache for ${packageName}`);
    } else {
        clearCache();
        log.success("Cleared entire model cache");
    }

    log.br();
}

function padRight(str: string, len: number): string {
    const rawLen = str.replace(/\x1b\[[0-9;]*m/g, "").length;
    return str + " ".repeat(Math.max(0, len - rawLen));
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
