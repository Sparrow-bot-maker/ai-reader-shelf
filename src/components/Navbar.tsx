import { Link, useLocation } from 'react-router-dom';
import { Library, BookCheck, Sparkles, User, LogOut } from 'lucide-react';
import UserLoginModal from './UserLoginModal';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/want-to-read', label: '想閱讀', icon: Library },
        { path: '/already-read', label: '已閱讀', icon: BookCheck },
    ];

    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));

    useEffect(() => {
        if (!userId) {
            setIsLoginOpen(true);
        }
    }, [userId]);

    const handleLogin = (id: string) => {
        setUserId(id);
    };

    const handleLogout = () => {
        localStorage.removeItem('userId');
        setUserId(null);
        setIsLoginOpen(true);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">AI Reader<span className="text-blue-500">Shelf</span></span>
                </div>

                <div className="flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:text-blue-400 ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {location.pathname === item.path && (
                                <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        ID: <span className="text-slate-200 font-mono">{userId || 'NONE'}</span>
                    </div>
                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400 hover:text-blue-400 relative group"
                    >
                        <User className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-[#1e293b] rounded-full" />
                    </button>
                    {userId && (
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-full hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-400"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <UserLoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
            />
        </nav>
    );
};

export default Navbar;
