import { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

type PackageSummary = {
    id: string;
    name: string;
    description: string;
    owner: string;
    access_count: number;
    created_at: string;
    updated_at: string;
};

export default function Explore() {
    const [packages, setPackages] = useState<PackageSummary[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const trimmedSearch = useMemo(() => search.trim(), [search]);

    useEffect(() => {
        let isActive = true;
        setLoading(true);
        setError("");

        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams();
                if (trimmedSearch.length > 0) {
                    params.set("search", trimmedSearch);
                }
                const query = params.toString();
                const data = await api(`/packages${query ? `?${query}` : ""}`);

                if (!isActive) {
                    return;
                }
                setPackages(data.packages ?? []);
            } catch (err) {
                if (!isActive) {
                    return;
                }
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load packages",
                );
                setPackages([]);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [trimmedSearch]);

    const hasResults = packages.length > 0;
    const showEmpty = !loading && !error && !hasResults;

    return (
        <div className="max-w-5xl w-full mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    Explore Packages
                </h1>
                <p className="text-slate-400">
                    Browse ML models available on the mlnpm registry
                </p>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                    Search by package name
                </label>
                <div className="relative">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search for a model..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {error ? (
                <div className="mb-8 rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-red-200">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && hasResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_0_20px_rgba(15,23,42,0.25)]"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-white">
                                    {pkg.name}
                                </h2>
                                <span className="text-xs text-slate-400">
                                    {pkg.access_count.toLocaleString()} views
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">
                                {pkg.description ||
                                    "No description provided yet."}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>by {pkg.owner}</span>
                                <span>
                                    Updated{" "}
                                    {new Date(
                                        pkg.updated_at,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {showEmpty ? (
                <div className="col-span-full py-16 text-center bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
                    <p className="text-xl text-slate-300 font-medium mb-3">
                        {trimmedSearch.length > 0
                            ? "No packages match that search"
                            : "No packages published yet"}
                    </p>
                    <p className="text-slate-500 mb-6">
                        {trimmedSearch.length > 0
                            ? "Try another name or clear the search."
                            : "Be the first! Use the CLI to publish an ONNX model."}
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400">
                        <span className="text-slate-500">$</span> mlnpm publish
                        my-model
                    </div>
                </div>
            ) : null}
        </div>
    );
}
