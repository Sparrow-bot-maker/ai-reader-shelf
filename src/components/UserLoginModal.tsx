import { X, LogIn, User } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/AuthService';

interface UserLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (userId: string) => void;
}

const UserLoginModal = ({ isOpen, onClose, onLogin }: UserLoginModalProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleSuccess = (credentialResponse: any) => {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const googleId = decoded.email;

        AuthService.saveSession(googleId, googleId);
        onLogin(googleId);
        onClose();
        window.location.reload(); // 重新整理以確保 ShelfPage 重新抓取資料
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
                    <p className="text-slate-400 text-sm">請自定義 ID 登入或使用 Google 帳戶</p>
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

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-widest font-bold">或使用自定義帳號</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => {
                                onClose();
                                // 導航至新的登入頁面
                                const baseUrl = window.location.pathname.includes('/ai-reader-shelf') ? '/ai-reader-shelf/login' : '/login';
                                window.location.pathname = baseUrl;
                            }}
                            className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group"
                        >
                            <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            帳號密碼登入 / 註冊
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-slate-500 leading-relaxed">
                    為了您的資安，現在我們改用密碼登入方式。<br />
                    首次使用的 ID 請點擊按鈕後進行「註冊」。
                </p>
            </div>
        </div>
    );
};

export default UserLoginModal;
