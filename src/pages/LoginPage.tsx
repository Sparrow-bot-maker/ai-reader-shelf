import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ChevronRight, AlertCircle, RefreshCcw } from 'lucide-react';
import { AuthService } from '../services/AuthService';

const LoginPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [loading, setLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError(null);
    };

    const handleSendCode = async () => {
        if (!email) {
            setError('請先輸入 Email');
            return;
        }
        setSendLoading(true);
        setError(null);
        try {
            const res = await AuthService.sendCode(email);
            if (res.success) {
                setError('✅ 驗證碼已發送至您的信箱');
            } else {
                setError(res.message || '發送失敗');
            }
        } catch (err) {
            setError('發送失敗，請檢查網路');
        } finally {
            setSendLoading(false);
        }
    };

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
                    setError('註冊成功，請登入');
                } else {
                    setError(res.message || '註冊失敗');
                }
            } else if (mode === 'forgot') {
                if (!code) {
                    // 第一步：發送驗證碼
                    const res = await AuthService.sendCode(email);
                    if (res.success) {
                        setError('驗證碼已發送');
                    } else {
                        setError(res.message || '發送失敗');
                    }
                } else {
                    // 第二步：重設密碼
                    const passHash = await AuthService.hashPassword(password);
                    const res = await AuthService.resetPassword(email, code, passHash);
                    if (res.success) {
                        setMode('login');
                        setError('密碼已重設，請登入');
                    } else {
                        setError(res.message || '重設失敗');
                    }
                }
            }
        } catch (err) {
            setError('系統錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {mode === 'login' ? '歡迎回來' : mode === 'signup' ? '建立帳號' : '找回密碼'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' ? '登入以同步您的閱讀進度' : mode === 'signup' ? '加入 AI Reader Shelf 開始導讀之旅' : '請輸入註冊時綁定的 Email'}
                    </p>
                </div>

                {error && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in direction-alternate ${error.includes('成功') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleAction} className="space-y-4">
                    {mode !== 'forgot' && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="使用者 ID"
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                required
                            />
                        </div>
                    )}

                    {(mode === 'signup' || mode === 'forgot') && (
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                placeholder="Email (可選，用於找回密碼)"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-24 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                required={mode === 'forgot'}
                            />
                            {mode === 'forgot' && (
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={sendLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
                                >
                                    {sendLoading ? '發送中' : '發送'}
                                </button>
                            )}
                        </div>
                    )}

                    {mode === 'forgot' && (
                        <div className="relative">
                            <RefreshCcw className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="驗證碼 (收信後輸入)"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            placeholder={mode === 'forgot' ? '新密碼' : '密碼'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            required
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                placeholder="確認密碼"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                required
                            />
                        </div>
                    )}

                    {mode === 'signup' && (
                        <p className="text-[10px] text-rose-400 font-medium px-2">
                            提醒：若不綁定 Email，忘記密碼將永久失去閱讀紀錄。
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group mt-2"
                    >
                        {loading ? '處理中...' : mode === 'login' ? '登入' : mode === 'signup' ? '立即註冊' : '確認重設'}
                        <ChevronRight className={`w-5 h-5 transition-transform ${loading ? '' : 'group-hover:translate-x-1'}`} />
                    </button>
                </form>

                <div className="mt-8 flex flex-col gap-4 items-center">
                    <button
                        onClick={toggleMode}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        {mode === 'login' ? '還沒有帳號？ 按此註冊' : '已有帳號？ 返回登入'}
                    </button>
                    {mode === 'login' && (
                        <button
                            onClick={() => setMode('forgot')}
                            className="text-blue-400/80 hover:text-blue-400 text-xs transition-colors"
                        >
                            忘記密碼？
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
