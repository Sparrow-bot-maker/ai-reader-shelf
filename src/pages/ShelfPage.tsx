import React, { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import { Loader2, Plus, Save, X, Mail } from 'lucide-react';
import { AuthService } from '../services/AuthService';

interface Book {
    id: string;
    title: string;
    author: string;
    cover: string;
    category: string;
    status: '想閱讀' | '已閱讀';
}

interface ShelfPageProps {
    status: '想閱讀' | '已閱讀';
}


const ShelfPage: React.FC<ShelfPageProps> = ({ status }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBindModalOpen, setIsBindModalOpen] = useState(false);
    const [bindEmail, setBindEmail] = useState('');
    const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
    const [userId] = useState<string | null>(localStorage.getItem('userId'));

    // 新書表單狀態
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        category: '自學',
        cover: '',
    });

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId') || 'guest';
            const resData = await AuthService.getBooks(userId);
            const raw = resData.data || [];
            const normalized = Array.isArray(raw) ? raw.map((item: any) => ({
                id: item.Book_ID || item.id || String(Math.random()),
                title: item.Title || item.title || '',
                author: item.Author || item.author || '',
                cover: item.Cover_URL || item.cover || '',
                category: item.Category || item.category || '未分類',
                status: item.Status || item.status || '想閱讀',
            })) : [];
            setBooks(normalized);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch books:', err);
            setError('無法取得書籍資料，請檢查 GAS URL 或網路連線。');
        } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchBooks();
    }, [status]);

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBook.title || isSubmitting) return;

        setIsSubmitting(true);
        const userId = localStorage.getItem('userId') || 'guest';
        const bookId = `B-${Date.now()}`;

        try {
            const res = await AuthService.addBook({
                Book_ID: bookId,
                User_ID: userId,
                Title: newBook.title,
                Author: newBook.author || '未知',
                Category: newBook.category,
                Cover_URL: newBook.cover,
                Status: status,
                Chat_History: '[]',
                Mind_Map_Data: '{}'
            });

            if (res.success) {
                await fetchBooks();
                setIsAddModalOpen(false);
                setNewBook({ title: '', author: '', category: '自學', cover: '' });
                alert('書籍已成功加入！');
            } else {
                alert(`儲存失敗：${res.message || res.error || '後端回傳錯誤'}`);
            }
        } catch (err) {
            console.error('Add book error:', err);
            alert('新增書籍失敗，請檢查網路或 GAS 設定');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredByStatus = books.filter(book => book.status === status);
    const categories = Array.from(new Set(filteredByStatus.map(b => b.category)));
    const finalBooks = selectedCategory
        ? filteredByStatus.filter(b => b.category === selectedCategory)
        : filteredByStatus;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-400 animate-pulse">正在載入您的書架...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] glass-card rounded-3xl p-8 text-center max-w-md mx-auto">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">重新整理</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-12 animate-fade-in px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {status === '想閱讀' ? '待讀清單' : '知識寶庫'}
                </h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {userId && !userEmail && (
                        <button
                            onClick={() => setIsBindModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/20 rounded-2xl font-bold transition-all min-h-[48px]"
                        >
                            <Mail className="w-5 h-5" />
                            綁定 Email
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 group min-h-[48px]"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        新增書籍
                    </button>
                </div>
            </div>

            {/* 綁定 Email 彈窗 */}
            {isBindModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsBindModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-xl font-bold text-white mb-2">綁定電子信箱</h2>
                        <p className="text-slate-400 text-sm mb-6">備份您的閱讀紀錄，防止更換裝置時資料遺失。</p>
                        <div className="space-y-4">
                            <input
                                type="email"
                                value={bindEmail}
                                onChange={e => setBindEmail(e.target.value)}
                                placeholder="例如: user@example.com"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                            <button
                                onClick={async () => {
                                    if (!bindEmail || !userId) return;
                                    const res = await AuthService.bindEmail(userId, bindEmail);
                                    if (res.success) {
                                        localStorage.setItem('userEmail', bindEmail);
                                        setUserEmail(bindEmail);
                                        setIsBindModalOpen(false);
                                        alert('綁定成功！');
                                    } else {
                                        alert(res.message);
                                    }
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
                            >
                                確認綁定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center ${!selectedCategory ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'}`}
                    >
                        全部書籍
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {finalBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
                    {finalBooks.map(book => (
                        <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-500 text-sm">此分類目前沒有書籍</p>
                </div>
            )}

            {selectedBook && (
                <BookModal
                    book={selectedBook}
                    onClose={() => setSelectedBook(null)}
                />
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">新增書籍</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddBook} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">書名</label>
                                <input
                                    type="text"
                                    required
                                    value={newBook.title}
                                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                                    placeholder="輸入書名..."
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">作者</label>
                                    <input
                                        type="text"
                                        value={newBook.author}
                                        onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">分類</label>
                                    <select
                                        value={newBook.category}
                                        onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    >
                                        <option value="自學">自學</option>
                                        <option value="工作">工作</option>
                                        <option value="生活">生活</option>
                                        <option value="小說">小說</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">封面圖片 URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBook.cover}
                                        onChange={e => setNewBook({ ...newBook, cover: e.target.value })}
                                        placeholder="https://..."
                                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    {newBook.cover && (
                                        <img src={newBook.cover} className="w-12 h-12 object-cover rounded-lg border border-white/10" alt="Preview" />
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                儲存書籍
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShelfPage;
