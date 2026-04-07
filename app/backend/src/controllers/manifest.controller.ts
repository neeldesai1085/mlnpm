import type { Request, Response } from "express";
import { query } from "../db/client.js";
import { generateDownloadUrl } from "../services/r2.service.js";

export async function getManifest(req: Request, res: Response) {
    const { name, version: versionParam } = req.params;

    const pkgResult = await query(
        `SELECT p.id, p.name, p.description
         FROM packages p
         WHERE p.name = $1`,
        [name],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }
    const pkg = pkgResult.rows[0];

    let versionRow: {
        id: string;
        version: string;
        onnx_file_key: string;
        onnx_file_size: number;
        metadata: Record<string, unknown>;
    };

    if (versionParam === "latest") {
        const result = await query<typeof versionRow>(
            `SELECT id, version, onnx_file_key, onnx_file_size, metadata
             FROM versions
             WHERE package_id = $1 AND is_yanked = false
             ORDER BY created_at DESC
             LIMIT 1`,
            [pkg.id],
        );
        if (result.rows.length === 0) {
            res.status(404).json({
                error: `No published versions found for "${name}"`,
            });
            return;
        }
        versionRow = result.rows[0]!;

    } else {
        const result = await query<typeof versionRow>(
            `SELECT id, version, onnx_file_key, onnx_file_size, metadata
             FROM versions
             WHERE package_id = $1 AND version = $2`,
            [pkg.id, versionParam],
        );
        if (result.rows.length === 0) {
            res.status(404).json({
                error: `Version ${versionParam} of "${name}" not found`,
            });
            return;
        }
        const ver = result.rows[0]!;
        if ((ver as any).is_yanked) {
            res.status(410).json({
                error: `Version ${versionParam} has been yanked`,
            });
            return;
        }
        versionRow = ver;
    }

    const filesResult = await query<{
        file_name: string;
        file_key: string;
        file_size: number;
        file_hash: string | null;
        file_type: string;
    }>(
        `SELECT file_name, file_key, file_size, file_hash, file_type
         FROM version_files
         WHERE version_id = $1
         ORDER BY file_type ASC, file_name ASC`,
        [versionRow.id],
    );

    const wrapperFile = filesResult.rows.find((f) => f.file_type === "wrapper");
    const modelFiles = filesResult.rows.filter((f) => f.file_type === "model");

    if (modelFiles.length === 0 && versionRow.onnx_file_key) {
        modelFiles.push({
            file_name:
                versionRow.onnx_file_key.split("/").pop() ?? "model.onnx",
            file_key: versionRow.onnx_file_key,
            file_size: versionRow.onnx_file_size,
            file_hash: null,
            file_type: "model",
        });
    }

    const wrapperResponse = wrapperFile
        ? {
              file_name: wrapperFile.file_name,
              download_url: await generateDownloadUrl(wrapperFile.file_key),
          }
        : null;
        
    const modelFilesResponse = await Promise.all(
        modelFiles.map(async (f) => ({
            file_name: f.file_name,
            file_size: f.file_size,
            file_hash: f.file_hash,
            download_url: await generateDownloadUrl(f.file_key),
        })),
    );

    await query(
        "UPDATE packages SET access_count = access_count + 1 WHERE id = $1",
        [pkg.id],
    );

    res.json({
        name: pkg.name,
        version: versionRow.version,
        description: pkg.description,
        metadata: versionRow.metadata,
        wrapper: wrapperResponse,
        model_files: modelFilesResponse,
    });
}