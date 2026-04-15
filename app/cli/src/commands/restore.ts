import ora from "ora";
import { log } from "../utils/logger.js";
import { fetchManifest, downloadFile } from "../utils/api.js";
import { scaffoldPackage, isInstalled } from "../utils/scaffold.js";
import { getMlnpmEntries } from "../utils/pkg-json.js";

export async function restoreCommand(): Promise<void> {
    const entries = getMlnpmEntries();
    const packageNames = Object.keys(entries);

    if (packageNames.length === 0) {
        return;
    }

    let restoredCount = 0;
    let skippedCount = 0;

    for (const name of packageNames) {
        const version = entries[name]!;

        if (isInstalled(name)) {
            skippedCount++;
            continue;
        }

        const spinner = ora(`Restoring ${name}@${version}...`).start();

        try {
            const manifest = await fetchManifest(name, version);

            let wrapperContent = "";
            if (manifest.wrapper) {
                wrapperContent = await downloadFile(
                    manifest.wrapper.download_url,
                );
            } else {
                wrapperContent = `export default {
    inputs: [],
    outputs: [],
    async predict(sessions, input) { throw new Error("No wrapper.config.js provided"); }
};
`;
            }

            scaffoldPackage(name, manifest.version, wrapperContent);
            spinner.succeed(`Restored ${name}@${manifest.version}`);
            restoredCount++;
        } catch (err: any) {
            spinner.fail(`Failed to restore ${name}: ${err.message}`);
        }
    }

    if (restoredCount > 0) {
        log.success(`${restoredCount} package(s) restored.`);
    }

    if (skippedCount > 0 && restoredCount === 0) {
        log.success("All packages are already installed.");
    }
}
