import { BookItem } from '../engine/display/shelf-composer';
import { useState, useEffect } from 'react';

interface Props {
  book: BookItem;
  onClick: (book: BookItem) => void;
  ageGroup: string | null;
}

export function HeroSection({ book, onClick, ageGroup }: Props) {
  const [cover, setCover] = useState(book.cover_url);

  // Self-Healing Cover
  useEffect(() => {
    if (!cover) {
        const fetchCover = async () => {
            try {
                const res = await fetch(`/api/book/meta?query=${encodeURIComponent(book.title + ' ' + book.publisher)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.cover) setCover(data.cover);
                }
            } catch (e) {}
        };
        fetchCover();
    }
  }, [book, cover]);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => onClick(book)}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900" />
      
      {/* Decorative Circles */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-blue-200 text-xs font-bold mb-4 border border-white/10 shadow-inner">
            ✨ {ageGroup}세 추천 1위
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight break-keep drop-shadow-lg">
            {book.title}
          </h1>
          <p className="text-blue-100/80 font-medium text-sm md:text-base mb-6 line-clamp-2">
            {book.summary || '아이들의 상상력을 자극하는 최고의 전집입니다.'}
          </p>
          <div className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
             <span>지금 바로 확인하기</span>
             <span>→</span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="w-48 md:w-64 flex-none perspective-1000">
             <div className="relative transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 shadow-2xl rounded-lg overflow-hidden bg-gray-200">
                 {cover ? (
                    <img src={cover} alt={book.title} className="w-full h-auto object-cover" />
                 ) : (
                    <div className="aspect-[3/4] flex items-center justify-center bg-white/10 text-white font-bold p-4 text-center">
                        {book.title}
                    </div>
                 )}
                 {/* Shine Effect */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             </div>
        </div>
      </div>
    </section>
  );
}
