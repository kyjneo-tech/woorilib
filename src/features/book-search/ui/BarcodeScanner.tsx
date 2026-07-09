'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useBookSearch } from '@/features/book-search/lib/use-book-search';
import { bookshelfService } from '@/features/bookshelf/lib/bookshelf-service';
import { X, Search, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BarcodeScannerProps {
    onScanSuccess: (book: any) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
    const [mode, setMode] = useState<'camera' | 'search'>('camera');
    const [isScannerActive, setIsScannerActive] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { searchBooks } = useBookSearch();

    // Search State
    const [keyword, setKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        if (mode === 'camera') {
            setIsScannerActive(true);
        } else {
            setIsScannerActive(false);
        }
    }, [mode]);

    useEffect(() => {
        if (!isScannerActive || mode !== 'camera') return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 150 } },
            /* verbose= */ false
        );

        scanner.render(onScan, onScanFailure);

        function onScan(decodedText: string) {
            handleBarcodeDetected(decodedText);
            scanner.clear();
            setIsScannerActive(false);
        }

        function onScanFailure(error: any) {
            // Create a lot of noise, so ignore
        }

        return () => {
            try {
                scanner.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, [isScannerActive, mode]);

    const handleBarcodeDetected = async (isbn: string) => {
        setLoading(true);
        setErrorMessage('');

        try {
            const { books } = await searchBooks(isbn);

            if (books.length > 0) {
                await handleAddBook(books[0]);
            } else {
                setErrorMessage('해당 ISBN의 도서를 찾을 수 없습니다.');
                setIsScannerActive(true); // create retry chance
            }
        } catch (e) {
            setErrorMessage('오류가 발생했습니다. 다시 시도해주세요.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (isNewSearch = false) => {
        if (!keyword.trim()) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const newPage = isNewSearch ? 1 : page + 1;
            const { books, total } = await searchBooks(keyword, newPage);

            if (isNewSearch) {
                setSearchResults(books);
                setPage(1);
            } else {
                setSearchResults(prev => [...prev, ...books]);
                setPage(newPage);
            }

            setHasMore(books.length > 0 && (isNewSearch ? books.length : searchResults.length + books.length) < total);

        } catch (e) {
            setErrorMessage('검색 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBook = async (book: any) => {
        const added = await bookshelfService.addBook(book, 'want_to_read');
        if (added) {
            onScanSuccess(added);
            onClose();
        } else {
            setErrorMessage('도서 추가에 실패했습니다.');
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]">
                <div className="p-4 flex items-center justify-between border-b">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode('camera')}
                            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${mode === 'camera' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
                        >
                            바코드 스캔
                        </button>
                        <button
                            onClick={() => setMode('search')}
                            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${mode === 'search' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
                        >
                            직접 검색
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {mode === 'camera' ? (
                        <div className="text-center">
                            <h3 className="text-lg font-black text-gray-900 mb-1">바코드를 스캔하세요</h3>
                            <p className="text-sm text-gray-500 mb-6">책 뒷면의 바코드를 카메라에 비춰주세요</p>

                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-2xl animate-pulse">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-black">도서 정보를 불러오는 중...</p>
                                </div>
                            ) : (
                                <div id="reader" className="rounded-2xl overflow-hidden bg-black w-full" />
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                                    placeholder="책 제목 또는 저자를 입력하세요"
                                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => handleSearch(true)}
                                    disabled={loading}
                                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Search size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {searchResults.map((book) => (
                                    <div key={book.isbn} onClick={() => handleAddBook(book)} className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 cursor-pointer transition-colors">
                                        {book.cover ? (
                                            <img src={book.cover} className="w-12 h-16 object-cover rounded-md bg-gray-100" />
                                        ) : (
                                            <div className="w-12 h-16 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No Img</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-900 truncate">{book.title}</h4>
                                            <p className="text-xs text-gray-500 truncate">{book.author}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{book.publisher} | {book.pubDate}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <button
                                    onClick={() => handleSearch(false)}
                                    disabled={loading}
                                    className="w-full py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100"
                                >
                                    {loading ? '로딩 중...' : '더 보기'}
                                </button>
                            )}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 justify-center">
                            ⚠️ {errorMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
