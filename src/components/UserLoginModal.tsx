import { useState, useEffect } from 'react';
import { User, X, LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleSuccess = (credentialResponse: any) => {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const googleId = decoded.email; // 或者使用 decoded.sub (唯一標識碼)

        localStorage.setItem('userId', googleId);
        onLogin(googleId);
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
                    <h2 className="text-2xl font-bold text-white mb-2">登入以同步書架</h2>
                    <p className="text-slate-400 text-sm">使用 Google 帳戶或自定義 ID 以保存進度</p>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                            width="320"
                        />
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <span className="relative px-4 bg-[#1e293b] text-xs text-slate-500 uppercase tracking-widest font-bold">
                            或使用自定 ID
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="例如: user123"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!userId.trim()}
                            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transition-colors group"
                        >
                            <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            開始使用
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-[10px] text-slate-500">
                    使用 Google 登入後，Email 將作為您的唯一標識碼
                </p>
            </div>
        </div>
    );
};

export default UserLoginModal;
