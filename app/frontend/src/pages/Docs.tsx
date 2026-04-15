import { useState } from "react";
import { Link } from "react-router-dom";
import { getToken } from "../utils/api";

type Section = "intro" | "cli" | "runtime" | "publish" | "wrappers";

export default function Docs() {
    const [activeSection, setActiveSection] = useState<Section>("intro");
    const isAuthenticated = Boolean(getToken());

    const sections: Record<Section, string> = {
        intro: "Overview & Architecture",
        publish: "Publishing Models",
        wrappers: "Writing Wrappers (Courier)",
        cli: "The MLNPM CLI Reference",
        runtime: "The MLNPM Runtime Reference",
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row py-8 px-4 sm:px-6 lg:px-8">
            {/* Sidebar Navigation */}
            <nav className="w-full md:w-64 flex-shrink-0 pr-8 mb-8 md:mb-0">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                    Documentation
                </h2>
                <ul className="space-y-2">
                    {Object.entries(sections).map(([key, title]) => {
                        const isActive = activeSection === key;
                        return (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveSection(key as Section)}
                                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-indigo-600/10 text-indigo-400"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                    }`}
                                >
                                    {title}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-8 border-t border-slate-800 pt-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
                        Quick Links
                    </h2>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>
                            <Link to="/explore" className="hover:text-indigo-400 transition-colors">
                                Explore Published Models
                            </Link>
                        </li>
                        <li>
                            <Link to={isAuthenticated ? "/manage" : "/login"} className="hover:text-indigo-400 transition-colors">
                                Publish a Model
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 prose prose-invert prose-indigo max-w-none">
                {activeSection === "intro" && <IntroSection />}
                {activeSection === "publish" && <PublishSection />}
                {activeSection === "wrappers" && <WrappersSection />}
                {activeSection === "cli" && <CliSection />}
                {activeSection === "runtime" && <RuntimeSection />}
            </main>
        </div>
    );
}

function IntroSection() {
    return (
        <div className="space-y-6 text-slate-300">
            <h1 className="text-4xl font-extrabold text-white mb-2">Welcome to MLNPM</h1>
            <p className="text-xl text-slate-400">
                The Standard Distributed Machine Learning Package Manager for Modern Applications.
            </p>
            <div className="h-px bg-slate-800 w-full my-8" />
            
            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Why does MLNPM exist?</h2>
            
            <p>
                Historically, integrating an Artificial Intelligence model into a web application was an incredibly complex engineering feat.
                Data Scientists and Web Developers operate in entirely different architectural ecosystems.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-8">
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5">
                    <h3 className="text-red-400 font-bold mb-2">The Old Era (Without MLNPM)</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Web developers were forced to establish independent python microservices.</li>
                        <li>Models required renting highly expensive external servers just to spin up basic endpoints.</li>
                        <li>Data scientists had to painfully write network APIs and handle HTTP requests perfectly.</li>
                        <li>Gigantic file transfers and manual deployments broke continuously during CI/CD.</li>
                    </ul>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-5">
                    <h3 className="text-emerald-400 font-bold mb-2">The Modern Era (With MLNPM)</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>Models natively execute directly inside your existing Javascript/Typescript architecture.</li>
                        <li>Absolutely zero python code is required in your application logic.</li>
                        <li>You install and manage models seamlessly the exact same way you manage normal NPM web libraries.</li>
                        <li>Zero active server hosting costs for idle inference.</li>
                    </ul>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">The MLNPM Ecosystem</h2>
            <p>
                Our structural standard guarantees flawless interoperability between AI engineers and Web engineers using three primary components:
            </p>
            <ul className="list-disc pl-6 space-y-4 mt-4">
                <li>
                    <strong className="text-indigo-400 text-lg">The Global Extradition Registry:</strong> A colossal, centralized global network containing public machine learning packages. It ensures lightning-fast downloads around the planet and guarantees code immutability so consumer applications never randomly break.
                </li>
                <li>
                    <strong className="text-emerald-400 text-lg">The Local CLI Environment:</strong> A sophisticated CLI program (<code>@mlnpm/cli</code>) executed exclusively on your local workstation and your remote deployment platforms. It oversees tracking precisely which models your application depends on, downloads them seamlessly into your system architecture, handles caching to stop duplicate bandwidth execution, and securely binds the logic correctly.
                </li>
                <li>
                    <strong className="text-pink-400 text-lg">The Standard Runtime:</strong> A heavily optimized native client side utility (<code>@mlnpm/runtime</code>). This enables your Javascript code to safely orchestrate mathematical executions natively at the speed of compiled code without you ever learning the mathematics behind it.
                </li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Universal Workflow</h2>
            <p className="mb-4">Here is the exact step-by-step process of integrating MLNPM into any major web system:</p>

            <ol className="list-decimal pl-6 space-y-4 text-slate-300">
                <li>
                    <strong>Platform Setup:</strong> You begin by opening a standard Web Application (React, Edge, Next.js, traditional Node server, etc.).
                </li>
                <li>
                    <strong>Install Dependencies:</strong> 
                    <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl mt-2 text-sm"><code>{`npm install @mlnpm/runtime
npm install -g @mlnpm/cli`}</code></pre>
                </li>
                <li>
                    <strong>Acquisition:</strong> Using the globally integrated CLI, you request a package. MLNPM securely grabs the necessary gigabytes over our network.
                    <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl mt-2 text-sm"><code>{`mlnpm install house-price-predictor@latest`}</code></pre>
                </li>
                <li>
                    <strong>Execution:</strong> You import the package directly inside your Typescript file, initialize it safely into active execution memory, and immediately begin securely predicting outputs based on structured javascript Object data!
                </li>
            </ol>
        </div>
    );
}

function PublishSection() {
    return (
        <div className="space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white mb-4">Publishing Models</h1>
            <p>
                The MLNPM Unified Dashboard is the exclusive method for AI maintainers and Data Scientists 
                to distribute robust packages to the global community. Our network is capable of securely accepting 
                huge multi-gigabyte uploads rapidly and guarantees they are packaged accurately for immediate consumer deployment.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Prerequisites for Packaging</h2>
            <p>Before launching a model to MLNPM, you must comprehensively guarantee two aspects of your model.</p>
            <ul className="list-disc pl-6 space-y-4 mt-4">
                <li>
                    <strong>The Open Standard Formatting (.onnx):</strong> We strictly adhere to the unified ONNX structure. Frameworks like PyTorch (<code>torch.onnx.export</code>) and TensorFlow natively allow you to transition your models directly into this standard. We support huge file sizes dynamically.
                </li>
                <li>
                    <strong>The Execution Wrapper (wrapper.config.js):</strong> Models are essentially enormous, blind mathematical calculators. A web developer has absolutely no idea what structure of tensor you require. This critical file specifically teaches the local MLNPM ecosystem precisely how to translate normal web developer input gracefully into your required structure safely. (See the <strong>Writing Wrappers</strong> page for deep analysis).
                </li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Golden Laws of Semantic Versioning (SemVer)</h2>
            <p>
                MLNPM strictly enforces Semantic Versioning. A single package name (e.g. <code>sentiment-detector</code>) lasts forever, but it can evolve through continuous updates globally. 
                Our infrastructure permanently locks any version that you successfully publish. This prevents production environments globally from suddenly breaking if a developer accidentally uploads a breaking change over an existing file.
            </p>
            
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mt-4">
                <h3 className="text-lg font-bold text-white mb-2">How to correctly Bump your versions:</h3>
                <p className="text-sm mb-4">Every version requires three distinct numerical identifiers: <code>MAJOR.MINOR.PATCH</code></p>
                
                <ul className="space-y-4">
                    <li className="border-b border-slate-800 pb-4">
                        <strong className="text-red-400">MAJOR (1.0.0 → 2.0.0)</strong><br/>
                        Increase this when you structurally modify what the MLNPM Web Developer receives or inputs. For example: if your model used to require an input variable called <code>"text"</code> but you decided to fundamentally rename it to <code>"phrase"</code>, the old code will crash. You MUST issue a Major version bump.
                    </li>
                    <li className="border-b border-slate-800 pb-4">
                        <strong className="text-amber-400">MINOR (1.0.0 → 1.1.0)</strong><br/>
                        Increase this when you introduce exciting new features but existing functionality is completely safe. For example: if you added an entirely new optional secondary output like <code>"language_confidence"</code> but the exact structural usage from 1.0.0 still functionally works flawlessly.
                    </li>
                    <li className="pt-2">
                        <strong className="text-emerald-400">PATCH (1.0.0 → 1.0.1)</strong><br/>
                        Increase this when you simply fixed a small bug, retrained the model to be 5% more accurate organically, or fundamentally shrunk the file storage size without changing absolutely any code inputs/outputs that the Web Developer integrates.
                    </li>
                </ul>
            </div>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Dashboard Upload Protocol</h2>
            <p>The system to go live is intensely straightforward once your files prepare correctly:</p>
            <ol className="list-decimal pl-6 space-y-3 mt-4">
                <li>Verify you are actively authenticated into your User profile.</li>
                <li>Navigate precisely to the <Link to="/manage" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">Publish a Model</Link> portal.</li>
                <li><strong>Naming:</strong> Input a memorable, concise identifier (no spaces or special punctuation). This is exactly what millions of developers will type into terminal: <code>mlnpm install &lt;name&gt;</code>.</li>
                <li><strong>Versioning:</strong> Safely declare your SemVer string starting at <code>1.0.0</code>.</li>
                <li><strong>Documentation:</strong> Enter a vastly descriptive summary! Tell developers what the model accomplishes mathematically, provide structural examples, and define strict parameter constraints.</li>
                <li><strong>Attachment:</strong> Securely drop both your `.onnx` and `wrapper.config.js` models into the designated file reception area.</li>
                <li>Click <strong>Publish Package</strong> to execute the global sync sequence. Do NOT close the website until confirmation is firmly verified by the prompt!</li>
            </ol>
            
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5 mt-8">
                <h3 className="text-amber-500 font-bold mb-2">Troubleshooting Uploads & Limitations</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>If the upload completely halts at 99%, DO NOT refresh. Massive gigabyte packages require processing time locally on your wifi connection.</li>
                    <li>If the identifier is taken, our infrastructure rejects the payload entirely. Please check Explore first!</li>
                    <li>You are strictly prohibited from publishing an identical version number structurally. If you failed to add a wrapper on <code>1.0.0</code>, just instantly re-upload completely on <code>1.0.1</code>!</li>
                </ul>
            </div>
        </div>
    );
}

function WrappersSection() {
    return (
        <div className="space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white mb-4">Writing Wrappers (Courier)</h1>
            <p>
                The <code>wrapper.config.js</code> file is the most critical bridge between an AI Data Scientist and the Web Developer 
                consuming their model. Without it, a developer receiving your model has no understanding of what data to pass in or 
                what shape the output will take. Writing a thorough, accurate wrapper is not optional — it is the difference between 
                your model being genuinely usable and completely inaccessible.
            </p>
            <p>
                This file is uploaded alongside your <code>.onnx</code> file at publish time. When a developer runs <code>mlnpm install</code>, 
                this wrapper is downloaded and injected directly into their project as the executable interface for your model.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10 mb-4">The Core Contract: inputs & outputs</h2>
            <p>
                Every wrapper must export a default object with at minimum two fields: <code>inputs</code> and <code>outputs</code>.
                These are arrays of strings that tell the consuming developer exactly what keys they must provide and exactly what keys 
                they will receive back. They serve as the human-readable API contract for your model.
            </p>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-indigo-300">
{`export default {
    // The exact keys the developer must supply when calling predict or stream
    inputs: ["age", "income", "credit_score"],

    // The exact keys present in the returned result object
    outputs: ["loan_approved", "confidence"],

    // ... at least one of predict or stream must follow
};`}
            </pre>
            <p className="text-sm text-slate-400 mt-3">
                These arrays are metadata only — they do not perform any validation. Their purpose is to document the expected interface 
                clearly so developers are not guessing at what to pass in. Always keep these accurate and up to date with every version bump.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">TypeScript Interface Reference</h2>
            <p className="mb-4 text-sm text-slate-400">
                For authors writing wrappers in TypeScript, or developers consuming models with TypeScript, the following
                interfaces define the exact shape expected by the MLNPM Runtime.
            </p>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-sky-300">
{`// The full structure of a wrapper.config.js when typed
interface WrapperConfig {
    // Human-readable list of keys the developer must supply
    inputs: string[];

    // Human-readable list of keys present in the returned result
    outputs: string[];

    // Optional: single-shot prediction. One call → one result object.
    predict?: (
        sessions: Record<string, OnnxSession>,
        input: Record<string, unknown>
    ) => Promise<Record<string, unknown>>;

    // Optional: streaming generation. One call → async iterable of result chunks.
    stream?: (
        sessions: Record<string, OnnxSession>,
        input: Record<string, unknown>
    ) => AsyncGenerator<Record<string, unknown>, void, unknown>;
}

// The shape every tensor must conform to inside engine.run({})
interface TensorConfig {
    data: number[] | bigint[] | string[] | boolean[];
    shape: number[];      // e.g. [1, 3] for 1 batch of 3 features
    type: "float32" | "int32" | "int64" | "bool" | "string";
}`}
            </pre>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Supported Tensor Types</h2>
            <p className="text-sm text-slate-400 mb-4">
                Every tensor you pass into <code>engine.run()</code> must have a <code>type</code> field matching one of these exact string values:
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-2 pr-6 text-slate-400 font-semibold">Type Value</th>
                            <th className="text-left py-2 pr-6 text-slate-400 font-semibold">JS Data Array</th>
                            <th className="text-left py-2 text-slate-400 font-semibold">Use Case</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        <tr className="border-b border-slate-800">
                            <td className="py-2 pr-6"><code className="text-indigo-400">"float32"</code></td>
                            <td className="py-2 pr-6"><code>number[]</code></td>
                            <td className="py-2">Most regression and classification models. Default choice for continuous numeric data.</td>
                        </tr>
                        <tr className="border-b border-slate-800">
                            <td className="py-2 pr-6"><code className="text-indigo-400">"int32"</code></td>
                            <td className="py-2 pr-6"><code>number[]</code></td>
                            <td className="py-2">Token IDs for NLP models. Class indices. Integer sequences.</td>
                        </tr>
                        <tr className="border-b border-slate-800">
                            <td className="py-2 pr-6"><code className="text-indigo-400">"int64"</code></td>
                            <td className="py-2 pr-6"><code>bigint[]</code></td>
                            <td className="py-2">Large integer IDs, timestamps. Required by some HuggingFace transformer models.</td>
                        </tr>
                        <tr className="border-b border-slate-800">
                            <td className="py-2 pr-6"><code className="text-indigo-400">"bool"</code></td>
                            <td className="py-2 pr-6"><code>boolean[]</code></td>
                            <td className="py-2">Attention masks and binary flags.</td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-6"><code className="text-indigo-400">"string"</code></td>
                            <td className="py-2 pr-6"><code>string[]</code></td>
                            <td className="py-2">Text input for native string-processing ONNX models.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Mode 1: Standard Prediction (predict)</h2>
            <p>
                The <code>predict</code> function is the standard execution model. It takes a structured input object from the 
                developer, performs the complete model inference internally, and returns a structured result object with the final answer.
                Use this for any model that produces a single, deterministic output from a given set of inputs — regression models, 
                classifiers, image recognition networks, encoders, and so on.
            </p>
            <p className="mb-4">
                Inside <code>predict</code>, you receive two arguments automatically provided by the MLNPM Runtime:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm mb-6">
                <li><code>sessions</code> — A map of loaded model engines, keyed by the file name of each <code>.onnx</code> file you uploaded. Most packages have only one model, so you grab the first entry. If your package has multiple models, use their exact file names as keys.</li>
                <li><code>input</code> — The exact object the Web Developer passed into <code>model.predict(&#123;...&#125;)</code>. The keys here should match what you declared in <code>inputs</code>.</li>
            </ul>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-indigo-300">
{`export default {
    inputs: ["age", "income", "credit_score"],
    outputs: ["loan_approved", "confidence"],

    async predict(sessions, input) {
        // Get the first (and usually only) loaded model engine
        const engine = sessions[Object.keys(sessions)[0]];

        // Shape and clean your inputs for the ONNX execution graph
        const data = [
            Number(input.age),
            Number(input.income),
            Number(input.credit_score)
        ];

        // Execute the inference — tensor names must exactly match those in your .onnx file
        const result = await engine.run({
            "input_features": {
                data: data,
                shape: [1, 3],
                type: "float32"
            }
        });

        // Read the raw tensor outputs and return them as clean JavaScript values
        const approved = result.loan_decision.data[0] > 0.5;
        const confidence = result.loan_decision.data[0];

        return { loan_approved: approved, confidence: confidence };
    }
};`}
            </pre>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mt-6">
                <h3 className="text-white font-bold mb-2">Important: Tensor Names</h3>
                <p className="text-sm">
                    The string keys inside <code>engine.run(&#123;&#125;)</code> — such as <code>"input_features"</code> — must match 
                    the input node names baked into your <code>.onnx</code> graph exactly. These are defined at model export time in 
                    PyTorch or TensorFlow. Use tools like <code>Netron</code> (a free model visualizer) to inspect the exact names 
                    of your graph's input and output nodes if you are unsure.
                </p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Mode 2: Real-Time Streaming (stream)</h2>
            <p>
                The <code>stream</code> function is an optional, advanced export for models that produce output iteratively over time 
                rather than in a single response. Classic use cases include Large Language Model token generation, speech-to-text 
                transcription pipelines, or any autoregressive sequence model where you want to display results to the user progressively.
            </p>
            <p className="mb-4">
                Unlike <code>predict</code>, <code>stream</code> is an <strong>AsyncGenerator</strong> — it uses the 
                <code>async *</code> syntax and <code>yield</code> to push individual chunks of output one at a time to the 
                consuming developer's code, which reads them in a <code>for await...of</code> loop.
            </p>
            <p className="mb-4">
                <strong className="text-white">predict is not required when you export stream.</strong> You can export exclusively 
                a <code>stream</code> function if your model is inherently iterative and it would not make sense to call 
                <code>predict</code> on it at all. Both can coexist if your model can operate in either mode.
            </p>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-pink-300">
{`export default {
    inputs: ["prompt"],
    outputs: ["token"],

    // No predict() required — this model is streaming-only
    async *stream(sessions, input) {
        const engine = sessions[Object.keys(sessions)[0]];

        // Encode the user's prompt into token IDs
        let currentSequence = tokenize(input.prompt);

        for (let step = 0; step < 512; step++) {

            // Run one generation step to get the next token
            const output = await engine.run({
                "input_ids": {
                    data: currentSequence,
                    shape: [1, currentSequence.length],
                    type: "int32"
                }
            });

            const nextTokenId = output.logits.data[0];
            const nextToken = detokenize(nextTokenId);

            // Push this single token to the developer immediately — no waiting!
            yield { token: nextToken };

            // Stop when the model signals it is done
            if (nextToken === "<|end|>") break;

            // Append the token to the running sequence for the next step
            currentSequence = [...currentSequence, nextTokenId];
        }
    }
};`}
            </pre>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Mode 3: Supporting Both predict and stream</h2>
            <p>
                Some models can legitimately operate in both modes. For instance, a summarization model could return a full 
                summary at once via <code>predict</code>, or stream the summary token-by-token via <code>stream</code> for 
                a better user experience. In this case, simply export both functions from the same wrapper.
            </p>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-indigo-300">
{`export default {
    inputs: ["article_text"],
    outputs: ["summary"],

    // Full summary in one response
    async predict(sessions, input) {
        const engine = sessions[Object.keys(sessions)[0]];
        const result = await engine.run({
            "text_input": { data: encode(input.article_text), shape: [1, 512], type: "int32" }
        });
        return { summary: decode(result.output_ids.data) };
    },

    // Token-by-token streaming of the same summary
    async *stream(sessions, input) {
        const engine = sessions[Object.keys(sessions)[0]];
        let seq = encode(input.article_text);
        for (let i = 0; i < 256; i++) {
            const out = await engine.run({
                "text_input": { data: seq, shape: [1, seq.length], type: "int32" }
            });
            const tok = decode_one(out.next_token.data[0]);
            yield { summary: tok };
            if (tok === "<|end|>") break;
            seq = [...seq, out.next_token.data[0]];
        }
    }
};`}
            </pre>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Fail-Safe: What Happens Without a Wrapper</h2>
            <p>
                If you publish a model without uploading a <code>wrapper.config.js</code>, the MLNPM CLI detects this when a 
                developer installs your package and automatically generates a protective placeholder file in their project:
            </p>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-slate-400">
{`export default {
    inputs: [],
    outputs: [],
    async predict(sessions, input) {
        throw new Error(
            "This model was published without a wrapper.config.js. " +
            "You must write your own predict() logic to use it."
        );
    }
};`}
            </pre>
            <p className="mt-4 text-sm text-slate-400">
                This placeholder stops completely unguided usage while still allowing an advanced developer to inspect 
                the raw model and manually author their own wrapper if they know the model's tensor layout. The error 
                message is intentional — it points the developer directly at the gap they need to fill.
            </p>
        </div>
    );
}

function CliSection() {
    return (
        <div className="space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white mb-4">The Local CLI Reference</h1>
            <p>
                The <code>@mlnpm/cli</code> system globally manages everything. It actively ensures web developers don't have to manually download, compress, verify, or inject models ever again.
                Once installed globally via <code>npm install -g @mlnpm/cli</code>, the following operations are natively available universally.
            </p>

            <div className="mt-10">
                <code className="text-xl font-bold text-indigo-400 block mb-3">mlnpm install &lt;package-name&gt;[@version]</code>
                <p className="mb-4 text-slate-200">
                    The fundamental acquisition command. It safely resolves the requested version parameters globally over the registry network.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                    <li>It immediately verifies specific package existence and fetches the associated files.</li>
                    <li>It caches the massive models structurally into the isolated <code>~/.mlnpm/cache</code> directory perfectly, massively saving SSD space if you utilize the same model across ten different company apps.</li>
                    <li>It injects a localized wrapper module directly inside your codebase's <code>node_modules/&lt;package-name&gt;</code> natively so TypeScript module resolution immediately identifies it flawlessly!</li>
                    <li>It fundamentally executes structural modifications to your root <code>package.json</code> file securely tracking dependencies.</li>
                </ul>
                <p className="text-sm text-slate-400 mt-4 mb-2">After a successful install, your <code>package.json</code> will contain:</p>
                <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-emerald-300">{`{
  "dependencies": {
    "@mlnpm/runtime": "^1.0.0"
  },
  "mlnpm": {
    "house-price-predictor": "1.2.0"
  },
  "scripts": {
    "postinstall": "mlnpm restore"
  }
}`}</pre>
                <div className="bg-indigo-950/30 p-3 mt-4 text-xs rounded border border-indigo-900/50">
                    <strong>Troubleshooting:</strong> If installation fails halfway on a 5GB model, your internet connection significantly faltered. Simply re-run the command; the MLNPM systems are completely idempotent.
                </div>
            </div>

            <div className="mt-12">
                <code className="text-xl font-bold text-emerald-400 block mb-3">mlnpm restore</code>
                <p className="mb-4 text-slate-200">
                    The command that re-downloads all your MLNPM models on a fresh machine or inside a CI/CD deployment environment.
                </p>
                <p className="text-sm text-slate-300 mb-4">
                    When you deploy your application to Vercel, AWS Amplify, Render, Railway, or any cloud platform, 
                    those environments clone your git repository and run <code>npm install</code> — but your <code>.onnx</code> model 
                    files are not in git (they are too large and live in <code>~/.mlnpm/cache</code> on your machine). 
                    <code>mlnpm restore</code> reads the <code>"mlnpm"</code> section of your <code>package.json</code>, 
                    identifies every model your project depends on, and downloads them fresh into the deployment environment 
                    before your build starts.
                </p>
                <div className="bg-emerald-950/30 p-4 mt-4 text-sm rounded border border-emerald-900/50">
                    <strong className="text-emerald-400 block mb-2">This is set up automatically — you do not need to do anything.</strong>
                    <p className="text-slate-300">
                        Every time you run <code>mlnpm install &lt;package&gt;</code>, the CLI automatically injects the following 
                        into your <code>package.json</code> scripts without any manual steps:
                    </p>
                    <pre className="bg-black/40 mt-3 p-3 rounded text-xs text-emerald-300">{`"scripts": {
    "postinstall": "mlnpm restore"
}`}</pre>
                    <p className="text-slate-400 mt-3 text-xs">
                        If a <code>postinstall</code> script already exists in your project, MLNPM appends itself safely 
                        with <code>&amp;&amp;</code> rather than overwriting your existing script. Your existing hooks are never removed.
                    </p>
                </div>
            </div>


            <div className="mt-12">
                <code className="text-xl font-bold text-amber-400 block mb-3">mlnpm uninstall &lt;package-name&gt;</code>
                <p className="mb-4 text-slate-200">
                    The total structural removal of an execution package.
                </p>
                <p className="text-sm text-slate-300">
                    It physically eliminates the localized code injected inside your exact active project folder. It deeply sanitizes your <code>package.json</code> tracking logs so <code>restore</code> never blindly acquires it again globally. 
                    <strong>Note:</strong> Uninstalling does NOT erase the actual gigabyte models from your core system cache folders! Standard uninstalling is completely instantaneous gracefully.
                </p>
            </div>

            <div className="mt-12">
                <code className="text-xl font-bold text-white block mb-3">mlnpm list</code>
                <p className="mb-4 text-slate-200">
                    Your comprehensive dependency health-check tool.
                </p>
                <p className="text-sm text-slate-300">
                    Executing this scans the current directory and prints an elegant display showing precisely which packages are structurally declared globally in your configuration versus which packages are physically actively present locally. Extremely useful when verifying CI environments seamlessly.
                </p>
            </div>
            
            <div className="mt-12">
                <code className="text-xl font-bold text-sky-400 block mb-3">mlnpm cache list</code>
                <p className="mb-4 text-slate-200">
                    A critical utility for isolated system storage awareness.
                </p>
                <p className="text-sm text-slate-300">
                    Models require extraordinary disk real-estate globally. This command intricately loops through your exact operating system <code>~/.mlnpm/cache/</code> central cache repository seamlessly, detailing exactly what models exist persistently locally and comprehensively calculating precise byte usage limits for you natively.
                </p>
            </div>

            <div className="mt-12">
                <code className="text-xl font-bold text-red-500 block mb-3">mlnpm cache clean [package-name]</code>
                <p className="mb-4 text-slate-200">
                    The nuclear system storage sanitization sequence.
                </p>
                <p className="text-sm text-slate-300">
                    If your SSD drives execute structurally into warning thresholds globally, execute this command. It rigorously forcefully eradicates every single multi-gigabyte mathematical tensor securely off your hard drives fundamentally. 
                    Supplying a specific identifier (like <code>mlnpm cache clean sentiment-model</code>) strictly isolates the destruction natively to that specific entity structurally.
                </p>
                <div className="bg-red-950/30 p-3 mt-4 text-xs rounded border border-red-900/50">
                    <strong>Warning:</strong> Any web projects currently structurally relying on these models globally will aggressively demand massive gigabyte downloads fundamentally upon their next sequence restarts!
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mt-14 mb-4">Environment Variables</h2>
            <p className="mb-6 text-slate-300">
                The MLNPM CLI reads one optional environment variable. Most users will never need to set it — the CLI ships 
                pre-configured to point at the official MLNPM registry automatically.
            </p>

            <div className="mt-4">
                <code className="text-lg font-bold text-yellow-400 block mb-2">MLNPM_REGISTRY</code>
                <p className="text-sm text-slate-300 mb-3">
                    Overrides the registry URL that the CLI connects to. By default, all CLI commands target 
                    the official MLNPM global registry. You only need to set this variable if you are:
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1 mb-4">
                    <li>Running your own private self-hosted MLNPM instance inside a corporate network.</li>
                    <li>A contributor working on MLNPM itself locally and pointing the CLI at a local dev server.</li>
                </ul>
                <p className="text-sm text-slate-400 mb-4">
                    Because the CLI is a global system tool and not a web application, this variable is set in your 
                    operating system shell — not in a <code>.env</code> file. No dotenv library is required.
                </p>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Mac / Linux — add to ~/.bashrc or ~/.zshrc</p>
                    <pre className="text-sm text-yellow-300">{`export MLNPM_REGISTRY=https://your-private-registry.com`}</pre>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-3">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Windows — PowerShell (current session)</p>
                    <pre className="text-sm text-yellow-300">{`$env:MLNPM_REGISTRY = "https://your-private-registry.com"`}</pre>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-3">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Windows — set permanently via System Properties</p>
                    <pre className="text-sm text-slate-400 whitespace-pre-wrap">{`Start → "Edit the system environment variables" → Environment Variables → New
Variable name:  MLNPM_REGISTRY
Variable value: https://your-private-registry.com`}</pre>
                </div>

                <p className="text-sm text-slate-500 mt-4">
                    Once set, every subsequent CLI command — <code>mlnpm install</code>, <code>mlnpm restore</code>, 
                    <code>mlnpm list</code> — will point at your custom registry. No other configuration is required.
                </p>
            </div>
        </div>
    );
}

function RuntimeSection() {
    return (
        <div className="space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white mb-4">The Standard Runtime Engine</h1>
            <p>
                The global CLI fetches the massive bytes locally, however, the <strong>Standard Runtime Engine</strong> (<code>@mlnpm/runtime</code>) is strictly the library that mathematical executes and orchestrates them perfectly inside your structural web applications dynamically.
                It completely isolates the highly-complex internal execution pipelines natively and securely exposes an elegant structural standard to your Javascript ecosystem seamlessly.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Complete Integration Blueprint</h2>
            <p>Once you acquire a model via the CLI globally, it structurally behaves identical perfectly to traditional software library acquisitions:</p>
            
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-pink-300">
{`import CustomerChurnModel from "customer-churn-identifier"; // Seamless resolution natively!

// A standard Next.js / Express Route API handler:
export async function POST(req, res) {
    try {
        // Retrieve standard analytical data seamlessly from your global frontend
        const { current_balance, age, active_member } = req.body;

        // Ensure the mathematical execution bytes cleanly synchronize deeply into active physical server RAM.
        await CustomerChurnModel.init(); 

        // Safely communicate natively directly with the wrapper configuration 'predict' interface flawlessly!
        const result = await CustomerChurnModel.predict({
            balance: current_balance,
            user_age: age,
            is_active: active_member ? 1 : 0
        });

        // The exact securely finalized result beautifully provided gracefully!
        res.status(200).json({ probability: result.churn_probability });
    } catch (error) {
        console.error("Execution completely halted structurally!", error);
        res.status(500).json({ status: "Model execution fundamentally failed safely" });
    }
}`}
            </pre>

            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-6 mt-10">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">The Absolute Magic of init()</h3>
                <p className="mb-4">
                    The <code>init()</code> function is inherently structurally brilliant explicitly designed for global optimization flawlessly. 
                </p>
                <ul className="list-disc pl-5 text-sm space-y-2 text-slate-200">
                    <li>When actively called, it intelligently securely scans your immediate project structural directories natively.</li>
                    <li>If it determines the model is fundamentally completely missing dynamically, it triggers an emergency acquisition precisely mimicking the central network securely.</li>
                    <li>If the model securely exists inside your local physical cache seamlessly, it instantly mounts those massive exact files directly into strict execution memory universally without ever requesting external network bytes dynamically!</li>
                </ul>
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Handling Streaming Outputs Structure</h2>
            <p>
                If the model author fundamentally exported a deeply complex <code>stream()</code> AsyncGenerator successfully, your Javascript integration requires a precise standard <code>for-await-of</code> loop to capture tokens as they organically natively generate synchronously over temporal space seamlessly:
            </p>

            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-indigo-300">
{`import LlamaModel from "llama-generator";

async function generateTextSequence() {
    await LlamaModel.init();

    // Securely invoke the stream natively rather seamlessly!
    const generation_loop = await LlamaModel.stream({ prompt: "Hello World" });

    // Continuously capture outputs gracefully until completion!
    for await (const token_output of generation_loop) {
        process.stdout.write(token_output.generated_text);
    }
}`}
            </pre>

            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold text-amber-500 mb-2">Best Practices</h3>
                <p className="text-sm mb-3">
                    Always wrap <code>init()</code> and <code>predict()</code> calls in <code>try/catch</code> blocks.
                    If the wrapper author declared <code>inputs: ["age"]</code> and your code passes a string instead
                    of a number, the ONNX runtime will throw a typed error — you want to catch and handle that gracefully
                    rather than letting it crash your server.
                </p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-14 mb-4">End-to-End Examples</h2>
            <p className="mb-6 text-slate-400">Complete, real-world usage patterns across common ML model categories.</p>

            <h3 className="text-lg font-semibold text-white mb-3">Tabular Regression (Express.js)</h3>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-pink-300">
{`import express from "express";
import housePriceModel from "house-price-predictor";

const app = express();
app.use(express.json());

app.post("/predict-price", async (req, res) => {
    try {
        await housePriceModel.init();
        const result = await housePriceModel.predict({
            bedrooms: req.body.bedrooms,
            sqft: req.body.sqft,
            location_score: req.body.location_score
        });
        res.json({ price_usd: result.price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000);`}
            </pre>

            <h3 className="text-lg font-semibold text-white mt-8 mb-3">Text Classification (Next.js API Route)</h3>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-indigo-300">
{`// app/api/sentiment/route.ts
import sentimentModel from "sentiment-classifier";

export async function POST(req: Request) {
    const { text } = await req.json();

    await sentimentModel.init();
    const result = await sentimentModel.predict({ text });

    return Response.json({
        label: result.label,          // e.g. "positive"
        confidence: result.confidence  // e.g. 0.94
    });
}`}
            </pre>

            <h3 className="text-lg font-semibold text-white mt-8 mb-3">LLM Text Generation with Streaming (Node.js)</h3>
            <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm overflow-x-auto text-pink-300">
{`import textGenerator from "local-llm";

async function generate(prompt: string) {
    await textGenerator.init();

    // model.stream() returns an AsyncGenerator
    const tokens = textGenerator.stream({ prompt });

    let fullResponse = "";
    for await (const chunk of tokens) {
        process.stdout.write(chunk.token); // stream to terminal in real-time
        fullResponse += chunk.token;
    }

    return fullResponse;
}

generate("Explain machine learning in one paragraph:");`}
            </pre>
        </div>
    );
}
