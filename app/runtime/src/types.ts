export interface WrapperConfig {
    inputs: string[];
    outputs: string[];
    preprocess: (data: Record<string, unknown>) => number[];
    postprocess: (rawOutput: number[]) => Record<string, unknown>;
}

export interface ModelConfig extends WrapperConfig {
    name: string;
    version: string;
    registryUrl: string;
}

export interface ModelInstance {
    init: () => Promise<void>;
    predict: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    isReady: () => boolean;
    dispose: () => void;
}

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
