import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,                      
    idleTimeoutMillis: 30_000,    
    connectionTimeoutMillis: 5_000, 
});

pool.on("error", (err) => {
    console.error("⚠️ Unexpected database pool error:", err);
});

export const query = <T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
) => pool.query<T>(text, params);