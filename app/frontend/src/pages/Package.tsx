import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "react-router-dom";
import CustomToast from "../components/CustomToast";
import { useToastState } from "../hooks/useToastState";
import { api } from "../utils/api";

type PackageVersion = {
    id: string;
    version: string;
    onnx_file_size: number;
    created_at: string;
    is_yanked: boolean;
};

type PackageDetails = {
    name: string;
    description?: string;
    documentation_md?: string;
    owner: string;
    created_at: string;
    versions: PackageVersion[];
};

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="mt-5 mb-3 text-2xl font-bold text-white">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="mt-5 mb-3 text-xl font-bold text-white">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-4 mb-2 text-lg font-semibold text-white">
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="mt-4 mb-2 text-base font-semibold text-white">
            {children}
        </h4>
    ),
    p: ({ children }) => (
        <p className="my-2 text-sm text-slate-200">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="my-2 list-disc pl-5 text-sm text-slate-200">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="my-2 list-decimal pl-5 text-sm text-slate-200">
            {children}
        </ol>
    ),
    code: ({ className, children, ...props }) => {
        const isInline = !className;

        return (
            <code
                className={
                    isInline
                        ? "rounded-md bg-slate-950/80 px-1.5 py-0.5 font-mono text-[0.85rem] text-slate-100"
                        : "text-slate-100"
                }
                {...props}
            >
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
            {children}
        </pre>
    ),
    a: ({ children, href }) => (
        <a className="text-indigo-300 underline" href={href}>
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-3 border-l-2 border-indigo-500 pl-3 text-sm text-slate-400">
            {children}
        </blockquote>
    ),
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-200">
                {children}
            </table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border border-slate-800 px-3 py-2 text-sm text-slate-200">
            {children}
        </td>
    ),
};

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function Package() {
    const { name } = useParams<{ name: string }>();
    const [pkg, setPkg] = useState<PackageDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast, showToast, setOpen } = useToastState();
    const installCommand = useMemo(() => `mlnpm install ${name ?? ""}`, [name]);

    useEffect(() => {
        if (!name) {
            showToast({
                title: "Missing package",
                message: "No package name was provided in the route.",
                variant: "error",
            });
            return;
        }

        let isActive = true;
        queueMicrotask(() => {
            if (isActive) {
                setLoading(true);
            }
        });

        api(`/packages/${name}?view=1`)
            .then((data) => {
                if (!isActive) {
                    return;
                }
                const payload = data as { package: PackageDetails };
                const details = payload.package;
                setPkg(details);
                if (!details?.versions?.length) {
                    showToast({
                        title: "No versions yet",
                        message: "This package has no published versions.",
                        variant: "info",
                    });
                }
            })
            .catch((err: unknown) => {
                if (!isActive) {
                    return;
                }
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load package";
                showToast({
                    title: "Package load failed",
                    message,
                    variant: "error",
                });
                setPkg(null);
            })
            .finally(() => {
                if (isActive) {
                    setLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [name, showToast]);

    if (loading && !pkg) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!pkg) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-10">
                <CustomToast toast={toast} onOpenChange={setOpen} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl w-full mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold font-mono text-indigo-400 mb-3">
                    {pkg.name}
                </h1>
                <p className="text-lg text-slate-300">
                    {pkg.description || "No description provided."}
                </p>
                <div className="text-sm text-slate-500 mt-4">
                    Published by{" "}
                    <strong className="text-slate-300">{pkg.owner}</strong> ·
                    Created {new Date(pkg.created_at).toLocaleDateString()}
                </div>
            </div>

            <button
                type="button"
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(installCommand);
                        showToast({
                            title: "Copied",
                            message: "Install command copied to clipboard.",
                            variant: "success",
                        });
                    } catch {
                        showToast({
                            title: "Copy failed",
                            message: "Please try again.",
                            variant: "error",
                        });
                    }
                }}
                className="inline-flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-6 py-4 font-mono text-emerald-400 cursor-pointer sm:w-auto"
            >
                <span className="text-slate-500">$</span> mlnpm install{" "}
                {pkg.name}
            </button>

            <div className="mt-6 mb-12 w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                    Documentation
                </h2>
                <div className="max-w-none text-[0.95rem] leading-relaxed text-slate-200">
                    {pkg.documentation_md ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {pkg.documentation_md}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-sm text-slate-500">
                            No documentation provided yet.
                        </p>
                    )}
                </div>
            </div>

            {pkg.versions.length > 0 ? (
                <>
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Versions
                    </h2>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Version
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Published
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {pkg.versions.map((version) => (
                                    <tr
                                        key={version.id}
                                        className="hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-indigo-500/10 text-indigo-400">
                                                {version.version}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-cyan-500/10 text-cyan-300">
                                                {formatBytes(
                                                    version.onnx_file_size,
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-400">
                                            {new Date(
                                                version.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            {version.is_yanked ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-red-500/10 text-red-500">
                                                    Yanked
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-400">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}

            <div className="mt-10">
                <h2 className="text-xl font-bold text-white mb-4">Usage</h2>
                <pre
                    className="overflow-x-auto rounded-2xl border border-slate-800 p-6 text-[0.85rem] leading-relaxed font-mono"
                    style={{ background: "#011627" }}
                >
                    <code>
                        <span style={{ color: "#c792ea", fontStyle: "italic" }}>import</span>
                        <span style={{ color: "#d6deeb" }}> model </span>
                        <span style={{ color: "#c792ea", fontStyle: "italic" }}>from</span>
                        <span style={{ color: "#d6deeb" }}> </span>
                        <span style={{ color: "#ecc48d" }}>{`"${pkg.name}"`}</span>
                        <span style={{ color: "#89ddff" }}>;</span>
                        {"\n\n"}

                        <span style={{ color: "#637777", fontStyle: "italic" }}>{"// Downloads the model on first run, then loads from cache"}</span>
                        {"\n"}

                        <span style={{ color: "#c792ea", fontStyle: "italic" }}>await</span>
                        <span style={{ color: "#d6deeb" }}> model</span>
                        <span style={{ color: "#89ddff" }}>.</span>
                        <span style={{ color: "#82aaff" }}>init</span>
                        <span style={{ color: "#d6deeb" }}>()</span>
                        <span style={{ color: "#89ddff" }}>;</span>
                        {"\n\n"}

                        <span style={{ color: "#637777", fontStyle: "italic" }}>{"// Run inference with plain JS objects"}</span>
                        {"\n"}

                        <span style={{ color: "#c792ea", fontStyle: "italic" }}>const</span>
                        <span style={{ color: "#d6deeb" }}> result </span>
                        <span style={{ color: "#89ddff" }}>=</span>
                        <span style={{ color: "#d6deeb" }}> </span>
                        <span style={{ color: "#c792ea", fontStyle: "italic" }}>await</span>
                        <span style={{ color: "#d6deeb" }}> model</span>
                        <span style={{ color: "#89ddff" }}>.</span>
                        <span style={{ color: "#82aaff" }}>predict</span>
                        <span style={{ color: "#89ddff" }}>{"({"}</span>
                        {"\n"}

                        <span style={{ color: "#d6deeb" }}>{"  "}</span>
                        <span style={{ color: "#637777", fontStyle: "italic" }}>{"// ... your input data"}</span>
                        {"\n"}

                        <span style={{ color: "#89ddff" }}>{"})"}</span>
                        <span style={{ color: "#89ddff" }}>;</span>
                        {"\n\n"}

                        <span style={{ color: "#d6deeb" }}>console</span>
                        <span style={{ color: "#89ddff" }}>.</span>
                        <span style={{ color: "#82aaff" }}>log</span>
                        <span style={{ color: "#d6deeb" }}>(result)</span>
                        <span style={{ color: "#89ddff" }}>;</span>
                    </code>
                </pre>
            </div>

            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
