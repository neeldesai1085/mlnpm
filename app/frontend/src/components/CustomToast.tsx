import * as Toast from "@radix-ui/react-toast";
import type { ToastState } from "../hooks/useToastState";

type CustomToastProps = {
    toast: ToastState;
    onOpenChange: (open: boolean) => void;
};

export default function CustomToast({ toast, onOpenChange }: CustomToastProps) {
    return (
        <Toast.Root
            open={toast.open}
            onOpenChange={onOpenChange}
            duration={toast.durationMs}
            className="group w-[320px] rounded-2xl border border-slate-800 bg-slate-950/95 p-4 text-left text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur data-[state=open]:animate-[toast-in_200ms_ease-out] data-[state=closed]:animate-[toast-out_200ms_ease-in]"
        >
            <Toast.Title className="text-sm font-semibold">
                {toast.title}
            </Toast.Title>
            <Toast.Description className="mt-1 text-sm text-slate-300">
                {toast.message}
            </Toast.Description>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                    key={toast.progressKey}
                    className={`toast-progress h-full w-full ${
                        toast.variant === "success"
                            ? "bg-emerald-400"
                            : toast.variant === "error"
                              ? "bg-rose-400"
                              : "bg-indigo-400"
                    }`}
                    style={{ animationDuration: `${toast.durationMs}ms` }}
                />
            </div>
        </Toast.Root>
    );
}
