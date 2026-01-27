
'use client';

import { useState, useEffect } from 'react';
import { BookItem } from '../engine/display/shelf-composer';

interface ComboItem {
  collection: BookItem;
  singles: BookItem[];
}

interface Props {
  item: ComboItem;
  onBookClick: (book: BookItem) => void;
}

export function BookComboCard({ item, onBookClick }: Props) {
  const { collection } = item;
  const [collCover, setCollCover] = useState(collection.cover_url);

  // Self-Healing Cover Logic with Debounce prevention could be better but keeping simple
  useEffect(() => {
    if (!collCover) {
        const fetchCover = async () => {
            // Introduce random delay (0-1500ms) to stagger requests
            const delay = Math.random() * 1500;
            await new Promise(r => setTimeout(r, delay));
            
            try {
                const res = await fetch(`/api/book/meta?query=${encodeURIComponent(collection.title + ' ' + collection.publisher)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.cover) setCollCover(data.cover);
                }
            } catch (e) {}
        };
        fetchCover();
    }
  }, [collection, collCover]);

  // Tag Mapper (English -> Korean + Icon)
  const getTagStyle = (tag: string) => {
    const map: Record<string, { label: string, color: string, icon: string }> = {
      'NATURE': { label: '자연', color: 'bg-green-100 text-green-700', icon: '🌿' },
      'CREATIVE': { label: '창의', color: 'bg-purple-100 text-purple-700', icon: '✨' },
      'COGNITIVE': { label: '인지', color: 'bg-blue-100 text-blue-700', icon: '🧠' },
      'EMOTION': { label: '인성', color: 'bg-rose-100 text-rose-700', icon: '💖' },
      'MATH_SCI': { label: '수과학', color: 'bg-indigo-100 text-indigo-700', icon: '🔢' },
      'TOY': { label: '놀이', color: 'bg-yellow-100 text-yellow-700', icon: '🧸' },
      'VEHICLE': { label: '탈것', color: 'bg-slate-100 text-slate-700', icon: '🚗' },
      'HISTORY': { label: '역사', color: 'bg-amber-100 text-amber-700', icon: '📜' },
      'ART_MUSIC': { label: '예술', color: 'bg-pink-100 text-pink-700', icon: '🎨' },
      'ENGLISH': { label: '영어', color: 'bg-orange-100 text-orange-700', icon: '🅰️' },
      'saypen': { label: '세이펜', color: 'bg-red-50 text-red-500', icon: '🔊' },
      'banapen': { label: '바나펜', color: 'bg-yellow-50 text-yellow-600', icon: '🍌' },
    };
    // Default fallback
    return map[tag] || { label: tag, color: 'bg-gray-100 text-gray-500', icon: '#' };
  };

  // Gradient Generator for Missing Covers (Deterministically based on title length)
  const getGradient = (text: string) => {
      const gradients = [
          'from-pink-200 to-rose-100',
          'from-blue-200 to-cyan-100',
          'from-green-200 to-emerald-100',
          'from-purple-200 to-violet-100',
          'from-orange-200 to-amber-100',
      ];
      const index = text.length % gradients.length;
      return `bg-gradient-to-br ${gradients[index]}`;
  };

  return (
    <div className="flex flex-col gap-3 group">
      {/* Main Card (Collection) */}
      <div 
        onClick={() => onBookClick(collection)}
        className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-white border border-gray-100 shadow-sm"
      >
        <div className="flex gap-5 items-start">
            {/* Cover Image or Typography Fallback */}
            <div className={`w-24 h-32 flex-none rounded-xl shadow-md overflow-hidden relative ${!collCover ? getGradient(collection.title) : 'bg-gray-100'}`}>
                {collCover ? (
                    <img src={collCover} alt={collection.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="font-black text-gray-600/50 text-sm leading-tight break-keep">
                            {collection.title}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col flex-1 py-1 min-w-0">
                {/* Publisher: Subtle & Small */}
                <div className="text-xs font-semibold text-gray-400 mb-1 tracking-wide uppercase truncate">
                    {collection.publisher}
                </div>
                
                {/* Title: Big, Bold, Readable */}
                <h4 className="font-extrabold text-lg leading-snug text-gray-800 mb-3 break-keep">
                    {collection.title}
                </h4>
                
                {/* Tags: Pills with Icons */}
                 <div className="flex flex-wrap gap-1.5">
                    {collection.tags?.slice(0, 3).map(tag => {
                        const style = getTagStyle(tag);
                        return (
                            <span key={tag} className={`text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap ${style.color}`}>
                                <span className="text-[10px]">{style.icon}</span>
                                {style.label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
