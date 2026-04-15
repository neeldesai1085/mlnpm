import chalk from "chalk";
import { log } from "../utils/logger.js";
import { getMlnpmEntries } from "../utils/pkg-json.js";
import { isInstalled } from "../utils/scaffold.js";

export async function listCommand(): Promise<void> {
    const entries = getMlnpmEntries();
    const packageNames = Object.keys(entries);

    log.br();

    if (packageNames.length === 0) {
        log.info("No mlnpm packages installed in this project.");
        log.info("Run `mlnpm install <package-name>` to get started.");
        log.br();
        return;
    }

    log.header("  mlnpm packages in this project:\n");

    console.log(
        "  " +
        chalk.dim(
            padRight("Package", 35) +
            padRight("Version", 15) +
            "Status",
        ),
    );
    console.log("  " + chalk.dim("─".repeat(65)));

    for (const name of packageNames) {
        const version = entries[name]!;
        const installed = isInstalled(name);

        const status = installed
            ? chalk.green("✅ installed")
            : chalk.yellow("⚠️  missing (run mlnpm restore)");

        console.log(
            "  " +
            padRight(chalk.white(name), 35) +
            padRight(chalk.cyan(version), 15) +
            status,
        );
    }

    log.br();
}

function padRight(str: string, len: number): string {
    const rawLen = str.replace(/\x1b\[[0-9;]*m/g, "").length;
    return str + " ".repeat(Math.max(0, len - rawLen));
}
