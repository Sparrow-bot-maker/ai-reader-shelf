// LoginPage – minimalist white theme
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/AuthService';

type Mode = 'login' | 'signup' | 'forgot';

const LoginPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>('login');
    const [loading, setLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    // ── Google OAuth ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleSuccess = (credentialResponse: any) => {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const googleId = decoded.email;
        AuthService.saveSession(googleId, googleId);
        navigate('/want-to-read');
        window.location.reload();
    };

    // ── Send verification code ────────────────────────────────────
    const handleSendCode = async () => {
        if (!email) { setError('請先輸入 Email'); return; }
        setSendLoading(true);
        setError(null);
        try {
            const res = await AuthService.sendCode(email);
            setError(res.success ? '✅ 驗證碼已發送至您的信箱' : res.message || '發送失敗');
        } catch {
            setError('發送失敗，請檢查網路');
        } finally {
            setSendLoading(false);
        }
    };

    // ── Main form submit ──────────────────────────────────────────
    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                const passHash = await AuthService.hashPassword(password);
                const res = await AuthService.login(userId, passHash);
                if (res.success) {
                    AuthService.saveSession(res.userId!, res.email);
                    navigate('/want-to-read');
                } else {
                    setError(res.message || '登入失敗');
                }
            } else if (mode === 'signup') {
                if (password !== confirmPassword) {
                    setError('兩次輸入的密碼不一致');
                    setLoading(false);
                    return;
                }
                const passHash = await AuthService.hashPassword(password);
                const res = await AuthService.signUp(userId, passHash, email);
                if (res.success) {
                    setMode('login');
                    setError('✅ 註冊成功，請登入');
                } else {
                    setError(res.message || '註冊失敗');
                }
            } else if (mode === 'forgot') {
                if (!code) {
                    const res = await AuthService.sendCode(email);
                    setError(res.success ? '✅ 驗證碼已發送' : res.message || '發送失敗');
                } else {
                    const passHash = await AuthService.hashPassword(password);
                    const res = await AuthService.resetPassword(email, code, passHash);
                    if (res.success) {
                        setMode('login');
                        setError('✅ 密碼已重設，請登入');
                    } else {
                        setError(res.message || '重設失敗');
                    }
                }
            }
        } catch {
            setError('系統錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────
    const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password';
    const subtitle = mode === 'login'
        ? 'Sign in to access your AI library'
        : mode === 'signup'
            ? 'Join AI Reader Shelf to start your reading journey'
            : '請輸入您的 Email 以重設密碼';

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 font-['Inter',sans-serif]">
            <div className="w-full max-w-[440px] bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden">

                {/* Card Body */}
                <div className="px-8 pt-10 pb-12 flex flex-col items-center">

                    {/* Icon */}
                    <div className="mb-8 flex items-center justify-center bg-[#1a1a1a] text-white p-3 rounded-xl shadow-sm">
                        <span className="text-2xl">✦</span>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-2">{title}</h1>
                        <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
                    </div>

                    {/* Error / Info Banner */}
                    {error && (
                        <div className={`w-full mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${error.includes('✅')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="w-full space-y-4">

                        {/* Google Sign-In — login only */}
                        {mode === 'login' && (
                            <>
                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google 登入失敗')}
                                        useOneTap
                                        theme="outline"
                                        shape="rectangular"
                                        width="360"
                                    />
                                </div>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-zinc-200" />
                                    <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">OR</span>
                                    <div className="flex-grow border-t border-zinc-200" />
                                </div>
                            </>
                        )}

                        {/* ── Form ── */}
                        <form onSubmit={handleAction} className="space-y-5">

                            {/* User ID — login & signup */}
                            {mode !== 'forgot' && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="使用者 ID"
                                        value={userId}
                                        onChange={e => setUserId(e.target.value)}
                                        required
                                        className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-zinc-200 text-slate-900 placeholder-zinc-400 focus:ring-0 focus:border-[#1a1a1a] transition-all text-sm"
                                    />
                                </div>
                            )}

                            {/* Email — signup & forgot */}
                            {(mode === 'signup' || mode === 'forgot') && (
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="email"
                                        placeholder={mode === 'signup' ? 'Email（可選，用於找回密碼）' : 'Email'}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required={mode === 'forgot'}
                                        className="flex-1 px-0 py-3 bg-transparent border-0 border-b-2 border-zinc-200 text-slate-900 placeholder-zinc-400 focus:ring-0 focus:border-[#1a1a1a] transition-all text-sm"
                                    />
                                    {mode === 'forgot' && (
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={sendLoading}
                                            className="shrink-0 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-lg disabled:opacity-50 transition"
                                        >
                                            {sendLoading ? '發送中...' : '發送驗證碼'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Verification code — forgot */}
                            {mode === 'forgot' && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="驗證碼（收信後輸入）"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-zinc-200 text-slate-900 placeholder-zinc-400 focus:ring-0 focus:border-[#1a1a1a] transition-all text-sm"
                                    />
                                </div>
                            )}

                            {/* Password */}
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder={mode === 'forgot' ? '新密碼' : '密碼'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-zinc-200 text-slate-900 placeholder-zinc-400 focus:ring-0 focus:border-[#1a1a1a] transition-all text-sm"
                                />
                            </div>

                            {/* Confirm Password — signup */}
                            {mode === 'signup' && (
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="確認密碼"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-zinc-200 text-slate-900 placeholder-zinc-400 focus:ring-0 focus:border-[#1a1a1a] transition-all text-sm"
                                    />
                                </div>
                            )}

                            {/* Signup email warning */}
                            {mode === 'signup' && (
                                <p className="text-[10px] text-rose-500 font-medium">
                                    提醒：若不綁定 Email，忘記密碼將永久失去閱讀紀錄。
                                </p>
                            )}

                            {/* Forgot password link — login only */}
                            {mode === 'login' && (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setError(null); }}
                                        className="text-xs text-slate-400 hover:text-[#1a1a1a] underline underline-offset-2 transition-colors"
                                    >
                                        忘記密碼？
                                    </button>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 rounded-lg text-sm font-bold text-white bg-[#1a1a1a] hover:opacity-90 disabled:opacity-50 transition-all mt-2"
                            >
                                {loading
                                    ? '處理中...'
                                    : mode === 'login' ? 'Sign In'
                                        : mode === 'signup' ? '立即註冊'
                                            : '確認重設'
                                }
                            </button>
                        </form>
                    </div>

                    {/* Switch mode links */}
                    <div className="mt-8 text-center space-y-2">
                        {mode !== 'forgot' ? (
                            <p className="text-sm text-slate-500">
                                {mode === 'login' ? "Don't have an account?" : '已有帳號？'}
                                <button
                                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                                    className="font-bold text-[#1a1a1a] hover:underline underline-offset-4 ml-1"
                                >
                                    {mode === 'login' ? 'Sign up' : '返回登入'}
                                </button>
                            </p>
                        ) : (
                            <button
                                onClick={() => { setMode('login'); setError(null); }}
                                className="text-sm text-slate-400 hover:text-[#1a1a1a] transition-colors"
                            >
                                ← 返回登入
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-zinc-50 px-8 py-4 flex justify-center gap-6 border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">AI Reader Shelf</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
