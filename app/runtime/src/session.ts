import * as ort from "onnxruntime-node";
import type { TensorConfig } from "./types.js";

export class OnnxSession {
    private session: ort.InferenceSession | null = null;
    private modelPath: string;

    constructor(modelPath: string) {
        this.modelPath = modelPath;
    }

    async load(): Promise<void> {
        this.session = await ort.InferenceSession.create(this.modelPath, {
            executionProviders: ['cuda', 'coreml', 'cpu']
        });
    }

    isLoaded(): boolean {
        return this.session !== null;
    }

    async run(preprocessedInputs: Record<string, TensorConfig>): Promise<Record<string, any>> {
        if (!this.session) {
            throw new Error("Model not loaded. Call init() before predict().");
        }

        const feeds: Record<string, ort.Tensor> = {};

        for (const [inputName, config] of Object.entries(preprocessedInputs)) {
            let rawData;
            
            if (config.type === "int64") {
                rawData = new BigInt64Array(config.data as bigint[]);
            } else if (config.type === "float32") {
                rawData = new Float32Array(config.data as number[]);
            } else if (config.type === "int32") {
                rawData = new Int32Array(config.data as number[]);
            } else if (config.type === "bool") {
                rawData = Uint8Array.from((config.data as boolean[]).map(b => b ? 1 : 0));
            } else {
                rawData = config.data;
            }

            feeds[inputName] = new ort.Tensor(config.type, rawData as any, config.shape);
        }

        const results = await this.session.run(feeds);

        return results;
    }

    dispose(): void {
        this.session = null;
    }
}