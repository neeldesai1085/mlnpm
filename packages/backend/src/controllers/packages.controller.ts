import type { Request, Response } from "express";
import { z } from "zod";
import { query } from "../db/client.js";

const createPackageSchema = z.object({
    name: z.string().min(2).max(128)
        .regex(/^[a-z0-9][a-z0-9._-]*$/, "Name: start with a-z/0-9, then a-z, 0-9, ., _, -"),
    description: z.string().max(2000).optional().default(""),
});

export async function createPackage(req: Request, res: Response) {
    const parsed = createPackageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error).fieldErrors });
        return;
    }
    const { name, description } = parsed.data;
    const ownerId = req.user!.id;

    const existing = await query("SELECT id FROM packages WHERE name = $1", [name]);
    if (existing.rows.length > 0) {
        res.status(409).json({ error: `Package "${name}" already exists` });
        return;
    }

    const { rows } = await query<{ id: string; name: string; created_at: string }>(
        `INSERT INTO packages (name, description, owner_id)
        VALUES ($1, $2, $3) RETURNING id, name, created_at`,
        [name, description, ownerId]
    );
    res.status(201).json({ message: `Package "${name}" created`, package: rows[0] });
}

export async function getPackage(req: Request, res: Response) {
    const { name } = req.params;
    const pkgResult = await query(
        `SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
                u.username AS owner
        FROM packages p JOIN users u ON u.id = p.owner_id
        WHERE p.name = $1`,
        [name]
    );
    
    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }

    const versionsResult = await query(
        `SELECT id, version, onnx_file_size, metadata, is_yanked, created_at
        FROM versions WHERE package_id = $1 ORDER BY created_at DESC`,
        [pkgResult.rows[0].id]
    );

    res.json({
        package: { ...pkgResult.rows[0], versions: versionsResult.rows },
    });
}