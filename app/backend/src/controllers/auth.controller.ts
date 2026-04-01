import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool, query } from "../db/client.js";
import { env } from "../config/env.js";
import {
    sendOtpEmail,
    sendPasswordResetOtpEmail,
} from "../services/email.service.js";
import { getCloudinarySignature as buildCloudinarySignature } from "../services/cloudinary.service.js";

const registerSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(64)
        .regex(/^[a-z0-9_-]+$/, "Username: only a-z, 0-9, _ and -"),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

const verifyOtpSchema = z.object({
    email: z.email(),
    otp: z.string().min(4).max(12),
});

const resendOtpSchema = z.object({
    email: z.email(),
});

const requestPasswordResetSchema = z.object({
    email: z.email(),
});

const resendPasswordResetSchema = z.object({
    email: z.email(),
});

const verifyPasswordResetSchema = z.object({
    email: z.email(),
    otp: z.string().min(4).max(12),
});

const resetPasswordSchema = z.object({
    email: z.email(),
    otp: z.string().min(4).max(12),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const updateProfileSchema = z.object({
    full_name: z.string().min(1).max(200),
    avatar_url: z.url().optional().nullable(),
});

const SALT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

function signToken(payload: { id: string; username: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

function createOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function verifyOtpHash(otp: string, otpHash: string): boolean {
    const incoming = Buffer.from(hashOtp(otp));
    const existing = Buffer.from(otpHash);

    if (incoming.length !== existing.length) {
        return false;
    }

    return crypto.timingSafeEqual(incoming, existing);
}

export async function getProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const { rows } = await query<{
        id: string;
        username: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
        packages_count: number;
    }>(
        "SELECT id, username, email, full_name, avatar_url, packages_count FROM users WHERE id = $1",
        [userId],
    );

    if (!rows.length) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    res.json({ user: rows[0] });
}

export async function updateProfile(req: Request, res: Response) {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const userId = req.user!.id;
    const { full_name, avatar_url } = parsed.data;

    const { rows } = await query<{
        id: string;
        username: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
        packages_count: number;
    }>(
        "UPDATE users SET full_name = $1, avatar_url = $2, updated_at = now() WHERE id = $3 RETURNING id, username, email, full_name, avatar_url, packages_count",
        [full_name, avatar_url ?? null, userId],
    );

    res.json({ user: rows[0] });
}

export async function getCloudinarySignature(req: Request, res: Response) {
    res.json(buildCloudinarySignature());
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
        [username, email],
    );
    if (existing.rows.length > 0) {
        res.status(409).json({ error: "Username or email already taken" });
        return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const otp = createOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await query(
        `INSERT INTO otp_requests (email, username, password_hash, otp_hash, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
            username = EXCLUDED.username,
            password_hash = EXCLUDED.password_hash,
            otp_hash = EXCLUDED.otp_hash,
            expires_at = EXCLUDED.expires_at,
            created_at = now()`,
        [email, username, passwordHash, otpHash, expiresAt],
    );

    setTimeout(() => {
        void sendOtpEmail(email, otp).catch((err) => {
            console.error("Failed to send OTP email:", err);
        });
    }, 0);

    res.status(200).json({
        message: "OTP sent to email",
    });
}

export async function verifyOtp(req: Request, res: Response) {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email, otp } = parsed.data;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const otpResult = await client.query<{
            email: string;
            username: string;
            password_hash: string;
            otp_hash: string;
            expires_at: Date;
        }>(
            "SELECT email, username, password_hash, otp_hash, expires_at FROM otp_requests WHERE email = $1",
            [email],
        );

        if (otpResult.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "OTP request not found" });
            return;
        }

        const otpRequest = otpResult.rows[0]!;

        if (otpRequest.expires_at.getTime() < Date.now()) {
            await client.query("DELETE FROM otp_requests WHERE email = $1", [
                email,
            ]);
            await client.query("COMMIT");
            res.status(400).json({ error: "OTP expired" });
            return;
        }

        if (!verifyOtpHash(otp, otpRequest.otp_hash)) {
            await client.query("ROLLBACK");
            res.status(401).json({ error: "Invalid OTP" });
            return;
        }

        const existing = await client.query(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            [otpRequest.username, otpRequest.email],
        );
        if (existing.rows.length > 0) {
            await client.query("ROLLBACK");
            res.status(409).json({ error: "Username or email already taken" });
            return;
        }

        const created = await client.query<{ id: string; username: string }>(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3) RETURNING id, username`,
            [otpRequest.username, otpRequest.email, otpRequest.password_hash],
        );

        await client.query("DELETE FROM otp_requests WHERE email = $1", [
            email,
        ]);
        await client.query("COMMIT");

        const user = created.rows[0]!;
        res.status(201).json({
            message: "OTP verified",
            token: signToken({ id: user.id, username: user.username }),
            user: { id: user.id, username: user.username },
        });
    } catch {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Failed to verify OTP" });
    } finally {
        client.release();
    }
}

export async function resendOtp(req: Request, res: Response) {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email } = parsed.data;

    const { rows } = await query<{
        email: string;
        created_at: Date;
    }>("SELECT email, created_at FROM otp_requests WHERE email = $1", [email]);

    if (rows.length === 0) {
        res.status(400).json({ error: "OTP request not found" });
        return;
    }

    const request = rows[0]!;
    const elapsedMs = Date.now() - request.created_at.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        res.status(429).json({
            error: `Please wait ${retryAfter}s before resending OTP`,
            retryAfter,
        });
        return;
    }

    const otp = createOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await query(
        "UPDATE otp_requests SET otp_hash = $1, expires_at = $2, created_at = now() WHERE email = $3",
        [otpHash, expiresAt, email],
    );

    setTimeout(() => {
        void sendOtpEmail(email, otp).catch((err) => {
            console.error("Failed to resend OTP email:", err);
        });
    }, 0);

    res.status(200).json({ message: "OTP resent" });
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: z.flattenError(parsed.error).fieldErrors,
        });
        return;
    }

    const { username, password } = parsed.data;

    const { rows } = await query<{
        id: string;
        username: string;
        password_hash: string;
    }>("SELECT id, username, password_hash FROM users WHERE username = $1", [
        username,
    ]);

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

export async function requestPasswordReset(req: Request, res: Response) {
    const parsed = requestPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email } = parsed.data;

    const existing = await query<{ username: string }>(
        "SELECT username FROM users WHERE email = $1",
        [email],
    );
    if (existing.rows.length === 0) {
        res.status(404).json({ error: "Email not found" });
        return;
    }

    const username = existing.rows[0]!.username;

    const otp = createOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await query(
        `INSERT INTO password_reset_requests (email, otp_hash, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET
            otp_hash = EXCLUDED.otp_hash,
            expires_at = EXCLUDED.expires_at,
            created_at = now()`,
        [email, otpHash, expiresAt],
    );

    setTimeout(() => {
        void sendPasswordResetOtpEmail(email, username, otp).catch((err) => {
            console.error("Failed to send password reset OTP email:", err);
        });
    }, 0);

    res.status(200).json({ message: "Password reset OTP sent" });
}

export async function resendPasswordReset(req: Request, res: Response) {
    const parsed = resendPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email } = parsed.data;

    const { rows } = await query<{
        email: string;
        created_at: Date;
        username: string;
    }>(
        "SELECT pr.email, pr.created_at, u.username FROM password_reset_requests pr JOIN users u ON u.email = pr.email WHERE pr.email = $1",
        [email],
    );

    if (rows.length === 0) {
        res.status(400).json({ error: "Password reset request not found" });
        return;
    }

    const request = rows[0]!;
    const elapsedMs = Date.now() - request.created_at.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        res.status(429).json({
            error: `Please wait ${retryAfter}s before resending OTP`,
            retryAfter,
        });
        return;
    }

    const otp = createOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await query(
        "UPDATE password_reset_requests SET otp_hash = $1, expires_at = $2, created_at = now() WHERE email = $3",
        [otpHash, expiresAt, email],
    );

    setTimeout(() => {
        void sendPasswordResetOtpEmail(email, request.username, otp).catch(
            (err) => {
                console.error(
                    "Failed to resend password reset OTP email:",
                    err,
                );
            },
        );
    }, 0);

    res.status(200).json({ message: "Password reset OTP resent" });
}

export async function verifyPasswordReset(req: Request, res: Response) {
    const parsed = verifyPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email, otp } = parsed.data;

    const { rows } = await query<{
        otp_hash: string;
        expires_at: Date;
    }>(
        "SELECT otp_hash, expires_at FROM password_reset_requests WHERE email = $1",
        [email],
    );

    if (rows.length === 0) {
        res.status(400).json({ error: "Password reset request not found" });
        return;
    }

    const request = rows[0]!;

    if (request.expires_at.getTime() < Date.now()) {
        await query("DELETE FROM password_reset_requests WHERE email = $1", [
            email,
        ]);
        res.status(400).json({ error: "OTP expired" });
        return;
    }

    if (!verifyOtpHash(otp, request.otp_hash)) {
        res.status(401).json({ error: "Invalid OTP" });
        return;
    }

    res.status(200).json({ message: "OTP verified" });
}

export async function resetPassword(req: Request, res: Response) {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: z.flattenError(parsed.error) });
        return;
    }

    const { email, otp, password } = parsed.data;

    const { rows } = await query<{
        otp_hash: string;
        expires_at: Date;
    }>(
        "SELECT otp_hash, expires_at FROM password_reset_requests WHERE email = $1",
        [email],
    );

    if (rows.length === 0) {
        res.status(400).json({ error: "Password reset request not found" });
        return;
    }

    const request = rows[0]!;

    if (request.expires_at.getTime() < Date.now()) {
        await query("DELETE FROM password_reset_requests WHERE email = $1", [
            email,
        ]);
        res.status(400).json({ error: "OTP expired" });
        return;
    }

    if (!verifyOtpHash(otp, request.otp_hash)) {
        res.status(401).json({ error: "Invalid OTP" });
        return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [passwordHash, email],
    );

    if (updated.rowCount === 0) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    await query("DELETE FROM password_reset_requests WHERE email = $1", [
        email,
    ]);

    res.status(200).json({ message: "Password updated" });
}
