import type { Request, Response } from "express";
import { z } from "zod";
import { query } from "../db/client.js";

const createPackageSchema = z.object({
    name: z
        .string()
        .min(2)
        .max(128)
        .regex(
            /^[a-z0-9][a-z0-9._-]*$/,
            "Name: start with a-z/0-9, then a-z, 0-9, ., _, -",
        ),
    description: z.string().max(2000).optional().default(""),
    documentation_md: z.string().max(50000).optional().default(""),
});

const updatePackageSchema = z.object({
    description: z.string().max(2000).optional(),
    documentation_md: z.string().max(50000).optional(),
});

export async function createPackage(req: Request, res: Response) {
    const parsed = createPackageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: z.flattenError(parsed.error).fieldErrors,
        });
        return;
    }
    const { name, description } = parsed.data;
    const documentation_md = parsed.data.documentation_md ?? "";
    const ownerId = req.user!.id;

    const existing = await query("SELECT id FROM packages WHERE name = $1", [
        name,
    ]);
    if (existing.rows.length > 0) {
        res.status(409).json({ error: `Package "${name}" already exists` });
        return;
    }

    const { rows } = await query<{
        id: string;
        name: string;
        created_at: string;
    }>(
        `INSERT INTO packages (name, description, documentation_md, owner_id)
        VALUES ($1, $2, $3, $4) RETURNING id, name, created_at`,
        [name, description, documentation_md, ownerId],
    );

    await query(
        "UPDATE users SET packages_count = packages_count + 1 WHERE id = $1",
        [ownerId],
    );
    res.status(201).json({
        message: `Package "${name}" created`,
        package: rows[0],
    });
}

export async function getPackage(req: Request, res: Response) {
    const { name } = req.params;
    const pkgResult = await query(
        `SELECT p.id, p.name, p.description, p.documentation_md, p.created_at, p.updated_at, p.access_count,
                u.username AS owner
        FROM packages p JOIN users u ON u.id = p.owner_id
        WHERE p.name = $1`,
        [name],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({ error: `Package "${name}" not found` });
        return;
    }

    const shouldCountView = req.query.view === "1";
    if (shouldCountView) {
        await query(
            "UPDATE packages SET access_count = access_count + 1 WHERE id = $1",
            [pkgResult.rows[0].id],
        );
    }

    const versionsResult = await query(
        `SELECT id, version, onnx_file_size, metadata, is_yanked, created_at
        FROM versions WHERE package_id = $1 ORDER BY created_at DESC`,
        [pkgResult.rows[0].id],
    );

    res.json({
        package: { ...pkgResult.rows[0], versions: versionsResult.rows },
    });
}

export async function updatePackage(req: Request, res: Response) {
    const parsed = updatePackageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: z.flattenError(parsed.error).fieldErrors,
        });
        return;
    }

    const { name } = req.params;
    const ownerId = req.user!.id;
    const { description, documentation_md } = parsed.data;

    const shouldUpdateDescription = typeof description === "string";
    const shouldUpdateDocs = typeof documentation_md === "string";

    if (!shouldUpdateDescription && !shouldUpdateDocs) {
        res.status(400).json({ error: "No updates provided" });
        return;
    }

    const { rowCount, rows } = await query<{
        id: string;
        name: string;
        description: string;
        documentation_md: string;
        updated_at: string;
    }>(
        `UPDATE packages
        SET description = COALESCE($1, description),
            documentation_md = COALESCE($2, documentation_md)
        WHERE name = $3 AND owner_id = $4
        RETURNING id, name, description, documentation_md, updated_at`,
        [
            shouldUpdateDescription ? description : null,
            shouldUpdateDocs ? documentation_md : null,
            name,
            ownerId,
        ],
    );

    if (!rowCount) {
        res.status(404).json({
            error: `Package "${name}" not found or not owned by you`,
        });
        return;
    }

    res.json({
        message: `Package "${name}" updated`,
        package: rows[0],
    });
}

export async function getPackages(req: Request, res: Response) {
    const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
    const limitRaw =
        typeof req.query.limit === "string" ? Number(req.query.limit) : 60;
    const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 200)
        : 60;

    if (search.length > 0) {
        const { rows } = await query(
            `SELECT p.id, p.name, p.description, p.created_at, p.updated_at, p.access_count,
                    u.username AS owner
            FROM packages p JOIN users u ON u.id = p.owner_id
            WHERE p.name ILIKE $1
                ORDER BY p.access_count DESC
            LIMIT $2`,
            [`%${search}%`, limit],
        );
        res.json({ packages: rows });
        return;
    }

    const { rows } = await query(
        `SELECT p.id, p.name, p.description, p.documentation_md, p.created_at, p.updated_at, p.access_count,
                u.username AS owner
        FROM packages p JOIN users u ON u.id = p.owner_id
        ORDER BY p.access_count DESC
        LIMIT $1`,
        [limit],
    );
    res.json({ packages: rows });
}

export async function deletePackage(req: Request, res: Response) {
    const { name } = req.params;
    const ownerId = req.user!.id;

    const pkgResult = await query<{ id: string }>(
        "SELECT id FROM packages WHERE name = $1 AND owner_id = $2",
        [name, ownerId],
    );

    if (pkgResult.rows.length === 0) {
        res.status(404).json({
            error: `Package "${name}" not found or not owned by you`,
        });
        return;
    }

    const pkgId = pkgResult.rows[0]!.id;
    const { rowCount } = await query(
        "UPDATE versions SET is_yanked = true WHERE package_id = $1 AND is_yanked = false",
        [pkgId],
    );

    res.json({
        message: `Package "${name}" yanked`,
        yanked_versions: rowCount ?? 0,
    });
}
