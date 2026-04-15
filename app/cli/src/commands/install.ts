import ora from "ora";
import { log } from "../utils/logger.js";
import { fetchManifest, downloadFile } from "../utils/api.js";
import { scaffoldPackage } from "../utils/scaffold.js";
import {
    addMlnpmEntry,
    ensurePostinstall,
    readPkgJson,
} from "../utils/pkg-json.js";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export async function installCommand(rawName: string): Promise<void> {
    let packageName: string;
    let requestedVersion: string;

    if (rawName.includes("@")) {
        const lastAt = rawName.lastIndexOf("@");
        packageName = rawName.slice(0, lastAt);
        requestedVersion = rawName.slice(lastAt + 1);
    } else {
        packageName = rawName;
        requestedVersion = "latest";
    }

    log.br();
    const spinner = ora(`Resolving ${packageName}...`).start();

    try {
        const manifest = await fetchManifest(packageName, requestedVersion);
        spinner.succeed(
            `Found ${manifest.name}@${manifest.version}`,
        );

        if (!manifest.wrapper) {
            log.warn(
                "No wrapper config found. The package may not be usable with predict().",
            );
            log.info(
                "The model author needs to upload a wrapper.config.js file.",
            );
        }

        let wrapperContent: string;

        if (manifest.wrapper) {
            const wrapperSpinner = ora("Downloading wrapper config...").start();
            wrapperContent = await downloadFile(
                manifest.wrapper.download_url,
            );
            wrapperSpinner.succeed(
                `Downloaded wrapper (${formatSize(wrapperContent.length)})`,
            );
        } else {

            wrapperContent = `// Placeholder wrapper — no wrapper.config.js was provided by the author
export default {
    inputs: [],
    outputs: [],
    async predict(sessions, input) {
        throw new Error("This model was published without a wrapper.config.js. You must write custom predict logic to use it.");
    }
};
`;
        }

        const pkgSpinner = ora("Updating package.json...").start();
        addMlnpmEntry(packageName, manifest.version);
        ensurePostinstall();
        pkgSpinner.succeed("Updated package.json");

        await ensureRuntimeDeps();

        const scaffoldSpinner = ora(
            `Scaffolding node_modules/${packageName}/`,
        ).start();
        scaffoldPackage(packageName, manifest.version, wrapperContent);
        scaffoldSpinner.succeed(
            `Scaffolded node_modules/${packageName}/`,
        );

        log.br();

        log.br();
        log.success(
            `${packageName}@${manifest.version} installed successfully!`,
        );
        log.br();
        log.header("  Usage:");
        log.plain(`  import model from "${packageName}";`);
        log.plain("  await model.init();  // downloads model on first run");

        if ((!manifest.has_predict && !manifest.has_stream) || manifest.has_predict) {
            log.plain(
                "  const result = await model.predict({ /* your input */ });",
            );
        }

        if (manifest.has_stream) {
            log.plain(
                "  const stream = model.stream({ /* prompt/input */ });",
            );
            log.plain(
                "  for await (const chunk of stream) { console.log(chunk.token); }",
            );
        }
        log.br();
    } catch (err: any) {
        spinner.fail("Installation failed");
        log.error(err.message);
        process.exit(1);
    }
}

async function ensureRuntimeDeps(): Promise<void> {
    const cwd = process.cwd();
    const nodeModules = join(cwd, "node_modules");

    const runtimeExists = existsSync(
        join(nodeModules, "@mlnpm", "runtime", "package.json"),
    );
    const onnxExists = existsSync(
        join(nodeModules, "onnxruntime-node", "package.json"),
    );

    if (runtimeExists && onnxExists) {
        return;
    }

    const deps: string[] = [];
    if (!runtimeExists) deps.push("@mlnpm/runtime");
    if (!onnxExists) deps.push("onnxruntime-node");

    const spinner = ora(
        `Installing ${deps.join(", ")}...`,
    ).start();

    try {
        execSync(`npm install ${deps.join(" ")} --save`, {
            cwd,
            stdio: "pipe",
        });
        spinner.succeed(`Installed ${deps.join(", ")}`);
    } catch {
        spinner.warn(
            `Could not auto-install ${deps.join(", ")}. Run manually:\n` +
            `  npm install ${deps.join(" ")}`,
        );
    }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}
