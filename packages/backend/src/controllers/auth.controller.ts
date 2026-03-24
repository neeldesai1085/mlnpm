import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db/client.js";
import { env } from "../config/env.js";

const registerSchema = z.object({
    username: z.string().min(3).max(64).regex(/^[a-z0-9_-]+$/,
        "Username: only a-z, 0-9, _ and -"),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

const SALT_ROUNDS = 12;

function signToken(payload: { id: string; username: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { username, email, password } = parsed.data;

    const existing = await query(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        [username, email]
    );
    if (existing.rows.length > 0) {
        res.status(409).json({ error: "Username or email already taken" });
        return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await query<{ id: string; username: string }>(
        `INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3) RETURNING id, username`,
        [username, email, passwordHash]
    );

    const user = rows[0]!;

    res.status(201).json({
        message: "User registered successfully",
        token: signToken({ id: user.id, username: user.username }),
        user: { id: user.id, username: user.username },
    });
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error).fieldErrors });
        return;
    }

    const { username, password } = parsed.data;
    
    const { rows } = await query<{ id: string; username: string; password_hash: string }>(
        "SELECT id, username, password_hash FROM users WHERE username = $1",
        [username]
    );
    
    if (rows.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    
    const user = rows[0]!;
    
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    
    res.json({
        message: "Login successful",
        token: signToken({ id: user.id, username: user.username }),
        user: { id: user.id, username: user.username },
    });
}