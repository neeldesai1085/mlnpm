import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    404
                </p>
                <h1 className="mt-4 text-3xl font-extrabold text-white">
                    Page not found
                </h1>
                <p className="mt-3 text-slate-400">
                    The page you are looking for does not exist or was moved.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
                    >
                        Go home
                    </Link>
                    <Link
                        to="/explore"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600"
                    >
                        Explore packages
                    </Link>
                </div>
            </div>
        </div>
    );
}
