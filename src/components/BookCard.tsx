import React from 'react';

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
            className="group cursor-pointer"
        >
            {/* Cover */}
            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100 border border-gray-100 group-hover:shadow-xl transition-all duration-300">
                <img
                    src={book.cover || `https://placehold.co/300x400/f1f5f9/64748b?text=${encodeURIComponent(book.title)}`}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/300x400/f1f5f9/64748b?text=${encodeURIComponent(book.title)}`;
                    }}
                />
            </div>

            {/* Info */}
            <h3 className="text-gray-900 font-bold text-sm sm:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                {book.title}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">{book.author}</p>
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {book.category}
            </span>
        </div>
    );
};

export default BookCard;
