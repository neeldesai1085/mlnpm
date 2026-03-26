import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [success, setSuccess] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const pwdRules = [
        { label: "Min 8 characters", valid: password.length >= 8 },
        { label: "One capital letter", valid: /[A-Z]/.test(password) },
        { label: "One number", valid: /[0-9]/.test(password) },
        {
            label: "One special character",
            valid: /[^A-Za-z0-9]/.test(password),
        },
    ];

    useEffect(() => {
        if (!otpSent || resendCooldown <= 0) {
            return;
        }
        const timer = window.setInterval(() => {
            setResendCooldown((current) => (current <= 1 ? 0 : current - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [otpSent, resendCooldown]);

    const handleResendOtp = async () => {
        if (isSubmitting || resendCooldown > 0) {
            return;
        }

        setError(null);
        setNotice(null);

        try {
            setIsSubmitting(true);
            await api("/auth/resend-password-reset", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setNotice("New OTP sent to your email.");
            setResendCooldown(30);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError(null);
        setNotice(null);

        if (!otpSent) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return setError("Please enter a valid email address.");
            }
        } else if (!otpVerified) {
            if (!otp.trim()) {
                return setError("Please enter the OTP sent to your email.");
            }
        } else {
            if (!pwdRules.every((rule) => rule.valid)) {
                return setError(
                    "Please ensure all password requirements are met.",
                );
            }
        }

        try {
            setIsSubmitting(true);

            if (!otpSent) {
                await api("/auth/request-password-reset", {
                    method: "POST",
                    body: JSON.stringify({ email }),
                });
                setOtpSent(true);
                setNotice("OTP sent to your email.");
                setResendCooldown(30);
            } else if (!otpVerified) {
                await api("/auth/verify-password-reset", {
                    method: "POST",
                    body: JSON.stringify({ email, otp }),
                });
                setOtpVerified(true);
                setNotice("OTP verified. Set a new password.");
            } else {
                await api("/auth/reset-password", {
                    method: "POST",
                    body: JSON.stringify({ email, otp, password }),
                });
                setSuccess(true);
                setNotice("Password updated successfully.");
            }
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const emailMuted = otpSent;
    const otpMuted = otpVerified;

    return (
        <div className="max-w-md w-full mx-auto mt-16 px-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white text-center mb-8">
                    Forgot Username or Password
                </h2>

                {notice && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                        {notice}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className={emailMuted ? "opacity-70" : ""}>
                        <label
                            className={`block text-sm font-medium mb-1.5 ${
                                emailMuted ? "text-slate-500" : "text-slate-400"
                            }`}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={emailMuted}
                            className={`w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white transition-colors ${
                                emailMuted
                                    ? "text-slate-500 placeholder:text-slate-600 border-slate-800"
                                    : "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            }`}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {otpSent && (
                        <div className={otpMuted ? "opacity-70" : ""}>
                            <label
                                className={`block text-sm font-medium mb-1.5 ${
                                    otpMuted
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                }`}
                            >
                                OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                disabled={otpMuted}
                                className={`w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white transition-colors ${
                                    otpMuted
                                        ? "text-slate-500 placeholder:text-slate-600 border-slate-800"
                                        : "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                }`}
                                placeholder="Enter the 6-digit code"
                                required
                            />

                            {!otpVerified && (
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <span className="text-slate-400">
                                        {resendCooldown > 0
                                            ? `Resend available in ${resendCooldown}s`
                                            : "Didn't get a code?"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={
                                            resendCooldown > 0 || isSubmitting
                                        }
                                        className="text-indigo-400 hover:text-indigo-300 cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {otpVerified && !success && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="Min 8 characters"
                                required
                            />

                            <div className="mt-3 space-y-1.5 text-xs font-medium">
                                {pwdRules.map((rule, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 transition-colors duration-300 ${
                                            rule.valid
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {rule.valid ? (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    d="M5 13l4 4L19 7"
                                                ></path>
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    d="M6 18L18 6M6 6l12 12"
                                                ></path>
                                            </svg>
                                        )}
                                        <span>{rule.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!success && (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {!otpSent
                                ? "Send OTP"
                                : !otpVerified
                                  ? "Verify OTP"
                                  : "Change Password"}
                        </button>
                    )}
                </form>

                {success && (
                    <div className="mt-6 text-center text-sm text-slate-400">
                        <Link
                            to="/login"
                            className="text-indigo-400 hover:text-indigo-300"
                        >
                            Go to the login page
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
