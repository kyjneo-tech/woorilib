'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DOMAIN_LABELS } from '@/features/curation/config/standard-roadmaps';
import { GrowthDomain } from '@/features/classification/lib/classification.service';

export default function BarcodePage() {
    const router = useRouter();
    const [mode, setMode] = useState<'scan' | 'search'>('scan');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [listResults, setListResults] = useState<any[]>([]);
    
    // --- Mock Scanner Logic ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) {
            alert('카메라 접근 권한이 필요합니다.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    useEffect(() => {
        if (mode === 'scan') startCamera();
        else stopCamera();
        return () => stopCamera();
    }, [mode]);

    // --- Search Logic ---
    const handleSearch = async (e?: any) => {
        if (e) e.preventDefault();
        if (!query) return;
        setLoading(true);
        setResult(null);
        
        try {
            const res = await fetch(`/api/books/lookup?query=${query}`);
            const data = await res.json();
            setListResults(data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLookupIsbn = async (isbn: string) => {
        if (!isbn || loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/books/lookup?isbn=${isbn}`);
            const data = await res.json();
            if (res.ok && data.book) {
                setResult(data);
                setMode('search'); 
                stopCamera(); // Stop camera once found
            } else {
                // If not found in scan mode, we don't alert to avoid interrupting the loop
                // but for manual simulation we do
                if (mode === 'search') alert(data.error || '책 정보를 찾을 수 없습니다.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Native Barcode Detection Loop ---
    useEffect(() => {
        let animationId: number;
        let isProcessing = false;

        const detect = async () => {
            if (!cameraActive || !videoRef.current || mode !== 'scan' || isProcessing || result) {
                animationId = requestAnimationFrame(detect);
                return;
            }

            const video = videoRef.current;

            // CRITICAL: Check if video is actually ready to be processed
            // readyState 2+ means HAVE_CURRENT_DATA or more
            if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
                animationId = requestAnimationFrame(detect);
                return;
            }

            // Check for Native Barcode Detector Support
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
                try {
                    // @ts-ignore
                    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
                    const barcodes = await detector.detect(video);
                    
                    if (barcodes.length > 0) {
                        const isbn = barcodes[0].rawValue;
                        isProcessing = true;
                        // Vibrate if supported
                        if (navigator.vibrate) navigator.vibrate(200);
                        await handleLookupIsbn(isbn);
                        isProcessing = false;
                    }
                } catch (e) {
                    console.error('Detection error:', e);
                }
            }
            animationId = requestAnimationFrame(detect);
        };

        if (cameraActive) animationId = requestAnimationFrame(detect);
        return () => cancelAnimationFrame(animationId);
    }, [cameraActive, mode, result]);

    const handleAddToShelf = async (book: any, domain: GrowthDomain) => {
        try {
            const res = await fetch('/api/bookshelf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isbn: book.isbn13 || book.id,
                    title: book.title,
                    author: typeof book.author === 'string' ? book.author : '',
                    bookImage: book.cover_url || book.cover,
                    domain: domain
                })
            });
            if (res.ok) {
                alert(`✅ 등록 완료! [${DOMAIN_LABELS[domain].label}] 점수가 올라갔습니다.`);
                setResult(null);
                setListResults([]);
                setQuery('');
            }
        } catch (e) {
            alert('등록 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Nav Header */}
            <div className="bg-white px-4 py-4 border-b flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => router.back()} className="text-gray-400 font-bold p-2">✕</button>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setMode('scan')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${mode === 'scan' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                    >
                        📸 바코드
                    </button>
                    <button 
                        onClick={() => setMode('search')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${mode === 'search' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                    >
                        🔍 검색
                    </button>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <main className="flex-1 flex flex-col items-center p-4">
                
                {mode === 'scan' && (
                    <div className="w-full max-w-sm flex flex-col gap-6 pt-10">
                        {/* Camera Preview Box */}
                        <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-500">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale opacity-60" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-64 h-32 border-2 border-dashed border-white/50 rounded-xl relative">
                                     <div className="absolute inset-0 border-2 border-indigo-400 animate-pulse" />
                                </div>
                                <p className="text-white text-xs font-bold mt-4 opacity-70">바코드를 사각형 안에 비춰주세요</p>
                            </div>
                            
                            {/* Scanning Overlay (Fake) */}
                            <motion.div 
                                animate={{ top: ['10%', '90%', '10%'] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-10"
                            />
                        </div>

                        {/* Helper Buttons */}
                        <div className="flex flex-col gap-3">
                             {/* Simulation Button for Model Demo */}
                            <button 
                                onClick={() => handleLookupIsbn('9791190291354')}
                                className="py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-black text-sm active:scale-95 transition-all"
                            >
                                🧪 시연용 바코드 테스트 (도레미곰)
                            </button>
                            <p className="text-[10px] text-center text-gray-400 font-medium">
                                바코드가 인식되지 않나요? [검색] 탭을 이용해보세요.
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'search' && (
                    <div className="w-full max-w-sm flex flex-col gap-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                             <input 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="제목이나 ISBN을 입력하세요"
                                className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                             />
                             <button className="bg-gray-900 text-white px-4 rounded-2xl font-bold text-sm">검색</button>
                        </form>

                        {loading && <div className="text-center py-10 animate-pulse">데이터 확인 중...</div>}

                        <AnimatePresence>
                            {result && result.book && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-100 flex flex-col gap-4"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-20 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                            <img src={result.book.cover_url || result.book.cover} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black mb-1 bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                {DOMAIN_LABELS[(result.analysis?.domain || result.book.domain) as GrowthDomain]?.label || '기타'}
                                            </div>
                                            <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{result.book.title}</h3>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{result.book.publisher}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleAddToShelf(result.book, (result.analysis?.domain || result.book.domain) as GrowthDomain)}
                                        className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        내 책장에 추가하고 진단받기
                                    </button>
                                </motion.div>
                            )}

                            {/* List Results (from Keyword Search) */}
                            {!result && listResults.map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl p-3 border border-gray-100 flex gap-3 items-center"
                                >
                                    <div className="w-12 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 shadow-sm text-[8px] flex items-center justify-center">
                                         {item.cover ? <img src={item.cover} className="w-full h-full object-cover" /> : 'No Cover'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-indigo-500 mb-0.5">{DOMAIN_LABELS[item.analysis.domain as GrowthDomain].label}</div>
                                        <div className="text-xs font-bold text-gray-800 line-clamp-1">{item.title}</div>
                                        <div className="text-[9px] text-gray-400">{item.publisher}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleAddToShelf(item, item.analysis.domain as GrowthDomain)}
                                        className="px-3 py-2 bg-gray-50 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        추가
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
