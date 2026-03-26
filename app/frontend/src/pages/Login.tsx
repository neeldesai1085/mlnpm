import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../utils/api";

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const data = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });
            setAuth(data.token, data.user);
            onLogin();
            navigate("/explore");
        } catch (err: unknown) {
            setError((err as Error).message);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto mt-16 px-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                    Welcome Back
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            required
                        />
                    </div>

                    <div className="text-center">
                        <Link
                            to="/forgot"
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            Forgot username or password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-indigo-400 hover:text-indigo-300"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
