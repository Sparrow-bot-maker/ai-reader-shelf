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

    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        category: '自學',
        cover: '',
    });

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const uid = localStorage.getItem('userId') || 'guest';
            const resData = await AuthService.getBooks(uid);
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

    useEffect(() => { fetchBooks(); }, [status]);

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBook.title || isSubmitting) return;
        setIsSubmitting(true);
        const uid = localStorage.getItem('userId') || 'guest';
        const bookId = `B-${Date.now()}`;
        try {
            const res = await AuthService.addBook({
                Book_ID: bookId,
                User_ID: uid,
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
            } else {
                alert(`儲存失敗：${res.message || res.error || '後端回傳錯誤'}`);
            }
        } catch (err) {
            console.error('Add book error:', err);
            alert('新增書籍失敗，請檢查網路或 GAS 設定');
        } finally { setIsSubmitting(false); }
    };

    const filteredByStatus = books.filter(b => b.status === status);
    const categories = Array.from(new Set(filteredByStatus.map(b => b.category)));
    const finalBooks = selectedCategory
        ? filteredByStatus.filter(b => b.category === selectedCategory)
        : filteredByStatus;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">正在載入您的書架...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-md mx-auto">
                <p className="text-red-500 mb-4 text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition">重新整理</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in px-2 sm:px-0">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    {status === '想閱讀' ? '待讀清單' : '知識寶庫'}
                </h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {userId && !userEmail && (
                        <button
                            onClick={() => setIsBindModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold transition-all text-sm shadow-sm"
                        >
                            <Mail className="w-4 h-4" />
                            綁定 Email
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        新增書籍
                    </button>
                </div>
            </div>

            {/* Bind Email Modal */}
            {isBindModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsBindModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">綁定電子信箱</h2>
                        <p className="text-gray-400 text-sm mb-6">備份您的閱讀紀錄，防止更換裝置時資料遺失。</p>
                        <div className="space-y-4">
                            <input
                                type="email"
                                value={bindEmail}
                                onChange={e => setBindEmail(e.target.value)}
                                placeholder="例如: user@example.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
                                    } else { alert(res.message); }
                                }}
                                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                            >
                                確認綁定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 border-b border-gray-100 pb-4">
                {[{ label: '全部書籍', value: null }, ...categories.map(c => ({ label: c, value: c }))].map(({ label, value }) => (
                    <button
                        key={label}
                        onClick={() => setSelectedCategory(value)}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${selectedCategory === value
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Book grid */}
            {finalBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                    {finalBooks.map(book => (
                        <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
                    ))}
                    {/* Add placeholder */}
                    <div
                        onClick={() => setIsAddModalOpen(true)}
                        className="group cursor-pointer border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center aspect-[3/4] hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                        <Plus className="w-8 h-8 text-gray-300 group-hover:text-gray-500 mb-2 transition-colors" />
                        <p className="text-gray-400 font-medium text-sm group-hover:text-gray-600 transition-colors">新增書籍</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-gray-400 text-sm mb-4">此分類目前沒有書籍</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition">
                        新增第一本書
                    </button>
                </div>
            )}

            {/* Book Modal */}
            {selectedBook && (
                <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
            )}

            {/* Add Book Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">新增書籍</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddBook} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">書名 *</label>
                                <input
                                    type="text"
                                    required
                                    value={newBook.title}
                                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                                    placeholder="輸入書名..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">作者</label>
                                    <input
                                        type="text"
                                        value={newBook.author}
                                        onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">分類</label>
                                    <select
                                        value={newBook.category}
                                        onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none"
                                    >
                                        <option value="自學">自學</option>
                                        <option value="工作">工作</option>
                                        <option value="生活">生活</option>
                                        <option value="小說">小說</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">封面圖片 URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newBook.cover}
                                        onChange={e => setNewBook({ ...newBook, cover: e.target.value })}
                                        placeholder="https://..."
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    {newBook.cover && (
                                        <img src={newBook.cover} className="w-12 h-12 object-cover rounded-lg border border-gray-200" alt="Preview" />
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all text-sm"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                儲存書籍
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="pb-12 text-center">
                <p className="text-gray-300 text-xs">你已到達書架底部</p>
            </div>
        </div>
    );
};

export default ShelfPage;
