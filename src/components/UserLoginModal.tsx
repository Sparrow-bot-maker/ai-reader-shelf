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
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <User className="w-7 h-7 text-gray-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">登入以同步書架</h2>
                    <p className="text-gray-400 text-sm">使用 Google 帳戶或自訂 ID 登入</p>
                </div>

                <div className="space-y-5">
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap
                            theme="outline"
                            shape="rectangular"
                            width="320"
                        />
                    </div>

                    <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-gray-200" />
                        <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">或</span>
                        <div className="flex-grow border-t border-gray-200" />
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            const baseUrl = window.location.pathname.includes('/ai-reader-shelf') ? '/ai-reader-shelf/login' : '/login';
                            window.location.pathname = baseUrl;
                        }}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <LogIn className="w-4 h-4" />
                        帳號密碼登入 / 註冊
                    </button>
                </div>

                <p className="mt-6 text-center text-[10px] text-gray-400 leading-relaxed">
                    首次使用的 ID 請點擊按鈕後進行「註冊」。
                </p>
            </div>
        </div>
    );
};

export default UserLoginModal;
