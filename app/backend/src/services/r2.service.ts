import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

const s3 = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
});

export async function generateUploadUrl(key: string, ttl = 900): Promise<string> {
    const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key });
    return getSignedUrl(s3, command, { expiresIn: ttl });
}

export async function generateDownloadUrl(key: string, ttl = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key });
    return getSignedUrl(s3, command, { expiresIn: ttl });
}