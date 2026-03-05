import { Link, useLocation } from 'react-router-dom';
import { Search, LogOut, BookOpen } from 'lucide-react';
import UserLoginModal from './UserLoginModal';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const location = useLocation();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));

    useEffect(() => {
        if (!userId && location.pathname !== '/login') {
            setIsLoginOpen(true);
        }
    }, [userId, location.pathname]);

    const handleLogin = (id: string) => setUserId(id);

    const handleLogout = () => {
        localStorage.removeItem('userId');
        setUserId(null);
        setIsLoginOpen(true);
    };

    return (
        <>
            <header className="flex items-center justify-between border-b border-[#EDEDED] bg-white px-4 md:px-8 py-3 dark:bg-slate-900 dark:border-slate-800 z-50 sticky top-0">
                <div className="flex items-center gap-4 md:gap-8">
                    <Link to="/want-to-read" className="flex items-center gap-2 md:gap-3 cursor-pointer">
                        <BookOpen className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
                        <h2 className="text-[#1A1A1A] dark:text-white text-base md:text-lg font-bold tracking-tight hidden sm:block">AI Read Shelf</h2>
                    </Link>
                    <nav className="flex items-center gap-3 md:gap-6">
                        <Link to="/want-to-read" className={`text-sm font-medium transition-colors ${location.pathname === '/want-to-read' ? 'text-[#1A1A1A] border-b-2 border-black pb-1' : 'text-slate-500 hover:text-[#1A1A1A] pb-1'}`}>想閱讀</Link>
                        <Link to="/already-read" className={`text-sm font-medium transition-colors ${location.pathname === '/already-read' ? 'text-[#1A1A1A] border-b-2 border-black pb-1' : 'text-slate-500 hover:text-[#1A1A1A] pb-1'}`}>已閱讀</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative hidden md:flex items-center">
                        <Search className="absolute left-3 text-slate-400 w-4 h-4" />
                        <input className="pl-10 pr-4 py-1.5 bg-slate-50 border border-[#EDEDED] rounded-lg text-sm w-48 lg:w-64 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all" placeholder="Search your shelf..." type="text" />
                    </div>
                    {userId ? (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-[#EDEDED] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all">
                                <span className="font-bold text-slate-600 text-xs">{userId.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsLoginOpen(true)} className="px-3 py-1.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg">Login</button>
                    )}
                </div>
            </header>
            <UserLoginModal
                isOpen={isLoginOpen && !userId}
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
            />
        </>
    );
};

export default Navbar;
