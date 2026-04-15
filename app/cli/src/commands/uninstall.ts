import ora from "ora";
import { log } from "../utils/logger.js";
import { removePackage } from "../utils/scaffold.js";
import { removeMlnpmEntry, getMlnpmEntries } from "../utils/pkg-json.js";

export async function uninstallCommand(packageName: string): Promise<void> {
    log.br();

    const entries = getMlnpmEntries();
    if (!entries[packageName]) {
        log.error(`${packageName} is not an mlnpm package in this project.`);
        process.exit(1);
    }

    const spinner = ora(`Removing ${packageName}...`).start();
    removePackage(packageName);
    spinner.succeed(`Removed node_modules/${packageName}/`);

    const pkgSpinner = ora("Updating package.json...").start();
    removeMlnpmEntry(packageName);
    pkgSpinner.succeed("Updated package.json");

    log.br();
    log.success(`${packageName} uninstalled.`);
    log.br();
}
