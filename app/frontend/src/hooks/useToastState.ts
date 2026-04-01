import { useCallback, useEffect, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastPayload = {
    title?: string;
    message: string;
    variant?: ToastVariant;
    durationMs?: number;
};

type ToastState = {
    open: boolean;
    title: string;
    message: string;
    variant: ToastVariant;
    durationMs: number;
    progressKey: number;
};

const DEFAULT_DURATION_MS = 2200;

export function useToastState(defaultDurationMs = DEFAULT_DURATION_MS) {
    const [toast, setToast] = useState<ToastState>({
        open: false,
        title: "Notice",
        message: "",
        variant: "info",
        durationMs: defaultDurationMs,
        progressKey: 0,
    });
    const openTimerRef = useRef<number | null>(null);

    const showToast = useCallback(
        ({ title, message, variant, durationMs }: ToastPayload) => {
            const resolvedVariant = variant ?? "info";
            const resolvedTitle =
                title ??
                (resolvedVariant === "success"
                    ? "Success"
                    : resolvedVariant === "error"
                      ? "Error"
                      : "Notice");
            const resolvedDuration = durationMs ?? defaultDurationMs;

            setToast((current) => ({
                ...current,
                open: true,
                title: resolvedTitle,
                message,
                variant: resolvedVariant,
                durationMs: resolvedDuration,
                progressKey: Date.now(),
            }));

            if (openTimerRef.current) {
                window.clearTimeout(openTimerRef.current);
                openTimerRef.current = null;
            }
        },
        [defaultDurationMs],
    );

    useEffect(() => {
        return () => {
            if (openTimerRef.current) {
                window.clearTimeout(openTimerRef.current);
            }
        };
    }, []);

    const setOpen = useCallback((open: boolean) => {
        setToast((current) => ({ ...current, open }));
    }, []);

    return { toast, showToast, setOpen };
}

export type { ToastState, ToastPayload, ToastVariant };
