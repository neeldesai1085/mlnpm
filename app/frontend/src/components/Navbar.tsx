import type { User } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";


function Navbar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        onLogout();
        navigate("/");
    };

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
            <Link className="text-2xl font-extrabold tracking-tight text-white" to="/">
                ml<span className="text-indigo-500">npm</span>
            </Link>
            <div className="flex items-center gap-4">
                <Link to="/explore" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Explore</Link>
                {user ? (
                <>
                    <span className="text-sm font-medium text-slate-300">{user.username}</span>
                    <button 
                    className="px-4 py-2 text-sm font-medium text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/10 transition-colors" 
                    onClick={handleLogout}
                    >
                    Logout
                    </button>
                </>
                ) : (
                <>
                    <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Login</Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all">
                    Sign Up
                    </Link>
                </>
                )}
            </div>
        </nav>
    )

}

export default Navbar;