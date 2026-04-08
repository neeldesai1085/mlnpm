import { existsSync, mkdirSync, statSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CACHE_ROOT = join(homedir(), ".mlnpm", "cache");

export function getCachePath(
    packageName: string,
    version: string,
    fileName: string = "model.onnx",
): string {
    return join(CACHE_ROOT, packageName, version, fileName);
}

export function getCacheDir(packageName: string, version: string): string {
    return join(CACHE_ROOT, packageName, version);
}

export function isCached(
    packageName: string,
    version: string,
    fileName: string = "model.onnx",
): boolean {
    const filePath = getCachePath(packageName, version, fileName);
    return existsSync(filePath);
}

export function ensureCacheDir(packageName: string, version: string): string {
    const dir = getCacheDir(packageName, version);
    mkdirSync(dir, { recursive: true });
    return dir;
}

export function listCache(): Array<{
    name: string;
    version: string;
    files: Array<{ name: string; size: number }>;
}> {
    if (!existsSync(CACHE_ROOT)) return [];

    const entries: Array<{
        name: string;
        version: string;
        files: Array<{ name: string; size: number }>;
    }> = [];

    const packages = readdirSync(CACHE_ROOT, { withFileTypes: true });
    for (const pkg of packages) {
        if (!pkg.isDirectory()) continue;

        const pkgDir = join(CACHE_ROOT, pkg.name);
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
        const pkgDir = join(CACHE_ROOT, packageName);
        if (existsSync(pkgDir)) {
            rmSync(pkgDir, { recursive: true, force: true });
        }
    } else {
        if (existsSync(CACHE_ROOT)) {
            rmSync(CACHE_ROOT, { recursive: true, force: true });
        }
    }
}

export function getCacheRoot(): string {
    return CACHE_ROOT;
}
