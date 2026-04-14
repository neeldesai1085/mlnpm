import { REGISTRY_URL } from "../constants.js";

export interface ManifestResponse {
    name: string;
    version: string;
    description: string;
    metadata: Record<string, unknown>;
    wrapper: {
        file_name: string;
        download_url: string;
    } | null;
    model_files: Array<{
        file_name: string;
        file_size: number;
        file_hash: string | null;
        download_url: string;
    }>;
}

export async function fetchManifest(
    packageName: string,
    version: string = "latest",
): Promise<ManifestResponse> {
    const url = `${REGISTRY_URL}/packages/${packageName}/versions/${version}/manifest`;
    const res = await fetch(url);

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorMsg =
            (body as any).error || `HTTP ${res.status} ${res.statusText}`;
        throw new Error(errorMsg);
    }

    return (await res.json()) as ManifestResponse;
}

export async function downloadFile(url: string): Promise<string> {
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }

    return res.text();
}
