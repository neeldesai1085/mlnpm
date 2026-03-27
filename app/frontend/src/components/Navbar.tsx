import { useState } from "react";
import { Menu, X } from "lucide-react";
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
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate("/");
        setMenuOpen(false);
    };

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
                                <span className="text-sm font-medium text-slate-300">
                                    {user.username}
                                </span>
                                <button
                                    className="px-4 py-2 text-sm font-medium text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/10 transition-colors"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
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
                                    <span className="text-sm font-medium text-slate-400">
                                        Signed in as {user.username}
                                    </span>
                                    <button
                                        className="inline-flex items-center justify-center rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-300"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
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
