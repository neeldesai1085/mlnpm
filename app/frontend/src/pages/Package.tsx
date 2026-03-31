import { useEffect, useState } from "react";
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
    owner: string;
    created_at: string;
    versions: PackageVersion[];
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
                const details = data.package as PackageDetails;
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
        <div className="max-w-4xl mx-auto px-6 py-10">
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

            <div className="inline-flex items-center gap-2 px-6 py-4 mb-12 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-400 w-full sm:w-auto">
                <span className="text-slate-500">$</span> mlnpm install{" "}
                {pkg.name}
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
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-400">
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
                                                <span className="text-sm font-medium text-slate-300">
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

            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
