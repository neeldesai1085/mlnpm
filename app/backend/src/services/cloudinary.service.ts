import crypto from "node:crypto";
import { env } from "../config/env.js";

type CloudinarySignature = {
    cloudName: string;
    apiKey: string;
    timestamp: string;
    signature: string;
    folder: string;
};

function createSignature(params: Record<string, string>): string {
    const payload = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    return crypto
        .createHash("sha1")
        .update(payload + env.CLOUDINARY_API_SECRET)
        .digest("hex");
}

export function getCloudinarySignature(): CloudinarySignature {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = env.CLOUDINARY_FOLDER;
    const signature = createSignature({ folder, timestamp });

    return {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder,
    };
}
