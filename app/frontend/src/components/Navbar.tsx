import { useEffect, useState } from "react";
import * as Avatar from "@radix-ui/react-avatar";
import { Menu, X } from "lucide-react";
import { getToken } from "../utils/api";
import type { User } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

function Navbar({
    user,
    onLogout,
}: {
    user: User | null;
    onLogout: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate("/");
        setMenuOpen(false);
        setAvatarOpen(false);
    };

    useEffect(() => {
        if (user && !getToken()) {
            handleLogout();
        }
    }, [user]);

    return (
        <>
            {menuOpen ? (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                />
            ) : null}
            <nav
                className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md"
                onClick={() => {
                    if (menuOpen) {
                        setMenuOpen(false);
                    }
                    if (avatarOpen) {
                        setAvatarOpen(false);
                    }
                }}
            >
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link
                        className="text-2xl font-extrabold tracking-tight text-white"
                        to="/"
                        onClick={() => setMenuOpen(false)}
                    >
                        ml<span className="text-indigo-500">npm</span>
                    </Link>
                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            to="/explore"
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Explore
                        </Link>
                        {user ? (
                            <>
                                <div
                                    className="relative ml-4"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-950 p-0.5"
                                        aria-label="Open user menu"
                                        aria-expanded={avatarOpen}
                                        onClick={() =>
                                            setAvatarOpen((open) => !open)
                                        }
                                    >
                                        <Avatar.Root className="h-7 w-7 overflow-hidden rounded-full">
                                            <Avatar.Image
                                                src="/avatar.png"
                                                alt="User avatar"
                                                className="h-full w-full object-cover"
                                            />
                                            <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] font-semibold text-slate-200">
                                                User
                                            </Avatar.Fallback>
                                        </Avatar.Root>
                                    </button>
                                    {avatarOpen ? (
                                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-xl">
                                            <Link
                                                to="/profile"
                                                className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                onClick={() =>
                                                    setAvatarOpen(false)
                                                }
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                to="/upload"
                                                className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                onClick={() =>
                                                    setAvatarOpen(false)
                                                }
                                            >
                                                Upload a Model
                                            </Link>
                                            <Link
                                                to="/delete"
                                                className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                onClick={() =>
                                                    setAvatarOpen(false)
                                                }
                                            >
                                                Delete a Model
                                            </Link>
                                            <button
                                                type="button"
                                                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10"
                                                onClick={handleLogout}
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 transition-colors hover:bg-slate-900 md:hidden"
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpen((open) => !open);
                        }}
                    >
                        {menuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
                {menuOpen ? (
                    <div
                        className="border-t border-slate-800 px-4 py-4 sm:px-6 md:hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/explore"
                                className="text-sm font-medium text-slate-300"
                                onClick={() => setMenuOpen(false)}
                            >
                                Explore
                            </Link>
                            {user ? (
                                <>
                                    <Link
                                        to="/upload"
                                        className="text-sm font-medium text-slate-300"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Upload Model
                                    </Link>
                                    <Link
                                        to="/delete"
                                        className="text-sm font-medium text-slate-300"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Delete a Model
                                    </Link>
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-3"
                                            onClick={() =>
                                                setAvatarOpen((open) => !open)
                                            }
                                        >
                                            <Avatar.Root className="h-7 w-7 overflow-hidden rounded-full border border-slate-700">
                                                <Avatar.Image
                                                    src="/avatar.png"
                                                    alt="User avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                                <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] font-semibold text-slate-200">
                                                    U
                                                </Avatar.Fallback>
                                            </Avatar.Root>
                                            <span className="text-sm font-medium text-slate-200">
                                                Account
                                            </span>
                                        </button>
                                        {avatarOpen ? (
                                            <div className="mt-3 flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950 p-2">
                                                <Link
                                                    to="/profile"
                                                    className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                    onClick={() => {
                                                        setAvatarOpen(false);
                                                        setMenuOpen(false);
                                                    }}
                                                >
                                                    Profile
                                                </Link>
                                                <Link
                                                    to="/upload"
                                                    className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                    onClick={() => {
                                                        setAvatarOpen(false);
                                                        setMenuOpen(false);
                                                    }}
                                                >
                                                    Upload a Model
                                                </Link>
                                                <Link
                                                    to="/delete"
                                                    className="rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                                                    onClick={() => {
                                                        setAvatarOpen(false);
                                                        setMenuOpen(false);
                                                    }}
                                                >
                                                    Delete a Model
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10"
                                                    onClick={handleLogout}
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-sm font-medium text-slate-300"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </nav>
        </>
    );
}

export default Navbar;
