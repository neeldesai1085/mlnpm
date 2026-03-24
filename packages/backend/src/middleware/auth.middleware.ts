import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthPayload {
    id: string;
    username: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or malformed Authorization header" });
        return;
    }
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
}