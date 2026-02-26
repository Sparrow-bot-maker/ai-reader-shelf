import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Network, Loader2, Save, Trash2, RefreshCcw } from 'lucide-react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
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

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
const NODE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const BookModal = ({ book, onClose }: BookModalProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: `你好！我是你的 AI 讀書助理。關於《${book.title}》，你想深入了解哪些內容呢？討論過程中，我會幫你把重點整理成右側思維導圖。` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const nodeCountRef = useRef(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nodes, setNodes] = useState<any[]>([
        {
            id: 'root',
            position: { x: 300, y: 10 },
            data: { label: book.title },
            style: {
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff',
                borderRadius: '16px',
                padding: '12px 20px',
                fontWeight: 'bold',
                fontSize: '14px',
                border: 'none',
                boxShadow: '0 0 20px rgba(59,130,246,0.5)',
                minWidth: 160,
                textAlign: 'center' as const,
            },
        },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [edges, setEdges] = useState<any[]>([]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // 讀取歷史紀錄
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const userId = localStorage.getItem('userId') || 'guest';
                const resData = await AuthService.getBooks(userId);
                const allBooks = resData.data || [];
                const currentBook = allBooks.find((b: any) => b.Book_ID === book.id || (b.Title === book.title && b.User_ID === userId));

                if (currentBook) {
                    if (currentBook.Chat_History && currentBook.Chat_History !== '[]') {
                        setMessages(JSON.parse(currentBook.Chat_History));
                    }
                    if (currentBook.Mind_Map_Data && currentBook.Mind_Map_Data !== '{}') {
                        const savedMap = JSON.parse(currentBook.Mind_Map_Data);
                        setNodes(savedMap.nodes);
                        setEdges(savedMap.edges);

                        // 更新節點計數器
                        const maxId = savedMap.nodes.reduce((max: number, node: any) => {
                            const idMatch = node.id.match(/node-(\d+)/);
                            return idMatch ? Math.max(max, parseInt(idMatch[1])) : max;
                        }, 0);
                        nodeCountRef.current = maxId;
                    }
                }
            } catch (err) {
                console.error('Failed to restore history:', err);
            }
        };
        fetchHistory();
    }, [book.id]);

    const addKeywordNodes = (keywords: string[]) => {
        if (!keywords.length) return;

        // 計算新節點的佈局：以 root 為基準對稱展開
        const rootNode = nodes.find(n => n.id === 'root');
        const parentPos = rootNode ? rootNode.position : { x: 300, y: 10 };

        const spacingX = 200; // 節點間距
        const spacingY = 150; // 層級間距

        const newNodes = keywords.map((kw, i) => {
            nodeCountRef.current += 1;
            const nId = `node-${nodeCountRef.current}`;
            const color = NODE_COLORS[nodeCountRef.current % NODE_COLORS.length];

            // 計算對稱偏移：
            // 例如 3 個節點，偏移 index 分別為 -1, 0, 1
            const offsetIndex = i - (keywords.length - 1) / 2;
            const targetX = parentPos.x + (offsetIndex * spacingX);
            const targetY = parentPos.y + spacingY;

            return {
                id: nId,
                position: {
                    x: targetX,
                    y: targetY
                },
                data: { label: kw },
                style: {
                    background: `${color}22`,
                    color: '#e2e8f0',
                    border: `1.5px solid ${color}88`,
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    minWidth: 120,
                    textAlign: 'center' as const,
                    boxShadow: `0 8px 15px ${color}20`,
                },
            };
        });

        const newEdges = newNodes.map((n) => ({
            id: `e-root-${n.id}`,
            source: 'root',
            target: n.id,
            animated: true,
            style: { stroke: NODE_COLORS[parseInt(n.id.split('-')[1]) % NODE_COLORS.length], strokeWidth: 2, opacity: 0.6 },
        }));

        setNodes((prev: any[]) => [...prev, ...newNodes]);
        setEdges((prev: any[]) => [...prev, ...newEdges]);

        // 手機端自動跳轉到導圖
        if (window.innerWidth < 768) {
            setActiveTab('map');
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        const currentInput = input;
        setInput('');
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const systemPrompt = `你是一個專業的讀書助理，正在幫使用者討論《${book.title}》（作者：${book.author}，分類：${book.category}）。請以 JSON 格式回覆，包含：1. "text": 對話回覆（繁體中文，自然有深度） 2. "keywords": 從回覆提取 2-4 個核心概念（繁體中文詞語陣列）。只回傳 JSON，不要有其他文字。`;

            // messages.slice(1) 跳過初始 AI 打招呼，確保 contents 以 user 開頭
            const chatHistory = messages.slice(1).map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            // 把 system prompt 融入第一個 user message（v1 API 不支援 system_instruction）
            const firstUserText = chatHistory.length === 0
                ? `${systemPrompt}\n\n用戶問：${currentInput}`
                : currentInput;

            const contents = chatHistory.length === 0
                ? [{ role: 'user', parts: [{ text: firstUserText }] }]
                : [...chatHistory, { role: 'user', parts: [{ text: currentInput }] }];

            const res = await axios.post(GEMINI_URL, {
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            });

            const rawText: string = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            let parsed: { text: string; keywords: string[] } = { text: rawText, keywords: [] };
            try { parsed = JSON.parse(cleaned); } catch { parsed = { text: cleaned, keywords: [] }; }

            setMessages((prev) => [...prev, { role: 'assistant', content: parsed.text }]);
            if (parsed.keywords?.length) addKeywordNodes(parsed.keywords);

        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detail = (err as any)?.response?.data?.error?.message || (err as any)?.message || String(err);
            console.error('Gemini API error:', detail, err);

            let displayMsg = `⚠️ API 錯誤：${detail}`;
            if (detail.includes('429') || detail.toLowerCase().includes('quota')) {
                displayMsg = "親愛的，我今天的腦力稍微透支了，需要休息一下下喔！明天我會帶著滿滿的活力回來繼續陪你讀書，請明天再來找我吧！❤️";
            }

            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: displayMsg,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const userId = localStorage.getItem('userId') || 'guest';
            await AuthService.updateBook({
                Book_ID: book.id,
                Title: book.title,
                User_ID: userId,
                Chat_History: JSON.stringify(messages),
                Mind_Map_Data: JSON.stringify({ nodes, edges }),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('你確定要狠心刪除這本書嗎？這將無法復原喔！')) return;

        try {
            await AuthService.deleteBook(book.id);
            onClose();
            window.location.reload(); // 簡單起見，直接刷新頁面
        } catch (err) {
            console.error('Delete error:', err);
            alert('刪除失敗');
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = book.status === '想閱讀' ? '已閱讀' : '想閱讀';
        try {
            await AuthService.updateBook({
                Book_ID: book.id,
                Status: newStatus,
                Title: book.title,
                User_ID: localStorage.getItem('userId') || 'guest'
            });
            onClose();
            window.location.reload();
        } catch (err) {
            console.error('Toggle status error:', err);
        }
    };

    const handleClose = () => {
        handleSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-end overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-[95%] lg:max-w-[1200px] h-full bg-[#0f172a] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <img
                            src={book.cover || `https://placehold.co/40x40/1e293b/3b82f6?text=📚`}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-md shadow-lg shrink-0"
                            alt=""
                        />
                        <div className="overflow-hidden">
                            <h2 className="text-sm sm:text-xl font-bold text-white leading-tight truncate">{book.title}</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{book.author}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={handleToggleStatus}
                            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] sm:text-xs font-medium transition-all min-h-[44px]"
                            title={`標記為${book.status === '想閱讀' ? '已閱讀' : '想閱讀'}`}
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">標記為{book.status === '想閱讀' ? '已閱讀' : '想閱讀'}</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2.5 sm:p-2 hover:bg-red-500/10 rounded-full transition-colors text-slate-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="刪除"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-0.5 sm:mx-1" />
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/20 rounded-lg text-[10px] sm:text-xs font-medium transition-all disabled:opacity-50 min-h-[44px]"
                            title="儲存進度"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">儲存進度</span>
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 sm:p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Switcher */}
                <div className="flex md:hidden bg-white/5 border-b border-white/10 p-1 shrink-0">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        AI 對話
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        思維導圖
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                    {/* Chat Section */}
                    <div className={`
                        flex-col border-r border-white/10 bg-black/20 shrink-0 w-full md:w-[400px] lg:w-[450px]
                        ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
                    `}>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                        <span className="text-slate-400 text-sm">AI 思考中...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input - Sticky/Fixed at bottom of section */}
                        <div className="p-4 bg-white/5 border-t border-white/10 mt-auto">
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder="詢問 AI 關於這本書... (Enter 發送)"
                                    rows={2}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 bottom-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                AI 回覆後自動提取關鍵字並跳轉至導圖
                            </p>
                        </div>
                    </div>

                    {/* Mind Map Section */}
                    <div className={`
                        flex-1 relative bg-[#0a0f1d] overflow-hidden
                        ${activeTab === 'map' ? 'flex' : 'hidden md:flex'}
                    `}>
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] sm:text-xs font-bold border border-blue-500/20 backdrop-blur-md">
                                <Network className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                AI 思維導圖 · {nodes.length - 1} 個概念
                            </span>

                            {/* Back to Chat Button (Mobile) */}
                            <button
                                onClick={() => setActiveTab('chat')}
                                className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold border border-white/10 backdrop-blur-md shadow-xl transition-all active:scale-95"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                返回聊天對話
                            </button>
                        </div>

                        <div className="w-full h-full">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                colorMode="dark"
                                fitView
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background color="#1e293b" gap={24} />
                                <Controls className="!bg-slate-800/80 !border-white/10 sm:flex hidden" />
                            </ReactFlow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookModal;
