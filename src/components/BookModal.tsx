import { useState, useRef, useEffect } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { ReactFlow, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { AuthService } from '../services/AuthService';

interface Book {
    id: string;
    title: string;
    author: string;
    cover: string;
    category: string;
    status: '想閱讀' | '已閱讀';
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface BookModalProps {
    book: Book;
    onClose: () => void;
}

const NODE_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

const BookModal = ({ book, onClose }: BookModalProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: `你好！我是你的 AI 讀書助理。關於《${book.title}》，你想深入了解哪些內容呢？討論過程中，我會幫你把重點整理成思維導圖。` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const nodeCountRef = useRef(0);
    const [currentStatus, setCurrentStatus] = useState(book.status);
    const [userId] = useState<string | null>(localStorage.getItem('userId'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nodes, setNodes] = useState<any[]>([
        {
            id: 'root',
            position: { x: 260, y: 20 },
            data: { label: book.title },
            className: 'map-node central-node min-w-[140px] text-center bg-black text-white font-bold border-black shadow-lg rounded-[8px] px-5 py-3',
        },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [edges, setEdges] = useState<any[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const uid = localStorage.getItem('userId') || 'guest';
                const resData = await AuthService.getBooks(uid);
                const allBooks = resData.data || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentBook = allBooks.find((b: any) =>
                    b.Book_ID === book.id || (b.Title === book.title && b.User_ID === uid)
                );
                if (currentBook) {
                    if (currentBook.Chat_History && currentBook.Chat_History !== '[]') {
                        setMessages(JSON.parse(currentBook.Chat_History));
                    }
                    if (currentBook.Mind_Map_Data && currentBook.Mind_Map_Data !== '{}') {
                        const savedMap = JSON.parse(currentBook.Mind_Map_Data);
                        setNodes(savedMap.nodes);
                        setEdges(savedMap.edges);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const maxId = savedMap.nodes.reduce((max: number, node: any) => {
                            const m = node.id.match(/node-(\d+)/);
                            return m ? Math.max(max, parseInt(m[1])) : max;
                        }, 0);
                        nodeCountRef.current = maxId;
                    }
                }
            } catch (err) { console.error('Failed to restore history', err); }
        };
        fetchHistory();
    }, [book.id]);

    const addKeywordNodes = (keywords: string[]) => {
        if (!keywords.length) return;
        const rootNode = nodes.find(n => n.id === 'root');
        const parentPos = rootNode ? rootNode.position : { x: 260, y: 20 };
        const newNodes = keywords.map((kw, i) => {
            nodeCountRef.current += 1;
            const nId = `node-${nodeCountRef.current}`;
            const color = NODE_COLORS[nodeCountRef.current % NODE_COLORS.length];
            const offsetIndex = i - (keywords.length - 1) / 2;
            return {
                id: nId,
                position: { x: parentPos.x + offsetIndex * 200, y: parentPos.y + 150 },
                data: { label: kw },
                style: { border: `1px solid ${color}` },
                className: 'map-node min-w-[120px] text-center bg-white rounded-[8px] px-5 py-3 text-[#1A1A1A] text-sm shadow-sm',
            };
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newEdges = newNodes.map((n) => ({
            id: `e-root-${n.id}`,
            source: 'root',
            target: n.id,
            animated: true,
            style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNodes((prev: any[]) => [...prev, ...newNodes]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEdges((prev: any[]) => [...prev, ...newEdges]);
        if (window.innerWidth < 1024) setActiveTab('map');
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg: Message = { role: 'user', content: input };
        const currentInput = input;
        setInput('');
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        try {
            const GAS_URL = import.meta.env.VITE_GAS_URL;
            if (!GAS_URL) throw new Error('找不到 GAS_URL 設定');
            const systemPrompt = `你是一個專業的讀書助理，正在幫使用者討論《${book.title}》。請以 JSON 格式回覆：1. "text": 對話回覆 2. "keywords": 提取 2-4 個核心概念字眼陣列。只回傳 JSON。`;
            let fullPrompt = systemPrompt + '\n\n';
            if (messages.length > 1) {
                fullPrompt += '[歷史對話]\n';
                messages.slice(1).forEach(m => { fullPrompt += `${m.role === 'assistant' ? 'AI' : '用戶'}: ${m.content}\n`; });
            }
            fullPrompt += `\n用戶: ${currentInput}\n請回答:`;
            const res = await axios.post(GAS_URL, JSON.stringify({ action: 'chat', prompt: fullPrompt }), {
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const rawText: string = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let parsed: { text: string; keywords: string[] } = { text: rawText, keywords: [] };
            try { parsed = JSON.parse(cleaned); } catch { parsed = { text: cleaned, keywords: [] }; }
            setMessages(prev => [...prev, { role: 'assistant', content: parsed.text }]);
            if (parsed.keywords?.length) addKeywordNodes(parsed.keywords);
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (err as any)?.response?.data?.error?.message || (err as any)?.message || String(err);
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ 錯誤：${detail}` }]);
        } finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await AuthService.updateBook({
                Book_ID: book.id,
                Title: book.title,
                User_ID: localStorage.getItem('userId') || 'guest',
                Chat_History: JSON.stringify(messages),
                Mind_Map_Data: JSON.stringify({ nodes, edges }),
            });
        } finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('確定刪除這本書嗎？無法復原！')) return;
        try {
            await AuthService.deleteBook(book.id);
            onClose();
            window.location.reload();
        } catch { alert('刪除失敗'); }
    };

    const handleToggleStatus = async () => {
        const newStatus = currentStatus === '想閱讀' ? '已閱讀' : '想閱讀';
        try {
            await AuthService.updateBook({
                Book_ID: book.id,
                Status: newStatus,
                Title: book.title,
                User_ID: localStorage.getItem('userId') || 'guest'
            });
            setCurrentStatus(newStatus);
        } catch { console.error('Toggle status error'); }
    };

    const handleClose = () => { handleSave(); onClose(); };

    return (
        /* Overlay: bg-[#F3F4F6] tint over full screen + fixed modal centering */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 bg-black/20 backdrop-blur-sm shadow-2xl">
            <div className="absolute inset-0" onClick={handleClose} />

            {/* Modal Card — EXACT STRUCTURE FROM STITCH */}
            <div className="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-xl flex overflow-hidden border border-[#EDEDED] animate-fade-in">

                {/* Close button (floating top right) */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all text-[#64748B] hover:text-[#1A1A1A]"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* ── Left Sidebar ── */}
                <aside className="w-80 bg-[#F8FAF9] flex flex-col p-8 border-r border-[#EDEDED] shrink-0 hidden md:flex">
                    {/* Cover */}
                    <div className="aspect-[2/3] w-full rounded-lg shadow-lg border border-[#EDEDED] overflow-hidden mb-10 bg-white p-1">
                        <img
                            src={book.cover || `https://placehold.co/240x360/f1f5f9/64748b?text=${encodeURIComponent(book.title)}`}
                            alt={book.title}
                            className="w-full h-full object-cover rounded shadow-inner"
                            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/240x360/f1f5f9/64748b?text=${encodeURIComponent(book.title)}`; }}
                        />
                    </div>

                    {/* Book Info */}
                    <h1 className="serif-title text-3xl text-[#1A1A1A] leading-tight mb-2 font-serif">{book.title}</h1>
                    <p className="text-[#64748B] font-medium mb-10">{book.author}</p>

                    {/* Reading Status */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold mb-4">Reading Status</p>
                            <div className="flex bg-white p-1 rounded-xl border border-[#EDEDED]">
                                <button
                                    onClick={() => currentStatus !== '已閱讀' && handleToggleStatus()}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${currentStatus === '已閱讀' ? 'bg-black text-white shadow-md' : 'text-[#64748B] hover:text-[#1A1A1A]'}`}
                                >
                                    已閱讀
                                </button>
                                <button
                                    onClick={() => currentStatus !== '想閱讀' && handleToggleStatus()}
                                    className={`flex-1 py-2 text-xs font-semibold transition-all ${currentStatus === '想閱讀' ? 'bg-black text-white shadow-md rounded-lg' : 'text-[#64748B] hover:text-[#1A1A1A]'}`}
                                >
                                    想閱讀
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer User Info */}
                    <div className="mt-auto flex flex-col gap-3">
                        <div className="flex bg-[#F8FAF9] p-1 rounded-xl">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 flex justify-center py-2.5 text-xs font-semibold bg-white border border-[#EDEDED] shadow-sm rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                儲存進度
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 flex justify-center py-2.5 text-xs font-semibold text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                刪除
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[#EDEDED] shadow-sm">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-[#64748B]">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold truncate text-[#1A1A1A]">{userId ? userId : 'Guest'}</p>
                                <p className="text-[10px] text-[#64748B] truncate uppercase tracking-tighter">AI Reader</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Main content (Tabs: Chat / Map) ── */}
                <section className="flex-1 flex flex-col bg-white overflow-hidden min-w-0 relative">

                    {/* Tab Navigation */}
                    <div className="px-8 pt-8 flex gap-8 border-b border-[#EDEDED] bg-white">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`pb-4 text-sm transition-all border-b-2 ${activeTab === 'chat' ? 'font-semibold border-black text-[#1A1A1A]' : 'font-medium text-[#64748B] hover:text-[#1A1A1A] border-transparent'}`}
                        >
                            AI Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`pb-4 text-sm transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'map' ? 'font-semibold border-black text-[#1A1A1A]' : 'font-medium text-[#64748B] hover:text-[#1A1A1A] border-transparent'}`}
                        >
                            Knowledge Map
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {/* ── CHAT TAB ── */}
                        <div className={`flex-1 flex-col overflow-hidden ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FAFAFA] custom-scrollbar">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex gap-4 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'assistant' ? 'bg-white border border-[#EDEDED]' : 'bg-[#1A1A1A]'}`}>
                                            {m.role === 'assistant'
                                                ? <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /></svg>
                                                : <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                            }
                                        </div>
                                        {/* Bubble */}
                                        <div className={m.role === 'assistant'
                                            ? 'bg-white border border-[#EDEDED] p-4 rounded-xl shadow-sm text-[#1A1A1A] text-sm leading-relaxed'
                                            : 'bg-[#1A1A1A] text-white p-4 rounded-xl shadow-md text-sm leading-relaxed'}>
                                            <p>{m.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-4 max-w-3xl">
                                        <div className="w-8 h-8 rounded bg-white border border-[#EDEDED] flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                        </div>
                                        <div className="bg-white border border-[#EDEDED] p-4 rounded-xl shadow-sm">
                                            <p className="text-sm text-[#64748B]">AI 思考中...</p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-8 bg-white border-t border-[#EDEDED]">
                                <div className="relative flex items-center bg-[#F8FAF9] rounded-xl border border-[#EDEDED] p-1 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                                        placeholder="Ask about the plot, themes, or characters..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 placeholder:text-[#64748B] text-[#1A1A1A] outline-none"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isLoading || !input.trim()}
                                        className="bg-[#1A1A1A] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </button>
                                </div>
                                <p className="text-[10px] text-center text-[#64748B] mt-4 uppercase tracking-widest font-bold">
                                    AI analysis may be limited to your current reading progress
                                </p>
                            </div>
                        </div>

                        {/* ── MAP TAB ── */}
                        <div className={`flex-1 relative grid-bg-dots overflow-hidden ${activeTab === 'map' ? 'block' : 'hidden'}`}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                colorMode="light"
                                fitView
                                proOptions={{ hideAttribution: true }}
                            >
                                <Controls showInteractive={false} className="mb-4 ml-4" />
                            </ReactFlow>

                            {/* Map Stats Footer */}
                            <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm border border-[#EDEDED] p-4 rounded-xl shadow-sm pointer-events-none">
                                <p className="text-[9px] uppercase tracking-widest text-[#64748B] font-bold mb-2">Map Statistics</p>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-lg font-bold text-[#1A1A1A]">{nodes.length}</p>
                                        <p className="text-[8px] text-[#64748B] uppercase font-semibold">Nodes</p>
                                    </div>
                                    <div className="w-px bg-[#EDEDED] h-8"></div>
                                    <div>
                                        <p className="text-lg font-bold text-[#1A1A1A]">{edges.length}</p>
                                        <p className="text-[8px] text-[#64748B] uppercase font-semibold">Connections</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#EDEDED] flex justify-center pointer-events-none">
                                <p className="text-[9px] text-[#64748B] uppercase tracking-[0.2em] font-semibold">Interactive Knowledge Graph • Powered by AI Reader</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile Tab Switcher */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-[#EDEDED] flex">
                    <button onClick={() => setActiveTab('chat')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'chat' ? 'text-black' : 'text-gray-400'}`}>Chat</button>
                    <button onClick={() => setActiveTab('map')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'map' ? 'text-black' : 'text-gray-400'}`}>Map</button>
                </div>
            </div>
        </div>
    );
};

export default BookModal;
