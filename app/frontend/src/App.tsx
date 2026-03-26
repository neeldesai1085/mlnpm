import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "./utils/api";
import type { User } from "./utils/api";


export default function App() {
    const [user, setUser] = useState<User | null>(getUser());

    const handleLogin = () => setUser(getUser());
    const handleLogout = () => { 
        clearAuth(); setUser(null); 
    };

    return (
        <BrowserRouter>
            <Routes>
                
            </Routes>
        </BrowserRouter>
    )
}