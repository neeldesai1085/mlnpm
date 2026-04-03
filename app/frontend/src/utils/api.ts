const API_BASE = "/api";

export interface User {
    id: string;
    username: string;
}

export function getTokenExpiryMs(token: string): number | null {
    const parts = token.split(".");
    if (parts.length !== 3) {
        return null;
    }
    try {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = payloadBase64.padEnd(
            payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
            "=",
        );
        const payload = JSON.parse(atob(padded)) as { exp?: number };
        if (!payload.exp) {
            return null;
        }
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) {
        return true;
    }
    return expiryMs <= Date.now();
}

export function getToken() {
    const token = localStorage.getItem("mlnpm_token");
    if (!token) {
        return null;
    }
    if (isTokenExpired(token)) {
        clearAuth();
        return null;
    }
    return token;
}

export function setAuth(token: string, user: User) {
    localStorage.setItem("mlnpm_token", token);
    localStorage.setItem("mlnpm_user", JSON.stringify(user));
}

export function getUser(): User | null {
    if (!getToken()) {
        return null;
    }
    const raw = localStorage.getItem("mlnpm_user");
    if (!raw) {
        clearAuth();
        return null;
    }
    try {
        return JSON.parse(raw) as User;
    } catch {
        clearAuth();
        return null;
    }
}

export function clearAuth() {
    localStorage.removeItem("mlnpm_token");
    localStorage.removeItem("mlnpm_user");
    localStorage.removeItem("mlnpm_avatar_url");
}

export async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
        throw new Error("Network error. Please check the backend connection.");
    }

    let data: unknown = null;
    try {
        data = await res.json();
    } catch {
        if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
        }
        return null;
    }

    if (!res.ok) {
        const message =
            typeof (data as { error?: unknown })?.error === "string"
                ? (data as { error: string }).error
                : `Request failed (${res.status})`;
        throw new Error(message);
    }

    return data;
}
