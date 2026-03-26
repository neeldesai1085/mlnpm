import dotenv from "dotenv";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config(
    {
        path: path.resolve(dirname, "../../.env")
    }
);

const envSchema = z.object({
    DATABASE_URL: z.url("DATABASE_URL must be a valid connection string"),
    R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
    R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
    R2_ENDPOINT: z.url("R2_ENDPOINT must be a valid URL"),
    R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
    PORT: z.coerce.number().default(3000),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
    SMTP_FROM: z.string().min(1, "SMTP_FROM is required"),
    SMTP_SECURE: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error(`❌ Invalid environment variables: ${z.flattenError(parsed.error).fieldErrors}`);
    process.exit(1);
}

export const env = parsed.data;