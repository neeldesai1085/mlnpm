import { useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { getUser, clearAuth } from "./utils/api";
import type { User } from "./utils/api";

import Navbar from "./components/Navbar";


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

            </Routes>
        </BrowserRouter>
    )
}