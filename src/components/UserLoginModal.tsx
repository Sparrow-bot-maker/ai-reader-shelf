import { useState, useEffect } from 'react';
import { User, X, LogIn } from 'lucide-react';

interface UserLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (userId: string) => void;
}

const UserLoginModal = ({ isOpen, onClose, onLogin }: UserLoginModalProps) => {
    const [userId, setUserId] = useState('');
    const [savedId] = useState<string | null>(localStorage.getItem('userId'));

    useEffect(() => {
        if (savedId) {
            setUserId(savedId);
        }
    }, [savedId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;

        localStorage.setItem('userId', userId.trim());
        onLogin(userId.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                        <User className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">設定 User ID</h2>
                    <p className="text-slate-400 text-sm">輸入你的 ID 以同步書架進度與個人導圖資料</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                            Username / ID
                        </label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="例如: user123"
                            autoFocus
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!userId.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 group"
                    >
                        <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        開始使用
                    </button>
                </form>

                <p className="mt-6 text-center text-[11px] text-slate-500">
                    ID 將儲存於本地瀏覽器，用於過濾 Google Sheets 資料
                </p>
            </div>
        </div>
    );
};

export default UserLoginModal;
