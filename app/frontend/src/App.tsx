import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getUser, clearAuth, getTokenExpiryMs } from "./utils/api";
import type { User } from "./utils/api";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Explore from "./pages/Explore";
import Package from "./pages/Package";
import Upload from "./pages/Manage";
import Delete from "./pages/Delete";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Docs from "./pages/Docs";

export default function App() {
    const [user, setUser] = useState<User | null>(getUser());

    const handleLogin = () => setUser(getUser());
    const handleLogout = () => {
        clearAuth();
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem("mlnpm_token");
        if (!token) {
            return;
        }

        const expiryMs = getTokenExpiryMs(token);
        if (!expiryMs) {
            const timeoutId = window.setTimeout(() => {
                handleLogout();
            }, 0);
            return () => {
                window.clearTimeout(timeoutId);
            };
        }

        const delayMs = Math.max(expiryMs - Date.now(), 0);
        const timeoutId = window.setTimeout(() => {
            handleLogout();
        }, delayMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [user]);

    return (
        <BrowserRouter>
            <Navbar user={user} onLogout={handleLogout} />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                    path="/register"
                    element={<Register onLogin={handleLogin} />}
                />
                <Route
                    path="/login"
                    element={<Login onLogin={handleLogin} />}
                />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/manage" element={<Upload />} />
                <Route path="/delete" element={<Delete />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/packages/:name" element={<Package />} />
                <Route path="/docs" element={<Docs />} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
