
'use client';

import { useState, useEffect } from 'react';
import { BookItem } from '../engine/display/shelf-composer';
import { libraryApiClient, Library } from '@/entities/book/api/library-api.client';
import { useRegionStore } from '@/features/region-selector/lib/use-region-store';
import { BookLocationMap } from '@/features/map/ui/BookLocationMap';
import { libraryToMapLocation, useMapStore } from '@/features/map/lib/use-map-store';

interface Props {
  book: BookItem;
  onClose: () => void;
  source?: 'library' | 'general';
}

interface ReviewItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
}

export function BookDetailModal({ book, onClose, source = 'general' }: Props) {
  const [meta, setMeta] = useState<{ cover?: string, price?: number, link?: string, isbn?: string } | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const { setSelectedLocation } = useMapStore();
  
  // 1. Fetch Meta (High Res Cover & ISBN) if needed
  useEffect(() => {
    async function fetchMeta() {
      // Always fetch meta to get the buy link and better cover
      try {
        const query = `${book.title} ${book.publisher || ''}`.trim();
        const res = await fetch(`/api/book/meta?query=${encodeURIComponent(query)}`);
        if (res.ok) {
            const data = await res.json();
            setMeta(data);
        }
      } catch (e) { console.error(e); }
    }
    fetchMeta();
  }, [book]);

  const { getRegionCode, getDisplayName } = useRegionStore();
  const regionCode = getRegionCode();

  // 2. Fetch Libraries (Naru API)
  useEffect(() => {
    async function fetchLibraries() {
      if (!meta?.isbn) return;
      
      setLoadingLib(true);
      try {
        // Parse Region Code
        // If 5 digits (e.g. 41110) -> region=41, dtl_region=41110
        // If 2 digits (e.g. 11) -> region=11
        let regionParam = '11';
        let dtlParam = undefined;

        if (regionCode) {
            if (regionCode.length === 5) {
                regionParam = regionCode.substring(0, 2);
                dtlParam = regionCode;
            } else {
                regionParam = regionCode;
            }
        }

        const res = await libraryApiClient.searchLibrariesByBook({
            isbn: meta.isbn,
            region: regionParam,
            dtl_region: dtlParam,
            pageSize: 10
        });
        setLibraries(res.libraries || []);
      } catch (e) { 
        console.error('Library Search Failed', e); 
      } finally {
        setLoadingLib(false);
      }
    }
    fetchLibraries();
  }, [meta?.isbn, regionCode]);

  // 3. Fetch Reviews (Naver Blog)
  useEffect(() => {
    async function fetchReviews() {
        try {
            const query = `${book.title} ${book.publisher || ''} 후기`;
            const res = await fetch(`/api/naver/search?query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.items || []);
            }
        } catch (e) { console.error(e); }
    }
    fetchReviews();
  }, [book]);

  // Gradient Generator
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

  const coverUrl = meta?.cover || book.cover_url;
  
  // Service Loop Links
  const naverLink = `https://search.shopping.naver.com/book/search?bookTabType=ALL&pageIndex=1&pageSize=40&query=${encodeURIComponent(book.title)}&sort=REL`;
  const aladinUsedLink = `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Used&SearchWord=${encodeURIComponent(book.title)}`;
  const danggeunLink = `https://www.daangn.com/kr/buy-sell/?search=${encodeURIComponent(book.title)}`;
  
  // Naru Library Link (Web)
  const libraryLink = `http://data4library.kr/`; 

  // Tag Mapper (Shared with BookComboCard - Logic could be extracted)
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
      'qr_code': { label: 'QR영상', color: 'bg-gray-100 text-gray-700', icon: '📱' },
      'fishtalk': { label: '물고기톡', color: 'bg-blue-50 text-blue-600', icon: '🐠' },
      'cd_included': { label: 'CD포함', color: 'bg-gray-100 text-gray-600', icon: '💿' },
      'workbook_included': { label: '워크북', color: 'bg-emerald-50 text-emerald-600', icon: '📝' },
    };
    return map[tag] || { label: tag, color: 'bg-gray-100 text-gray-500', icon: '#' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-hide"
        style={{ background: 'var(--color-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className={`h-64 flex items-center justify-center relative ${!coverUrl ? getGradient(book.title) : 'bg-gray-100'}`}>
            {coverUrl ? (
                <img src={coverUrl} alt={book.title} className="h-48 object-contain shadow-2xl rounded-lg translate-y-4 transition-transform hover:scale-105" />
            ) : (
                <div className="text-center p-8">
                    <h3 className="text-3xl font-black text-gray-800/20 leading-tight break-keep">{book.title}</h3>
                </div>
            )}
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-black flex items-center justify-center backdrop-blur-md transition-colors"
            >
                ✕
            </button>
        </div>

        {/* Content */}
        <div className="px-6 pt-12 pb-8">
            <div className="text-center mb-8">
                <div className="text-sm font-bold text-gray-400 mb-1 tracking-wider uppercase">{book.publisher}</div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight mb-3">{book.title}</h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {book.tags?.map(tag => {
                        const style = getTagStyle(tag);
                        return (
                             <span key={tag} className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${style.color}`}>
                                <span>{style.icon}</span>
                                {style.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Service Loop Buttons (Modern Minimal Style) */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <a href={naverLink} target="_blank" rel="noopener noreferrer" 
                   className="p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-gray-600 hover:text-green-700">
                   <span className="text-lg font-bold text-green-500">N</span> 
                   <span className="text-xs font-bold">최저가 검색</span>
                </a>
                <a href={aladinUsedLink} target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all text-gray-600 hover:text-pink-700">
                    <span className="text-xl">🧞‍♂️</span> 
                    <span className="text-xs font-bold">중고 재고</span>
                </a>
                <a href={danggeunLink} target="_blank" rel="noopener noreferrer"
                    className="p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all text-orange-700">
                    <span className="text-lg">🥕</span> 
                    <span className="text-xs font-bold">당근마켓</span>
                </a>
            </div>

      <hr className="mb-8 border-gray-100" />

      {/* Reorderable Content Containers */}
      <div className={`flex flex-col ${source === 'general' ? 'flex-col-reverse' : ''}`}>
        
        {/* Library Availability Section */}
        <section className={`mb-8 ${source === 'general' ? 'opacity-90 grayscale-[0.3]' : ''}`}>
          <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                  <span>🏛️ 우리 동네 도서관</span>
              </h4>
              <div className="text-[10px] font-black text-purple-500 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  📍 {getDisplayName()}
              </div>
          </div>
          
          {loadingLib ? (
              <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl">📍 주변 도서관을 찾는 중...</div>
          ) : libraries.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2">
                      <span>✨ {libraries.length}곳에서 빌릴 수 있어요!</span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 rounded-xl overflow-hidden border border-gray-100 min-h-[300px]">
                          <BookLocationMap 
                              locations={libraries.map(lib => libraryToMapLocation(lib))}
                              height="100%"
                              showFilter={false}
                          />
                      </div>

                      <div className="w-full md:w-80 flex flex-col gap-3">
                          <div className="max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-hide">
                              {libraries.map((lib, i) => (
                                  <div 
                                      key={i} 
                                      onClick={() => setSelectedLocation(libraryToMapLocation(lib))}
                                      className="p-3 bg-gray-50 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-200 transition-all cursor-pointer group"
                                  >
                                      <div className="flex justify-between items-start mb-2 group-hover:text-green-700">
                                          <span className="font-bold text-sm leading-tight break-keep">{lib.libName}</span>
                                          <span className="flex-none text-[10px] font-bold px-2 py-0.5 bg-white border border-gray-100 rounded-full text-green-600">
                                              상세보기
                                          </span>
                                      </div>
                                      
                                      <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                                          <div className="flex items-center gap-1.5">
                                              <span className="flex-none text-[10px] text-purple-500">⏰</span>
                                              <span className="truncate">{lib.operatingTime || '시간정보없음'}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                                              <span className="flex-none text-[10px]">🗓️</span>
                                              <span>정기휴관: {lib.closed || '정보없음'}</span>
                                          </div>
                                      </div>

                                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                                          {lib.tel && (
                                              <a href={`tel:${lib.tel}`} className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-[10px] font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                                  📞 전화하기
                                              </a>
                                          )}
                                          {lib.homepage && (
                                              <a href={lib.homepage} target="_blank" rel="noreferrer" className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-[10px] font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors">
                                                  🏠 홈페이지
                                              </a>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          
                          <a href="https://map.kakao.com/link/search/도서관" target="_blank" rel="noreferrer" className="block text-center text-[11px] text-green-600 font-bold bg-green-50 py-2.5 rounded-xl hover:bg-green-100 transition-colors mt-2">
                              🗺️ 전체 도서관 지도에서 보기
                          </a>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-8 text-center my-4">
                  <div className="text-4xl mb-4 animate-bounce">🎈</div>
                  <h5 className="font-extrabold text-orange-900 text-lg mb-2 leading-tight">우리 동네 도서관 소장 정보가 없어요.</h5>
                  <p className="text-sm text-orange-700 mb-6 opacity-90 break-keep">
                    이 책은 전집 또는 방문판매 전용 도서일 가능성이 높습니다.<br/>
                    부담 없이 책육아를 즐길 수 있는 다른 방법을 추천드려요!
                  </p>
                  
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                      <a href={`https://www.google.com/search?q=${getDisplayName()}+도서관+희망도서+신청`} target="_blank" rel="noreferrer"
                         className="flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-orange-200 rounded-2xl text-sm font-black text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm group">
                          <span className="text-lg">✨</span>
                          희망도서 신청 사이트 찾기
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                      <a href={aladinUsedLink} target="_blank" rel="noreferrer"
                         className="flex items-center justify-center gap-2 py-3.5 bg-rose-500 text-white rounded-2xl text-sm font-black hover:bg-rose-600 hover:shadow-lg transition-all shadow-md group">
                          <span className="text-lg">🧞‍♂️</span>
                          알라딘 중고 재고 확인하기
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                  </div>
              </div>
          )}
        </section>

        {source === 'general' && <hr className="mb-8 border-gray-100" />}

        {/* Review Section */}
        <section className={`mb-8 ${source === 'general' ? 'animate-in slide-in-from-bottom-2 duration-300' : ''}`}>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                <span>💌 블로그 후기 및 팁</span>
            </h4>
            <div className="flex flex-col gap-3">
                {reviews.length > 0 ? reviews.map((review, idx) => (
                    <a 
                        key={idx} 
                        href={review.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group bg-white border border-gray-100 p-4 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all"
                    >
                        <div className="font-bold text-sm mb-1 text-gray-800 truncate group-hover:text-blue-600 transition-colors" dangerouslySetInnerHTML={{ __html: review.title }} />
                        <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: review.description }} />
                        <div className="text-[10px] text-gray-400 mt-2 text-right font-medium">by {review.bloggername}</div>
                    </a>
                )) : (
                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
                        관련 후기를 불러오는 중입니다...
                    </div>
                )}
            </div>
        </section>
      </div>

            {/* Bottom Close Button */}
            <button 
                onClick={onClose}
                className="w-full py-4 mt-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
            >
                닫기
            </button>
        </div>
      </div>
    </div>
  );
}
