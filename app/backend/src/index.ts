import express from "express";
import type {
    Request,
    Response,
    ErrorRequestHandler,
    NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { pool } from "./db/client.js";
import authRoutes from "./routes/auth.routes.js";
import packagesRoutes from "./routes/packages.routes.js";
import versionsRoutes from "./routes/versions.routes.js";

const app = express();

app.use(helmet());

const allowedOrigins = [env.FRONTEND_URL, "http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            status: "ok",
            service: "mlnpm-backend",
            timestamp: new Date().toISOString(),
        });
    } catch {
        res.status(503).json({
            status: "error",
            message: "Database connection failed",
        });
    }
});

app.use("/auth", authRoutes);
app.use("/packages", packagesRoutes);
app.use("/packages/:name/versions", versionsRoutes);

const OTP_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

setInterval(async () => {
    try {
        await pool.query("DELETE FROM otp_requests WHERE expires_at < now()");
        await pool.query(
            "DELETE FROM password_reset_requests WHERE expires_at < now()",
        );
    } catch (err) {
        console.error("Failed to cleanup expired OTP entries:", err);
    }
}, OTP_CLEANUP_INTERVAL_MS);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

app.use(
    (
        err: ErrorRequestHandler,
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        console.error("Unhandled error:", err);
        res.status(500).json({ error: "Internal server error" });
    },
);

app.listen(env.PORT, () => {
    console.log(`\n🚀 mlnpm server running on port ${env.PORT}`);
});
