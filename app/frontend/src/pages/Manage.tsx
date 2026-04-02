import { useEffect, useMemo, useState, useRef } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import CustomToast from "../components/CustomToast";
import { useToastState } from "../hooks/useToastState";
import { api, getUser } from "../utils/api";

type UploadFile = {
    name: string;
    size: number;
    hash?: string;
};

type PackageLookup = {
    exists: boolean;
    owner?: string;
    latestVersion?: string | null;
    loading: boolean;
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

type ParsedVersion = {
    major: number;
    minor: number;
    patch: number;
};

function parseVersion(version: string): ParsedVersion | null {
    const base = version.split("-")[0] ?? version;
    const parts = base.split(".").map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        return null;
    }
    const [major, minor, patch] = parts;
    return { major, minor, patch };
}

function compareVersions(a: string, b: string): number {
    const parsedA = parseVersion(a);
    const parsedB = parseVersion(b);
    if (!parsedA || !parsedB) {
        return 0;
    }
    if (parsedA.major !== parsedB.major) {
        return parsedA.major - parsedB.major;
    }
    if (parsedA.minor !== parsedB.minor) {
        return parsedA.minor - parsedB.minor;
    }
    return parsedA.patch - parsedB.patch;
}

function getLatestVersion(versions: string[]): string | null {
    let latest: string | null = null;
    for (const version of versions) {
        if (!parseVersion(version)) {
            continue;
        }
        if (!latest || compareVersions(version, latest) > 0) {
            latest = version;
        }
    }
    return latest;
}

function isAllowedNextVersion(latest: string, next: string): boolean {
    const parsedLatest = parseVersion(latest);
    const parsedNext = parseVersion(next);
    if (!parsedLatest || !parsedNext) {
        return false;
    }

    if (parsedNext.major === parsedLatest.major + 1) {
        return parsedNext.minor === 0 && parsedNext.patch === 0;
    }

    if (
        parsedNext.major === parsedLatest.major &&
        parsedNext.minor === parsedLatest.minor + 1
    ) {
        return parsedNext.patch === 0;
    }

    return (
        parsedNext.major === parsedLatest.major &&
        parsedNext.minor === parsedLatest.minor &&
        parsedNext.patch === parsedLatest.patch + 1
    );
}

export default function Upload() {
    const navigate = useNavigate();
    const { toast, showToast, setOpen } = useToastState();
    const [isNewPackage, setIsNewPackage] = useState(true);
    const [name, setName] = useState("");
    const [version, setVersion] = useState("");
    const [description, setDescription] = useState("");
    const [documentation, setDocumentation] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [accepted, setAccepted] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [packageLookup, setPackageLookup] = useState<PackageLookup>({
        exists: false,
        latestVersion: null,
        loading: false,
    });

    const activeXhrsRef = useRef<XMLHttpRequest[]>([]);
    const uploadedBytesRef = useRef<Record<string, number>>({});

    const user = useMemo(() => getUser(), []);
    const isBlocking = isSubmitting || isUploading;

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files ?? []);

        const validFiles = selected.filter((file) =>
            file.name.toLowerCase().endsWith(".onnx"),
        );

        if (validFiles.length !== selected.length) {
            showToast({
                title: "Invalid file",
                message: "Only .onnx files are accepted.",
                variant: "error",
            });
        }

        if (validFiles.length > 0) {
            setAccepted((prev) => {
                const newFiles = validFiles.filter(
                    (newFile) =>
                        !prev.some(
                            (prevFile) => prevFile.name === newFile.name,
                        ),
                );

                if (newFiles.length !== validFiles.length) {
                    showToast({
                        title: "Duplicate file",
                        message: "This file has already been added.",
                        variant: "error",
                    });
                }

                return [...prev, ...newFiles];
            });
        }

        event.target.value = "";
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const dropped = Array.from(event.dataTransfer.files ?? []);
        if (dropped.length === 0) {
            return;
        }

        const validFiles = dropped.filter((file) =>
            file.name.toLowerCase().endsWith(".onnx"),
        );

        if (validFiles.length !== dropped.length) {
            showToast({
                title: "Invalid file",
                message: "Only .onnx files are accepted.",
                variant: "error",
            });
        }

        if (validFiles.length > 0) {
            setAccepted((prev) => {
                const newFiles = validFiles.filter(
                    (newFile) =>
                        !prev.some(
                            (prevFile) => prevFile.name === newFile.name,
                        ),
                );

                if (newFiles.length !== validFiles.length) {
                    showToast({
                        title: "Duplicate file",
                        message: "This file has already been added.",
                        variant: "error",
                    });
                }

                return [...prev, ...newFiles];
            });
        }
    };

    const handleRemoveFile = (name: string) => {
        setAccepted((current) => current.filter((file) => file.name !== name));
    };

    const handleCancelUpload = () => {
        if (!isUploading) return;
        activeXhrsRef.current.forEach((xhr) => xhr.abort());
        activeXhrsRef.current = [];
        uploadedBytesRef.current = {};
        setUploadProgress(0);
        setIsUploading(false);
        setIsSubmitting(false);
        setAccepted([]);
        showToast({
            title: "Upload canceled",
            message: "The upload was stopped.",
            variant: "error",
        });
    };

    const uploadFileWithProgress = (
        file: File,
        uploadUrl: string,
        totalBytes: number,
    ) =>
        new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            activeXhrsRef.current.push(xhr);

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;
                uploadedBytesRef.current[file.name] = event.loaded;
                const uploadedBytes = Object.values(
                    uploadedBytesRef.current,
                ).reduce((acc, value) => acc + value, 0);
                const pct = totalBytes
                    ? Math.min(
                          100,
                          Math.round((uploadedBytes / totalBytes) * 100),
                      )
                    : 0;
                setUploadProgress(pct);
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState !== XMLHttpRequest.DONE) return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    return resolve();
                }
                return reject(new Error(`Upload failed for ${file.name}`));
            };

            xhr.onerror = () =>
                reject(new Error(`Upload failed for ${file.name}`));
            xhr.onabort = () =>
                reject(new DOMException("Upload aborted", "AbortError"));

            xhr.open("PUT", uploadUrl);
            xhr.send(file);
        });

    const fileList: UploadFile[] = useMemo(
        () => accepted.map((file) => ({ name: file.name, size: file.size })),
        [accepted],
    );

    useEffect(() => {
        if (isNewPackage) {
            setVersion("1.0.0");
        }
    }, [isNewPackage]);

    useEffect(() => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setPackageLookup({
                exists: false,
                latestVersion: null,
                loading: false,
            });
            return;
        }

        let isActive = true;
        setPackageLookup((prev) => ({ ...prev, loading: true }));

        const timer = window.setTimeout(async () => {
            try {
                const data = (await api(`/packages/${trimmedName}`)) as {
                    package: {
                        owner: string;
                        versions?: { version: string }[];
                    };
                };
                if (!isActive) return;

                const pkg = data.package;
                const latest = getLatestVersion(
                    (pkg.versions ?? []).map((item) => item.version),
                );
                setPackageLookup({
                    exists: true,
                    owner: pkg.owner,
                    latestVersion: latest,
                    loading: false,
                });
            } catch {
                if (!isActive) return;
                setPackageLookup({
                    exists: false,
                    latestVersion: null,
                    loading: false,
                });
            }
        }, 300);

        return () => {
            isActive = false;
            window.clearTimeout(timer);
        };
    }, [name]);

    const handleSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        if (isSubmitting) return;

        if (!user) {
            showToast({
                title: "Login required",
                message: "Please login before uploading.",
                variant: "error",
            });
            navigate("/login");
            return;
        }

        if (!name.trim()) {
            showToast({
                title: "Missing package name",
                message: "Please enter a package name.",
                variant: "error",
            });
            return;
        }

        if (isNewPackage) {
            if (!description.trim()) {
                showToast({
                    title: "Missing description",
                    message: "Description is required for new packages.",
                    variant: "error",
                });
                return;
            }

            if (!documentation.trim()) {
                showToast({
                    title: "Missing documentation",
                    message: "Documentation is required for new packages.",
                    variant: "error",
                });
                return;
            }
        }

        if (!version.trim()) {
            showToast({
                title: "Missing version",
                message: "Please enter a semver version.",
                variant: "error",
            });
            return;
        }

        if (isNewPackage && packageLookup.exists) {
            showToast({
                title: "Package exists",
                message: "That package name is already taken.",
                variant: "error",
            });
            return;
        }

        if (!isNewPackage && !packageLookup.exists) {
            showToast({
                title: "Package not found",
                message: "Use new package mode to create it first.",
                variant: "error",
            });
            return;
        }

        if (
            !isNewPackage &&
            packageLookup.owner &&
            packageLookup.owner !== user?.username
        ) {
            showToast({
                title: "Not your package",
                message: "You can only publish versions you own.",
                variant: "error",
            });
            return;
        }

        const latest = packageLookup.latestVersion ?? null;
        if (!latest) {
            if (version.trim() !== "1.0.0") {
                showToast({
                    title: "Invalid version",
                    message: "First version must be 1.0.0.",
                    variant: "error",
                });
                return;
            }
        } else if (!isAllowedNextVersion(latest, version.trim())) {
            showToast({
                title: "Invalid version",
                message: `Version must increment by 1 from latest ${latest}.`,
                variant: "error",
            });
            return;
        }

        if (accepted.length === 0) {
            showToast({
                title: "Missing files",
                message: "Please select at least one .onnx file.",
                variant: "error",
            });
            return;
        }

        let shouldCleanupVersion = false;
        try {
            setIsSubmitting(true);

            if (isNewPackage) {
                await api("/packages", {
                    method: "POST",
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim(),
                        documentation_md: documentation.trim(),
                    }),
                });
            } else if (description.trim() || documentation.trim()) {
                await api(`/packages/${name.trim()}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        description: description.trim(),
                        documentation_md: documentation.trim(),
                    }),
                });
            }

            const publish = (await api(`/packages/${name.trim()}/versions`, {
                method: "POST",
                body: JSON.stringify({
                    version: version.trim(),
                    files: fileList,
                }),
            })) as { files?: { name: string; upload_url: string }[] };

            shouldCleanupVersion = true;

            const uploadTargets: { name: string; upload_url: string }[] =
                publish.files ?? [];

            const totalBytes = accepted.reduce(
                (acc, file) => acc + file.size,
                0,
            );
            activeXhrsRef.current = [];
            uploadedBytesRef.current = {};
            setUploadProgress(0);
            setIsUploading(true);
            for (const target of uploadTargets) {
                const file = accepted.find((item) => item.name === target.name);
                if (!file) continue;
                try {
                    await uploadFileWithProgress(
                        file,
                        target.upload_url,
                        totalBytes,
                    );
                } catch (err) {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    ) {
                        return;
                    }
                    if (err instanceof TypeError) {
                        throw err;
                    }
                    throw new Error(
                        err instanceof Error
                            ? err.message
                            : "Failed to upload files. Check R2 access and CORS.",
                    );
                }
            }

            setIsUploading(false);
            activeXhrsRef.current = [];
            uploadedBytesRef.current = {};
            setUploadProgress(100);
            showToast({
                title: "Upload complete",
                message: "Your package has been published.",
                variant: "success",
                durationMs: 1200,
            });
            setAccepted([]);
            window.setTimeout(() => {
                navigate(`/packages/${name.trim()}`);
            }, 1300);
        } catch (err: unknown) {
            if (shouldCleanupVersion) {
                try {
                    await api(
                        `/packages/${name.trim()}/versions/${version.trim()}`,
                        { method: "DELETE" },
                    );
                } catch {
                    showToast({
                        title: "Cleanup failed",
                        message:
                            "Version was created but could not be removed.",
                        variant: "error",
                    });
                }
            }
            showToast({
                title: "Upload failed",
                message: err instanceof Error ? err.message : "Upload failed",
                variant: "error",
            });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
            activeXhrsRef.current = [];
            uploadedBytesRef.current = {};
        }
    };

    return (
        <div className="max-w-5xl w-full mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    Publish ONNX Package
                </h1>
                <p className="text-slate-400">
                    Upload one or more ONNX files and add detailed
                    documentation.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid items-stretch lg:grid-cols-[1.2fr_1fr] gap-8"
                aria-busy={isBlocking}
            >
                <div className="space-y-6 h-full">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">
                                Package details
                            </h2>
                            <div className="inline-flex rounded-full bg-slate-950 p-1">
                                <button
                                    type="button"
                                    onClick={() => setIsNewPackage(true)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                                        isNewPackage
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    New package
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsNewPackage(false)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                                        !isNewPackage
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    Existing package
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Package name
                                </label>
                                <input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="e.g. vision-encoder"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    disabled={isBlocking}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Version (semver)
                                </label>
                                <input
                                    value={version}
                                    onChange={(event) =>
                                        setVersion(event.target.value)
                                    }
                                    placeholder="1.0.0"
                                    disabled={isNewPackage}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    readOnly={isBlocking}
                                    required
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    {isNewPackage
                                        ? "First version is locked to 1.0.0."
                                        : packageLookup.loading
                                          ? "Checking latest version..."
                                          : packageLookup.latestVersion
                                            ? `Latest version: ${packageLookup.latestVersion}`
                                            : "No versions yet. First publish must be 1.0.0."}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Short description
                                    {isNewPackage ? "" : " (optional)"}
                                </label>
                                <input
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="One-line summary for Explore"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    disabled={isBlocking}
                                    required={isNewPackage}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Model files
                        </h2>
                        <label
                            className={`group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed bg-slate-950/60 px-6 py-10 text-center cursor-pointer transition-colors ${
                                isDragging
                                    ? "border-indigo-500 bg-slate-950/80"
                                    : "border-slate-700 hover:border-indigo-500/80 hover:bg-slate-950/80"
                            }`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".onnx"
                                multiple
                                onChange={onFileChange}
                                onClick={(event) => {
                                    (event.target as HTMLInputElement).value =
                                        "";
                                }}
                                disabled={isBlocking}
                                className="hidden"
                            />
                            {!isBlocking ? (
                                <>
                                    <span className="text-sm font-semibold text-slate-200">
                                        Drag & drop ONNX files or click to
                                        browse
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Only .onnx files are accepted
                                    </span>
                                </>
                            ) : null}
                        </label>
                        {fileList.length > 0 ? (
                            <div className="mt-4 space-y-2 text-sm text-slate-300">
                                {fileList.map((file) => (
                                    <div
                                        key={file.name}
                                        className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                                    >
                                        <span className="min-w-0 flex-1 truncate">
                                            {file.name}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="text-xs text-slate-500">
                                                {formatBytes(file.size)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveFile(file.name)
                                                }
                                                className="cursor-pointer text-xs font-semibold text-red-300 hover:text-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex h-full flex-col gap-6">
                    <div className="flex flex-1 flex-col">
                        <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-white">
                                    Documentation (Markdown)
                                    {isNewPackage ? "" : " (optional)"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPreview((current) => !current)
                                    }
                                    className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                                >
                                    {showPreview
                                        ? "Hide preview"
                                        : "Show preview"}
                                </button>
                            </div>
                            <textarea
                                value={documentation}
                                onChange={(event) =>
                                    setDocumentation(event.target.value)
                                }
                                placeholder="Write detailed usage notes, model specs, input/output formats, and examples..."
                                className="min-h-60 w-full flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isBlocking}
                                required={isNewPackage}
                            />
                        </div>
                    </div>

                    {!isUploading ? (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Submitting..." : "Publish package"}
                        </button>
                    ) : null}
                </div>
            </form>

            {isUploading ? (
                <div className="fixed inset-0 z-40 cursor-not-allowed bg-slate-950/40 backdrop-blur-sm" />
            ) : null}

            {showPreview ? (
                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-lg font-semibold text-white mb-3">
                        Preview
                    </h2>
                    <div className="text-[0.95rem] leading-relaxed text-slate-200">
                        {documentation.trim() ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {documentation}
                            </ReactMarkdown>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Start typing to preview your markdown.
                            </p>
                        )}
                    </div>
                </div>
            ) : null}

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
                            onClick={handleCancelUpload}
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
            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
