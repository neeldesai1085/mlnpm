import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { getCachePath, ensureCacheDir } from "./cache.js";

export async function downloadToCache(
    url: string,
    pkgName: string,
    version: string,
    fileName: string = "model.onnx",
    onProgress?: (percent: number) => void,
): Promise<string> {
    
    ensureCacheDir(pkgName, version);
    const destPath = getCachePath(pkgName, version, fileName);
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Download failed: ${response.status} ${response.statusText}`,
        );
    }
    if (!response.body) {
        throw new Error("Response body is empty");
    }

    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let downloadedBytes = 0;
    
    const reader = response.body.getReader();
    const progressStream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
                controller.close();
                return;
            }
            downloadedBytes += value.byteLength;
            if (totalBytes > 0 && onProgress) {
                const percent = Math.round(
                    (downloadedBytes / totalBytes) * 100,
                );
                onProgress(Math.min(percent, 100));
            }
            controller.enqueue(value);
        },
    });

    const nodeStream = Readable.fromWeb(
        progressStream as import("node:stream/web").ReadableStream,
    );

    const writeStream = createWriteStream(destPath);
    await pipeline(nodeStream, writeStream);

    if (onProgress) {
        onProgress(100);
    }
    return destPath;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}