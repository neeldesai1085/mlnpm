import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import CustomToast from "../components/CustomToast";
import { useToastState } from "../hooks/useToastState";
import { api, getUser } from "../utils/api";

export default function Delete() {
    const navigate = useNavigate();
    const { toast, showToast, setOpen } = useToastState();
    const [packageToDelete, setPackageToDelete] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [rollbackPackage, setRollbackPackage] = useState("");
    const [rollbackVersion, setRollbackVersion] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [rollbackLatest, setRollbackLatest] = useState<string | null>(null);
    const [rollbackLookupLoading, setRollbackLookupLoading] = useState(false);

    useEffect(() => {
        const trimmedName = rollbackPackage.trim();
        if (!trimmedName) {
            setRollbackLatest(null);
            setRollbackLookupLoading(false);
            return;
        }

        const parseVersion = (version: string) => {
            const base = version.split("-")[0] ?? version;
            const parts = base.split(".").map((part) => Number(part));
            if (
                parts.length !== 3 ||
                parts.some((part) => Number.isNaN(part))
            ) {
                return null;
            }
            const [major, minor, patch] = parts;
            return { major, minor, patch };
        };

        const compareVersions = (a: string, b: string): number => {
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
        };

        const getLatestVersion = (
            versions: { version: string; is_yanked?: boolean }[],
        ): string | null => {
            let latest: string | null = null;
            for (const item of versions) {
                if (item.is_yanked) {
                    continue;
                }
                const version = item.version;
                if (!parseVersion(version)) {
                    continue;
                }
                if (!latest || compareVersions(version, latest) > 0) {
                    latest = version;
                }
            }
            return latest;
        };

        let isActive = true;
        setRollbackLookupLoading(true);

        const timer = window.setTimeout(async () => {
            try {
                const data = (await api(`/packages/${trimmedName}`)) as {
                    package: {
                        versions?: { version: string; is_yanked?: boolean }[];
                    };
                };
                if (!isActive) return;

                const latest = getLatestVersion(data.package.versions ?? []);
                setRollbackLatest(latest);
            } catch {
                if (!isActive) return;
                setRollbackLatest(null);
            } finally {
                if (isActive) {
                    setRollbackLookupLoading(false);
                }
            }
        }, 300);

        return () => {
            isActive = false;
            window.clearTimeout(timer);
        };
    }, [rollbackPackage]);

    const handleDelete = async (event: SubmitEvent) => {
        event.preventDefault();
        if (isDeleting) return;

        const user = getUser();
        if (!user) {
            showToast({
                title: "Login required",
                message: "Please login before deleting a model.",
                variant: "error",
            });
            navigate("/login");
            return;
        }

        if (!packageToDelete.trim()) {
            showToast({
                title: "Missing package name",
                message: "Enter the model name to delete.",
                variant: "error",
            });
            return;
        }

        if (!confirmDelete) {
            showToast({
                title: "Confirm deletion",
                message: "Please confirm before deleting the model.",
                variant: "error",
            });
            return;
        }

        try {
            setIsDeleting(true);
            await api(`/packages/${packageToDelete.trim()}`, {
                method: "DELETE",
            });
            showToast({
                title: "Model yanked",
                message: "All versions were marked inactive.",
                variant: "success",
                durationMs: 1200,
            });
            const targetName = packageToDelete.trim();
            setPackageToDelete("");
            setConfirmDelete(false);
            window.setTimeout(() => {
                navigate(`/packages/${targetName}`);
            }, 1300);
        } catch (err) {
            showToast({
                title: "Delete failed",
                message: err instanceof Error ? err.message : "Delete failed",
                variant: "error",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRollback = async (event: SubmitEvent) => {
        event.preventDefault();
        if (isRollingBack) return;

        const user = getUser();
        if (!user) {
            showToast({
                title: "Login required",
                message: "Please login before rolling back a version.",
                variant: "error",
            });
            navigate("/login");
            return;
        }

        if (!rollbackPackage.trim() || !rollbackVersion.trim()) {
            showToast({
                title: "Missing details",
                message: "Enter both package name and version.",
                variant: "error",
            });
            return;
        }

        try {
            setIsRollingBack(true);
            await api(
                `/packages/${rollbackPackage.trim()}/versions/${rollbackVersion.trim()}/rollback`,
                {
                    method: "POST",
                },
            );
            showToast({
                title: "Version rolled back",
                message: "The version is now inactive.",
                variant: "success",
                durationMs: 1200,
            });
            const targetName = rollbackPackage.trim();
            setRollbackPackage("");
            setRollbackVersion("");
            window.setTimeout(() => {
                navigate(`/packages/${targetName}`);
            }, 1300);
        } catch (err) {
            showToast({
                title: "Rollback failed",
                message: err instanceof Error ? err.message : "Rollback failed",
                variant: "error",
            });
        } finally {
            setIsRollingBack(false);
        }
    };

    return (
        <div className="max-w-5xl w-full mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    Delete & Rollback
                </h1>
                <p className="text-slate-400">
                    Manage critical actions for your published models.
                </p>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-2">
                <form
                    onSubmit={handleDelete}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-2">
                        Yank a Model
                    </h2>
                    <p className="text-sm text-slate-400 mb-5">
                        Mark all versions as inactive without deleting data.
                    </p>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Package name
                    </label>
                    <input
                        value={packageToDelete}
                        onChange={(event) =>
                            setPackageToDelete(event.target.value)
                        }
                        placeholder="e.g. vision-encoder"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                        required
                    />
                    <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={confirmDelete}
                            onChange={(event) =>
                                setConfirmDelete(event.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-red-500 focus:ring-red-500"
                        />
                        I understand this cannot be undone.
                    </label>
                    <button
                        type="submit"
                        disabled={isDeleting}
                        className="mt-6 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                    >
                        {isDeleting ? "Yanking..." : "Yank Model"}
                    </button>
                </form>

                <form
                    onSubmit={handleRollback}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-2">
                        Rollback a Version
                    </h2>
                    <p className="text-sm text-slate-400 mb-5">
                        Mark a version as inactive without deleting the model.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Package name
                            </label>
                            <input
                                value={rollbackPackage}
                                onChange={(event) =>
                                    setRollbackPackage(event.target.value)
                                }
                                placeholder="e.g. vision-encoder"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Version
                            </label>
                            <input
                                value={rollbackVersion}
                                onChange={(event) =>
                                    setRollbackVersion(event.target.value)
                                }
                                placeholder="1.2.3"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                {rollbackLookupLoading
                                    ? "Checking latest version..."
                                    : rollbackLatest
                                      ? `Latest active version: ${rollbackLatest}`
                                      : "No active versions found."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isRollingBack}
                        className="mt-6 w-full rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-60"
                    >
                        {isRollingBack ? "Rolling back..." : "Rollback Version"}
                    </button>
                </form>
            </div>

            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
