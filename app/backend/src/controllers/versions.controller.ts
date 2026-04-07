import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import type { Readable } from "node:stream";
import { z } from "zod";
import { pool, query } from "../db/client.js";
import {
    generateUploadUrl,
    generateDownloadUrl,
    getObjectStream,
    deleteObjects,
} from "../services/r2.service.js";

const publishVersionSchema = z
    .object({
        version: z
            .string()
            .regex(
                /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/,
                "Must follow semver (e.g., 1.0.0)",
            ),
        onnx_file_size: z.coerce.number().int().positive().optional(),
        onnx_file_name: z
            .string()
            .min(1)
            .max(255)
            .regex(/\.onnx$/i, "Only .onnx files are allowed")
            .optional()
            .default("model.onnx"),
        files: z
            .array(
                z.object({
                    name: z.string().min(1).max(255),
                    size: z.coerce.number().int().positive(),
                    hash: z.string().optional(),
                    file_type: z.enum(["model", "wrapper"]).optional().default("model"),
                }),
            )
            .min(1)
            .optional(),
        metadata: z.record(z.string(), z.unknown()).optional().default({}),
    })
    .refine((data) => Boolean(data.files?.length || data.onnx_file_size), {
        message: "Provide either files[] or onnx_file_size",
        path: ["files"],
    });

function sanitizeFileName(rawName: string): string {
    const cleaned = rawName.replace(/\\/g, "/");
    const base = cleaned.split("/").pop() ?? "";
    return base.trim();
}

function ensureOnnxFile(name: string): string {
    if (!name.toLowerCase().endsWith(".onnx")) {
        throw new Error("Only .onnx files are allowed");
    }
    return name;
}

type ParsedVersion = {
    major: number;
    minor: number;
    patch: number;
};

function parseVersion(version: string): ParsedVersion | null {
    const base = version.split("-")[0] ?? version;
    const parts = base.split(".").map((part) => Number(part));
    if (parts.length !== 3) {
        return null;
    }
    const major = parts[0];
    const minor = parts[1];
    const patch = parts[2];
    if (
        major === undefined ||
        minor === undefined ||
        patch === undefined ||
        !Number.isFinite(major) ||
        !Number.isFinite(minor) ||
        !Number.isFinite(patch)
    ) {
        return null;
    }
    return { major, minor, patch };
}

function compareVersions(a: string, b: string): number {
    const parsedA = parseVersion(a);
    const parsedB = parseVersion(b);
    if (!parsedA || !parsedB) {
        return 0;
    }
    if (parsedA.major !== parsedB.major) {
        return parsedA.major - parsedB.major;
    }
    if (parsedA.minor !== parsedB.minor) {
        return parsedA.minor - parsedB.minor;
    }
    return parsedA.patch - parsedB.patch;
}

function getLatestVersion(versions: string[]): string | null {
    let latest: string | null = null;
    for (const version of versions) {
        if (!parseVersion(version)) {
            continue;
        }
        if (!latest || compareVersions(version, latest) > 0) {
            latest = version;
        }
    }
    return latest;
}

function isAllowedNextVersion(latest: string, next: string): boolean {
    const parsedLatest = parseVersion(latest);
    const parsedNext = parseVersion(next);
    if (!parsedLatest || !parsedNext) {
        return false;
    }

    if (parsedNext.major === parsedLatest.major + 1) {
        return parsedNext.minor === 0 && parsedNext.patch === 0;
    }

    if (
        parsedNext.major === parsedLatest.major &&
        parsedNext.minor === parsedLatest.minor + 1
    ) {
        return parsedNext.patch === 0;
    }

    return (
        parsedNext.major === parsedLatest.major &&
        parsedNext.minor === parsedLatest.minor &&
        parsedNext.patch === parsedLatest.patch + 1
    );
}

async function hashStream(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const hasher = createHash("sha256");
        stream.on("data", (chunk) => {
            hasher.update(chunk as Buffer);
        });
        stream.on("error", reject);
        stream.on("end", () => resolve(hasher.digest("hex")));
    });
}

export async function publishVersion(req: Request, res: Response) {
    const { name } = req.params;
    const userId = req.user!.id;

    const parsed = publishVersionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: z.flattenError(parsed.error).fieldErrors,
        });
        return;
    }

    const { version, onnx_file_size, onnx_file_name, metadata } = parsed.data;

    const pkgResult = await query(
        "SELECT id, owner_id FROM packages WHERE name = $1",
        [name],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }

    const pkg = pkgResult.rows[0];
    if (pkg.owner_id !== userId) {
        res.status(403).json({ error: "You do not own this package" });
        return;
    }

    const existingVer = await query(
        "SELECT id FROM versions WHERE package_id = $1 AND version = $2",
        [pkg.id, version],
    );

    if (existingVer.rows.length > 0) {
        res.status(409).json({
            error: `Version ${version} already exists. Versions are immutable.`,
        });
        return;
    }

    const versionsResult = await query<{ version: string }>(
        "SELECT version FROM versions WHERE package_id = $1",
        [pkg.id],
    );
    const latestVersion = getLatestVersion(
        versionsResult.rows.map((row) => row.version),
    );

    if (!latestVersion) {
        if (version !== "1.0.0") {
            res.status(400).json({
                error: "First version must be 1.0.0",
            });
            return;
        }
    } else if (!isAllowedNextVersion(latestVersion, version)) {
        res.status(400).json({
            error: `Version must increment by 1 from latest ${latestVersion}`,
        });
        return;
    }

    let files: { name: string; size: number; hash: string | null; file_type: string }[] = [];
    try {
        files = parsed.data.files?.map((file) => ({
                name: file.file_type === "wrapper"
                    ? "wrapper.config.js"
                    : ensureOnnxFile(sanitizeFileName(file.name)),
                size: file.size,
                hash: file.hash ?? null,
                file_type: file.file_type ?? "model",
            })) ?? [];
    } catch (err) {
        res.status(400).json({
            error: err instanceof Error ? err.message : "Invalid file name",
        });
        return;
    }

    const nameSet = new Set<string>();
    for (const file of files) {
        if (nameSet.has(file.name)) {
            res.status(400).json({
                error: "Duplicate file names are not allowed",
            });
            return;
        }
        nameSet.add(file.name);
    }

    // Enforce exactly one wrapper file
    const wrapperFiles = files.filter((f) => f.file_type === "wrapper");
    if (wrapperFiles.length === 0) {
        res.status(400).json({
            error: "A wrapper config file is required. Upload exactly one .js/.mjs/.ts file with file_type 'wrapper'.",
        });
        return;
    }
    if (wrapperFiles.length > 1) {
        res.status(400).json({
            error: "Only one wrapper config file is allowed per version.",
        });
        return;
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const primaryKey = `packages/${name}/${version}/${files[0]!.name}`;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { rows } = await client.query<{ id: string }>(
            `INSERT INTO versions (package_id, version, onnx_file_key, onnx_file_size, metadata)
            VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [pkg.id, version, primaryKey, totalSize, metadata],
        );

        const versionId = rows[0]!.id;
        for (const file of files) {
            const fileKey = `packages/${name}/${version}/${file.name}`;
            await client.query(
                `INSERT INTO version_files (version_id, package_id, file_name, file_key, file_size, file_hash, file_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [versionId, pkg.id, file.name, fileKey, file.size, file.hash, file.file_type],
            );
        }

        await client.query("COMMIT");

        const uploadUrls = await Promise.all(
            files.map(async (file) => {
                const fileKey = `packages/${name}/${version}/${file.name}`;
                return {
                    name: file.name,
                    package_id: pkg.id,
                    version_id: versionId,
                    key: fileKey,
                    upload_url: await generateUploadUrl(fileKey),
                };
            }),
        );

        res.status(201).json({
            message: `Version ${version} registered for "${name}"`,
            version: {
                id: versionId,
                version,
                onnx_file_key: primaryKey,
            },
            files: uploadUrls,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getVersion(req: Request, res: Response) {
    const { name, version } = req.params;

    const result = await query(
        `SELECT v.id, v.version, v.onnx_file_key, v.onnx_file_size,
                v.metadata, v.is_yanked, v.created_at
        FROM versions v JOIN packages p ON p.id = v.package_id
        WHERE p.name = $1 AND v.version = $2`,
        [name, version],
    );

    if (result.rows.length === 0) {
        res.status(404).json({
            error: `Version ${version} of "${name}" not found`,
        });
        return;
    }

    const ver = result.rows[0];

    if (ver.is_yanked) {
        res.status(410).json({ error: `Version ${version} has been yanked` });
        return;
    }

    const filesResult = await query<{
        package_id: string;
        file_name: string;
        file_key: string;
        file_size: number;
        file_hash: string | null;
        file_type: string;
    }>(
        `SELECT package_id, file_name, file_key, file_size, file_hash, file_type
        FROM version_files WHERE version_id = $1
        ORDER BY file_name ASC`,
        [ver.id],
    );

    const files =
        filesResult.rows.length > 0
            ? filesResult.rows
            : ver.onnx_file_key
              ? [
                    {
                        package_id: null,
                        file_name:
                            ver.onnx_file_key.split("/").pop() ?? "model.onnx",
                        file_key: ver.onnx_file_key,
                        file_size: ver.onnx_file_size,
                        file_hash: null,
                        file_type: "model",
                    },
                ]
              : [];

    const downloadFiles = await Promise.all(
        files.map(async (file) => ({
            name: file.file_name,
            package_id: file.package_id,
            version_id: ver.id,
            size: file.file_size,
            hash: file.file_hash,
            file_type: file.file_type,
            download_url: await generateDownloadUrl(file.file_key),
        })),
    );

    res.json({
        version: {
            id: ver.id,
            version: ver.version,
            onnx_file_size: ver.onnx_file_size,
            metadata: ver.metadata,
            created_at: ver.created_at,
        },
        files: downloadFiles,
    });
}

export async function verifyVersion(req: Request, res: Response) {
    const { name, version } = req.params;
    const userId = req.user!.id;

    const pkgResult = await query(
        "SELECT id, owner_id FROM packages WHERE name = $1",
        [name],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }

    const pkg = pkgResult.rows[0];
    if (pkg.owner_id !== userId) {
        res.status(403).json({ error: "You do not own this package" });
        return;
    }

    const versionResult = await query<{ id: string }>(
        "SELECT id FROM versions WHERE package_id = $1 AND version = $2",
        [pkg.id, version],
    );

    if (versionResult.rows.length === 0) {
        res.status(404).json({
            error: `Version ${version} of "${name}" not found`,
        });
        return;
    }

    const verId = versionResult.rows[0]!.id;
    const filesResult = await query<{
        file_name: string;
        file_key: string;
        file_hash: string | null;
    }>(
        `SELECT file_name, file_key, file_hash
        FROM version_files WHERE version_id = $1
        ORDER BY file_name ASC`,
        [verId],
    );

    if (filesResult.rows.length === 0) {
        res.status(404).json({
            error: `No files found for version ${version} of "${name}"`,
        });
        return;
    }

    const missingHashes = filesResult.rows.filter((file) => !file.file_hash);
    if (missingHashes.length > 0) {
        res.status(400).json({
            error: "Missing file hashes for verification",
            files: missingHashes.map((file) => file.file_name),
        });
        return;
    }

    const mismatches: { name: string; expected: string; actual: string }[] = [];
    for (const file of filesResult.rows) {
        const stream = await getObjectStream(file.file_key);
        const actual = await hashStream(stream);
        const expected = file.file_hash!.toLowerCase();
        if (actual.toLowerCase() !== expected) {
            mismatches.push({
                name: file.file_name,
                expected,
                actual,
            });
        }
    }

    if (mismatches.length > 0) {
        res.status(409).json({
            error: "Hash verification failed",
            mismatches,
        });
        return;
    }

    res.json({
        message: "Version verified",
        verified_files: filesResult.rows.length,
    });
}

export async function deleteVersion(req: Request, res: Response) {
    const { name, version } = req.params;
    const userId = req.user!.id;

    const pkgResult = await query(
        "SELECT id, owner_id FROM packages WHERE name = $1",
        [name],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }

    const pkg = pkgResult.rows[0];
    if (pkg.owner_id !== userId) {
        res.status(403).json({ error: "You do not own this package" });
        return;
    }

    const filesResult = await query<{ file_key: string }>(
        `SELECT file_key FROM version_files
        WHERE package_id = $1 AND version_id = (
            SELECT id FROM versions WHERE package_id = $1 AND version = $2
        )`,
        [pkg.id, version],
    );

    if (filesResult.rows.length > 0) {
        try {
            await deleteObjects(filesResult.rows.map((row) => row.file_key));
        } catch (err) {
            res.status(502).json({
                error: "Failed to delete files from storage",
            });
            return;
        }
    }

    const { rowCount } = await query(
        "DELETE FROM versions WHERE package_id = $1 AND version = $2",
        [pkg.id, version],
    );

    if (!rowCount) {
        res.status(404).json({
            error: `Version ${version} of "${name}" not found`,
        });
        return;
    }

    res.json({ message: `Version ${version} deleted` });
}

export async function rollbackVersion(req: Request, res: Response) {
    const { name, version } = req.params;
    const ownerId = req.user!.id;

    const pkgResult = await query(
        "SELECT id FROM packages WHERE name = $1 AND owner_id = $2",
        [name, ownerId],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({
            error: `Package "${name}" not found or not owned by you`,
        });
        return;
    }

    const pkgId = pkgResult.rows[0].id as string;
    const { rowCount } = await query(
        "UPDATE versions SET is_yanked = true WHERE package_id = $1 AND version = $2",
        [pkgId, version],
    );

    if (!rowCount) {
        res.status(404).json({
            error: `Version ${version} of "${name}" not found`,
        });
        return;
    }

    res.json({ message: `Version ${version} rolled back` });
}
