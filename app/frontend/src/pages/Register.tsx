import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../utils/api";

function Register({ onLogin }: { onLogin: () => void }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();

    const pwdRules = [
        { label: "Min 8 characters", valid: password.length >= 8 },
        { label: "One capital letter", valid: /[A-Z]/.test(password) },
        { label: "One number", valid: /[0-9]/.test(password) },
        { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) }
    ];

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!/^[a-z0-9_-]+$/.test(username)) {
            return setError("Username can only contain lowercase letters, numbers, underscores, and dashes.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return setError("Please enter a valid email address.");
        }

        if (!pwdRules.every(rule => rule.valid)) {
            return setError("Please ensure all password requirements are met.");
        }

        try {
            const data = await api("/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password })
            });
            setAuth(data.token, data.user);
            onLogin();
            navigate("/explore");
        } 
        catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto mt-16 px-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white text-center mb-8">Create Account</h2>
                
                {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                    {error}
                </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                    <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g. johndoe"
                    required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                    <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="you@example.com"
                    required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                    <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="Min 8 characters"
                    required 
                    />
                    
                    <div className="mt-3 space-y-1.5 text-xs font-medium">
                        {pwdRules.map((rule, idx) => (
                            <div key={idx} className={`flex items-center gap-2 transition-colors duration-300 ${rule.valid ? 'text-green-500' : 'text-red-500'}`}>
                                {rule.valid ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                )}
                                <span>{rule.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all mt-6"
                >
                    Register
                </button>
                </form>
                
                <p className="text-center text-sm text-slate-400 mt-6">
                    Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;