import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ  NOT NULL DEFAULT now()
        );
    `);
}


async function getAppliedMigrations(): Promise<Set<string>> {
    const { rows } = await query<{ name: string }>(
        "SELECT name FROM _migrations ORDER BY id"
    );
    return new Set(rows.map((r) => r.name));
}

async function migrate() {
    console.log("🔄 Starting database migration...\n");
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    let ranCount = 0;
    for (const file of files) {
        if (applied.has(file)) {
            console.log(`⏭ ${file} (already applied)`);
            continue;
        }
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
            await client.query("COMMIT");
            console.log(`✅ ${file}`);
            ranCount++;
        } 
        catch (err) {
            await client.query("ROLLBACK");
            console.error(`❌ ${file} — rolled back`);
            throw err;
        } 
        finally {
            client.release();
        }
    }
    console.log(`\n✅ Migration complete. ${ranCount} new migration(s) applied.\n`);
    await pool.end();
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});