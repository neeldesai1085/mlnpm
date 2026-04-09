import type { OnnxSession } from "./session.js";

export interface TensorConfig {
    data: number[] | bigint[] | string[] | boolean[];
    shape: number[];
    type: "float32" | "int64" | "int32" | "bool" | "string";
}

export interface WrapperConfig {
    inputs: string[];
    outputs: string[];
    predict: (sessions: Record<string, OnnxSession>, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    stream?: (sessions: Record<string, OnnxSession>, input: Record<string, unknown>) => AsyncGenerator<Record<string, unknown>, void, unknown>;
}

export interface ModelConfig extends WrapperConfig {
    name: string;
    version: string;
    registryUrl: string;
}

export interface ModelInstance {
    init: () => Promise<void>;
    predict: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    stream?: (input: Record<string, unknown>) => AsyncGenerator<Record<string, unknown>, void, unknown>;
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
