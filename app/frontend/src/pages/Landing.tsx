import CustomToast from "../components/CustomToast";
import { useToastState } from "../hooks/useToastState";
import { Link } from "react-router-dom";

export default function Landing() {
    const command = "mlnpm install package-name";
    const { toast, showToast, setOpen } = useToastState();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(command);
            showToast({
                title: "Copied",
                message: "Install command copied to clipboard.",
                variant: "success",
            });
        } catch {
            showToast({
                title: "Copy failed",
                message: "Please try again.",
                variant: "error",
            });
        }
    };

    return (
        <div className="text-center pt-24 pb-16 px-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                AI models,
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-br from-indigo-500 to-purple-400">
                    one command away.
                </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Install and run complex ML models in your JavaScript apps with
                zero Python configuration. All models run 100% locally.
            </p>

            <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-6 py-4 mb-10 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-400 shadow-inner hover:border-emerald-400/60 hover:text-emerald-300 transition-colors"
                aria-label="Copy install command"
            >
                <span className="text-slate-500">$</span> {command}
            </button>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                    to="/explore"
                    className="px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:-translate-y-0.5 transition-all"
                >
                    Explore Packages
                </Link>
                <Link
                    to="/register"
                    className="px-6 py-3 text-base font-semibold text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/10 transition-all"
                >
                    Get Started
                </Link>
            </div>

            <CustomToast toast={toast} onOpenChange={setOpen} />
        </div>
    );
}
