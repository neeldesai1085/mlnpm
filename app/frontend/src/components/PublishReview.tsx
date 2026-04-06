import type { ReactNode } from "react";

export type ReviewFile = {
    name: string;
    size: number;
    file_type: "model" | "wrapper";
};

type PublishReviewProps = {
    packageName: string;
    version: string;
    description: string;
    isNewPackage: boolean;
    files: ReviewFile[];
    isSubmitting: boolean;
    isUploading: boolean;
    uploadProgress: number;
    onBack: () => void;
    onPublish: () => void;
    onCancelUpload: () => void;
    children?: ReactNode;
};

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function FileTypeTag({ type }: { type: "model" | "wrapper" }) {
    const isModel = type === "model";
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isModel
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                    : "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25"
            }`}
        >
            <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                    isModel ? "bg-emerald-400" : "bg-violet-400"
                }`}
            />
            {isModel ? "Model" : "Wrapper"}
        </span>
    );
}

export default function PublishReview({
    packageName,
    version,
    description,
    isNewPackage,
    files,
    isSubmitting,
    isUploading,
    uploadProgress,
    onBack,
    onPublish,
    onCancelUpload,
    children,
}: PublishReviewProps) {
    const isBlocking = isSubmitting || isUploading;
    const modelFiles = files.filter((f) => f.file_type === "model");
    const wrapperFiles = files.filter((f) => f.file_type === "wrapper");
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return (
        <div className="max-w-4xl w-full mx-auto px-6 py-10">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isBlocking}
                    className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <svg
                        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back
                </button>
                <div>
                    <h1 className="text-2xl font-extrabold text-white">
                        Review &amp; Publish
                    </h1>
                    <p className="text-sm text-slate-400">
                        Confirm your package details before publishing.
                    </p>
                </div>
            </div>

            {/* Package info card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Package Summary
                </h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                        <span className="text-slate-500">Name</span>
                        <p className="font-medium text-white">{packageName}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Version</span>
                        <p className="font-medium text-white font-mono">
                            {version}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500">Type</span>
                        <p className="font-medium text-slate-200">
                            {isNewPackage ? "New package" : "Existing package"}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500">Total size</span>
                        <p className="font-medium text-slate-200">
                            {formatBytes(totalSize)}
                        </p>
                    </div>
                    {description ? (
                        <div className="col-span-2">
                            <span className="text-slate-500">Description</span>
                            <p className="font-medium text-slate-200">
                                {description}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Files
                    </span>
                    <span className="text-sm font-bold text-white">
                        {files.length}
                    </span>
                </div>
                {modelFiles.length > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">
                            {modelFiles.length} model
                            {modelFiles.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                ) : null}
                {wrapperFiles.length > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-2.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
                        <span className="text-sm font-medium text-violet-300">
                            {wrapperFiles.length} wrapper
                            {wrapperFiles.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                ) : null}
            </div>

            {/* File list */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden mb-8">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-800 bg-slate-950/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>File name</span>
                    <span className="text-right">Size</span>
                    <span className="text-center">Type</span>
                </div>
                <div className="divide-y divide-slate-800/60">
                    {files.map((file, index) => (
                        <div
                            key={file.name}
                            className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-3.5 transition-colors ${
                                index % 2 === 0
                                    ? "bg-transparent"
                                    : "bg-slate-950/20"
                            }`}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-200">
                                    {file.name}
                                </p>
                            </div>
                            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                                {formatBytes(file.size)}
                            </span>
                            <FileTypeTag type={file.file_type} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Publish button */}
            {!isUploading ? (
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="h-5 w-5 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Publishing...
                        </>
                    ) : (
                        <>
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                            </svg>
                            Publish {packageName}@{version}
                        </>
                    )}
                </button>
            ) : null}

            {/* Upload overlay */}
            {isUploading ? (
                <div className="fixed inset-0 z-40 cursor-not-allowed bg-slate-950/40 backdrop-blur-sm" />
            ) : null}

            {/* Upload progress */}
            {isUploading ? (
                <div className="fixed bottom-6 left-1/2 z-50 w-[min(680px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-100">
                                Uploading to Cloudflare R2...
                            </p>
                            <p className="text-xs text-slate-400">
                                Please keep this tab open.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancelUpload}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                        >
                            Cancel upload
                        </button>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800">
                        <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                        {uploadProgress}% complete
                    </p>
                </div>
            ) : null}

            {/* Toast slot */}
            {children}
        </div>
    );
}
