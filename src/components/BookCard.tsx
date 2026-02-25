import React from 'react';
import { Tag, BookOpen } from 'lucide-react';

interface BookCardProps {
    book: {
        id: string;
        title: string;
        author: string;
        cover: string;
        category: string;
    };
    onClick?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full"
        >
            <div className="aspect-[3/4] overflow-hidden relative bg-slate-800">
                <img
                    src={book.cover || `https://placehold.co/300x400/1e293b/3b82f6?text=${encodeURIComponent(book.title)}`}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/300x400/1e293b/3b82f6?text=${encodeURIComponent(book.title)}`;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // 避免觸發兩次
                            onClick?.();
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                    >
                        <BookOpen className="w-4 h-4" />
                        查看詳情
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-2 flex-grow">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        <Tag className="w-3 h-3" />
                        {book.category}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {book.title}
                </h3>
                <p className="text-sm text-slate-400">
                    {book.author}
                </p>
            </div>
        </div>
    );
};

export default BookCard;
