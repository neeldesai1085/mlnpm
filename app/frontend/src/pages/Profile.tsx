import { useEffect, useMemo, useState } from "react";
import * as Avatar from "@radix-ui/react-avatar";
import { useNavigate, Link } from "react-router-dom";
import CustomToast from "../components/CustomToast";
import { useToastState } from "../hooks/useToastState";
import { api, getUser } from "../utils/api";

type ProfilePayload = {
    id: string;
    username: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    packages_count: number;
};

type CloudinarySignature = {
    cloudName: string;
    apiKey: string;
    timestamp: string;
    signature: string;
    folder: string;
};

export default function Profile() {
    const navigate = useNavigate();
    const { toast, showToast, setOpen } = useToastState();
    const user = useMemo(() => getUser(), []);

    const [profile, setProfile] = useState<ProfilePayload | null>(null);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        let isActive = true;
        const updateAvatarStorage = (url: string | null) => {
            if (url) {
                localStorage.setItem("mlnpm_avatar_url", url);
            } else {
                localStorage.removeItem("mlnpm_avatar_url");
            }
            window.dispatchEvent(new Event("avatar-updated"));
        };
        const loadProfile = async () => {
            try {
                const data = (await api("/auth/me")) as {
                    user: ProfilePayload;
                };
                if (!isActive) return;
                setProfile(data.user);
                setFullName(data.user.full_name || "");
                const url = data.user.avatar_url ?? null;
                setAvatarUrl(url);
                updateAvatarStorage(url);
            } catch (err) {
                if (!isActive) return;
                showToast({
                    title: "Failed to load profile",
                    message: err instanceof Error ? err.message : "Try again.",
                    variant: "error",
                });
            }
        };

        void loadProfile();
        return () => {
            isActive = false;
        };
    }, [navigate, showToast, user]);

    const handleAvatarChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast({
                title: "Invalid file",
                message: "Please upload an image file.",
                variant: "error",
            });
            return;
        }

        try {
            setIsUploading(true);
            const signature = (await api(
                "/auth/cloudinary-signature",
            )) as CloudinarySignature;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", signature.apiKey);
            formData.append("timestamp", signature.timestamp);
            formData.append("signature", signature.signature);
            formData.append("folder", signature.folder);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                },
            );

            if (!uploadRes.ok) {
                throw new Error("Avatar upload failed");
            }

            const uploaded = (await uploadRes.json()) as {
                secure_url?: string;
            };
            if (!uploaded.secure_url) {
                throw new Error("Avatar upload failed");
            }

            setAvatarUrl(uploaded.secure_url);
            showToast({
                title: "Avatar uploaded",
                message: "Save your profile to apply changes.",
                variant: "success",
            });
        } catch (err) {
            showToast({
                title: "Upload failed",
                message: err instanceof Error ? err.message : "Upload failed",
                variant: "error",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!fullName.trim()) {
            showToast({
                title: "Full name required",
                message: "Please enter your full name.",
                variant: "error",
            });
            return;
        }

        try {
            setIsSaving(true);
            const data = (await api("/auth/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl,
                }),
            })) as { user: ProfilePayload };
            setProfile(data.user);
            const url = data.user.avatar_url ?? null;
            if (url) {
                localStorage.setItem("mlnpm_avatar_url", url);
            } else {
                localStorage.removeItem("mlnpm_avatar_url");
            }
            window.dispatchEvent(new Event("avatar-updated"));
            showToast({
                title: "Profile updated",
                message: "Your profile was saved successfully.",
                variant: "success",
            });
            navigate("/explore");
        } catch (err) {
            showToast({
                title: "Update failed",
                message: err instanceof Error ? err.message : "Update failed",
                variant: "error",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl w-full mx-auto px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    Profile
                </h1>
                <p className="text-slate-400">
                    Update your avatar and personal details.
                </p>
            </div>

            <form
                onSubmit={handleSave}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar.Root className="h-20 w-20 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
                            <Avatar.Image
                                src={avatarUrl ?? "/avatar.png"}
                                alt="Profile avatar"
                                className="h-full w-full object-cover"
                            />
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-semibold text-slate-200">
                                {profile?.username?.slice(0, 1).toUpperCase() ??
                                    "U"}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div>
                            <p className="text-lg font-semibold text-white">
                                {profile?.username ?? "Account"}
                            </p>
                            <p className="text-sm text-slate-400">
                                {profile
                                    ? `${profile.packages_count} package${
                                          profile.packages_count === 1
                                              ? ""
                                              : "s"
                                      } uploaded`
                                    : "Loading packages..."}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer">
                            {isUploading ? "Uploading..." : "Upload photo"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                                disabled={isUploading}
                            />
                        </label>
                        <p className="mt-2 text-xs text-slate-500">
                            PNG or JPG, up to 5MB.
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Full name
                        </label>
                        <input
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            placeholder="Your full name"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Email
                        </label>
                        <input
                            value={profile?.email ?? ""}
                            readOnly
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-500"
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                    To change your password, please click here:{" "}
                    <Link
                        to="/forgot"
                        className="text-indigo-300 hover:text-indigo-200"
                    >
                        Forgot password
                    </Link>{" "}
                    option.
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                        to="/explore"
                        className="text-sm font-semibold text-slate-300 hover:text-white"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="cursor-pointer rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {isSaving ? "Saving..." : "Save profile"}
                    </button>
                </div>
            </form>

            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
