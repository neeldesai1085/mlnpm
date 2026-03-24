import type { Request, Response } from "express";
import { z } from "zod";
import { query } from "../db/client.js";
import { generateUploadUrl, generateDownloadUrl } from "../services/r2.service.js";

const publishVersionSchema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/,
        "Must follow semver (e.g., 1.0.0)"),
    onnx_file_size: z.coerce.number().int().positive(),
    onnx_file_hash: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function publishVersion(req: Request, res: Response) {
    const { name } = req.params;
    const userId = req.user!.id;

    const parsed = publishVersionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error).fieldErrors });
        return;
    }

    const { version, onnx_file_size, onnx_file_hash, metadata } = parsed.data;

    const pkgResult = await query(
        "SELECT id, owner_id FROM packages WHERE name = $1", [name]
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
        [pkg.id, version]
    );

    if (existingVer.rows.length > 0) {
        res.status(409).json({
        error: `Version ${version} already exists. Versions are immutable.`,
        });
        return;
    }

    const onnxFileKey = `packages/${name}/${version}/model.onnx`;

    const { rows } = await query<{ id: string }>(
        `INSERT INTO versions (package_id, version, onnx_file_key, onnx_file_size, onnx_file_hash, metadata)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [pkg.id, version, onnxFileKey, onnx_file_size, onnx_file_hash ?? null, metadata]
    );

    const uploadUrl = await generateUploadUrl(onnxFileKey);

    res.status(201).json({
        message: `Version ${version} registered for "${name}"`,
        version: { id: rows[0]!.id, version, onnx_file_key: onnxFileKey },
        upload_url: uploadUrl,
    });
}

export async function getVersion(req: Request, res: Response) {
    const { name, version } = req.params;

    const result = await query(
        `SELECT v.id, v.version, v.onnx_file_key, v.onnx_file_size,
                v.onnx_file_hash, v.metadata, v.is_yanked, v.created_at
        FROM versions v JOIN packages p ON p.id = v.package_id
        WHERE p.name = $1 AND v.version = $2`,
        [name, version]
    );

    if (result.rows.length === 0) {
        res.status(404).json({ error: `Version ${version} of "${name}" not found` });
        return;
    }

    const ver = result.rows[0];
    
    if (ver.is_yanked) {
        res.status(410).json({ error: `Version ${version} has been yanked` });
        return;
    }
    
    const downloadUrl = await generateDownloadUrl(ver.onnx_file_key);
    
    res.json({
        version: {
        id: ver.id, version: ver.version, onnx_file_size: ver.onnx_file_size,
        onnx_file_hash: ver.onnx_file_hash, metadata: ver.metadata,
        created_at: ver.created_at,
        },
        download_url: downloadUrl,
    });
}