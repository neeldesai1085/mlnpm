import type { Request, Response } from "express";
import { z } from "zod";
import { pool, query } from "../db/client.js";
import {
    generateUploadUrl,
    generateDownloadUrl,
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
        onnx_file_hash: z.string().optional(),
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

    const {
        version,
        onnx_file_size,
        onnx_file_hash,
        onnx_file_name,
        metadata,
    } = parsed.data;

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

    let files: { name: string; size: number; hash: string | null }[] = [];
    try {
        files = parsed.data.files?.length
            ? parsed.data.files.map((file) => ({
                  name: ensureOnnxFile(sanitizeFileName(file.name)),
                  size: file.size,
                  hash: file.hash ?? null,
              }))
            : [
                  {
                      name: ensureOnnxFile(
                          sanitizeFileName(onnx_file_name ?? "model.onnx"),
                      ),
                      size: onnx_file_size!,
                      hash: onnx_file_hash ?? null,
                  },
              ];
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

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const primaryKey = `packages/${name}/${version}/${files[0]!.name}`;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { rows } = await client.query<{ id: string }>(
            `INSERT INTO versions (package_id, version, onnx_file_key, onnx_file_size, onnx_file_hash, metadata)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
                pkg.id,
                version,
                primaryKey,
                totalSize,
                files.length === 1 ? files[0]!.hash : null,
                metadata,
            ],
        );

        const versionId = rows[0]!.id;
        for (const file of files) {
            const fileKey = `packages/${name}/${version}/${file.name}`;
            await client.query(
                `INSERT INTO version_files (version_id, package_id, file_name, file_key, file_size, file_hash)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [versionId, pkg.id, file.name, fileKey, file.size, file.hash],
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
                v.onnx_file_hash, v.metadata, v.is_yanked, v.created_at
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
    }>(
        `SELECT package_id, file_name, file_key, file_size, file_hash
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
                        file_hash: ver.onnx_file_hash ?? null,
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
            download_url: await generateDownloadUrl(file.file_key),
        })),
    );

    res.json({
        version: {
            id: ver.id,
            version: ver.version,
            onnx_file_size: ver.onnx_file_size,
            onnx_file_hash: ver.onnx_file_hash,
            metadata: ver.metadata,
            created_at: ver.created_at,
        },
        files: downloadFiles,
    });
}
