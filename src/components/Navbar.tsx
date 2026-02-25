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
        <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg hidden sm:block">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
                        AI Reader<span className="text-blue-500">Shelf</span>
                    </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-8 overflow-x-auto no-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all duration-300 hover:text-blue-400 min-h-[44px] px-1 ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400'
                                }`}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">{item.label}</span>
                            {location.pathname === item.path && (
                                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        ID: <span className="text-slate-200 font-mono">{userId ? (userId.length > 8 ? `${userId.substring(0, 5)}...` : userId) : 'NONE'}</span>
                    </div>

                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="p-2 sm:p-3 rounded-full hover:bg-white/5 transition-colors text-slate-400 hover:text-blue-400 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="User profile"
                    >
                        <User className="w-5 h-5" />
                        <span className="absolute bottom-2 right-2 w-2 h-2 bg-blue-500 border-2 border-[#0f172a] rounded-full" />
                    </button>

                    {userId && (
                        <button
                            onClick={handleLogout}
                            className="p-2 sm:p-3 rounded-full hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Logout"
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
