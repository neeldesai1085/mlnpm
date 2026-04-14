import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MLNPM_SECTION, POSTINSTALL_COMMAND } from "../constants.js";

export function readPkgJson(cwd: string = process.cwd()): Record<string, any> {
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) {
        throw new Error(
            "No package.json found in current directory.\nRun `npm init -y` first.",
        );
    }
    const raw = readFileSync(pkgPath, "utf-8");
    return JSON.parse(raw);
}

export function writePkgJson(
    data: Record<string, any>,
    cwd: string = process.cwd(),
): void {
    const pkgPath = join(cwd, "package.json");
    writeFileSync(pkgPath, JSON.stringify(data, null, 2) + "\n");
}

export function addMlnpmEntry(
    name: string,
    version: string,
    cwd: string = process.cwd(),
): void {
    const pkg = readPkgJson(cwd);

    if (!pkg[MLNPM_SECTION]) {
        pkg[MLNPM_SECTION] = {};
    }

    pkg[MLNPM_SECTION][name] = version;
    writePkgJson(pkg, cwd);
}

export function removeMlnpmEntry(
    name: string,
    cwd: string = process.cwd(),
): void {
    const pkg = readPkgJson(cwd);

    if (!pkg[MLNPM_SECTION]) return;

    delete pkg[MLNPM_SECTION][name];

    if (Object.keys(pkg[MLNPM_SECTION]).length === 0) {
        delete pkg[MLNPM_SECTION];
    }

    writePkgJson(pkg, cwd);
}

export function getMlnpmEntries(
    cwd: string = process.cwd(),
): Record<string, string> {
    const pkg = readPkgJson(cwd);
    return pkg[MLNPM_SECTION] || {};
}

export function ensurePostinstall(cwd: string = process.cwd()): void {
    const pkg = readPkgJson(cwd);

    if (!pkg.scripts) {
        pkg.scripts = {};
    }

    const current = pkg.scripts.postinstall;
    
    if (!current) {
        pkg.scripts.postinstall = POSTINSTALL_COMMAND;
    } else if (!current.includes(POSTINSTALL_COMMAND)) {
        pkg.scripts.postinstall = `${current} && ${POSTINSTALL_COMMAND}`;
    }
    
    writePkgJson(pkg, cwd);
}