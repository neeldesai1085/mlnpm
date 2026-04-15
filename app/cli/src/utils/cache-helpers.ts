import { existsSync, mkdirSync, statSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR } from "../constants.js";

export function getCacheRoot(): string {
    return CACHE_DIR;
}

export function listCache(): Array<{
    name: string;
    version: string;
    files: Array<{ name: string; size: number }>;
}> {
    if (!existsSync(CACHE_DIR)) return [];

    const entries: Array<{
        name: string;
        version: string;
        files: Array<{ name: string; size: number }>;
    }> = [];

    const packages = readdirSync(CACHE_DIR, { withFileTypes: true });
    for (const pkg of packages) {
        if (!pkg.isDirectory()) continue;

        const pkgDir = join(CACHE_DIR, pkg.name);
        const versions = readdirSync(pkgDir, { withFileTypes: true });

        for (const ver of versions) {
            if (!ver.isDirectory()) continue;

            const verDir = join(pkgDir, ver.name);
            const files = readdirSync(verDir, { withFileTypes: true });
            const fileList = files
                .filter((f) => f.isFile())
                .map((f) => ({
                    name: f.name,
                    size: statSync(join(verDir, f.name)).size,
                }));

            entries.push({
                name: pkg.name,
                version: ver.name,
                files: fileList,
            });
        }
    }

    return entries;
}

export function clearCache(packageName?: string): void {
    if (packageName) {
        const pkgDir = join(CACHE_DIR, packageName);
        if (existsSync(pkgDir)) {
            rmSync(pkgDir, { recursive: true, force: true });
        }
    } else {
        if (existsSync(CACHE_DIR)) {
            rmSync(CACHE_DIR, { recursive: true, force: true });
        }
    }
}
