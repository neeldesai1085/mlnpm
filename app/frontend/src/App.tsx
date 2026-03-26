import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getUser, clearAuth } from "./utils/api";
import type { User } from "./utils/api";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Register from "./pages/Register";


export default function App() {
    const [user, setUser] = useState<User | null>(getUser());

    const handleLogin = () => setUser(getUser());
    const handleLogout = () => { 
        clearAuth(); setUser(null); 
    };

    return (
        <BrowserRouter>
            <Navbar user = {user} onLogout={handleLogout}/>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/register" element={<Register onLogin={handleLogin} />} />
            </Routes>
        </BrowserRouter>
    )
}