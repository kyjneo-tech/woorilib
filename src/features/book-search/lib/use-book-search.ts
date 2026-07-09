import { useState } from 'react';
import { Book } from '@/entities/book/model/types';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { aladinApiClient } from '@/entities/book/api/aladin-api.client';
import { createClient } from '@/shared/lib/supabase/client';

export function useBookSearch() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchBooks = async (query: string, page: number = 1): Promise<{ books: Book[], total: number }> => {
        if (!query.trim()) return { books: [], total: 0 };

        setLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            // 1. Define Search Promises
            // Explicitly handle promises to avoid Promise.all union type issues
            const internalPromise = page === 1
                ? supabase
                    .from('verified_books')
                    .select('*')
                    .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
                    .limit(5)
                : Promise.resolve({ data: [] });

            const aladinPromise = aladinApiClient.searchBooks(query, 20);

            // Execute in parallel
            const [internalRes, aladinBooks] = await Promise.all([internalPromise, aladinPromise]);

            // 2. Process Internal Results
            // Safe access to data with type assertion since Promise resolution types might vary
            const rawInternalBooks = (internalRes as any).data || [];
            const internalBooks: Book[] = rawInternalBooks.map((item: any) => ({
                isbn: item.isbn13 || item.isbn,
                title: item.title,
                author: item.author,
                publisher: item.publisher,
                publishYear: item.pub_date,
                bookImageURL: item.cover_url,
                description: item.description,
                tags: item.tags
            }));

            // 3. Process External Results (Aladin)
            // aladinBooks is directly Book[]

            // 4. Merge & Deduplicate
            const bookMap = new Map<string, Book>();

            // Add Internal books first (Highest Priority)
            internalBooks.forEach(book => {
                const cleanIsbn = book.isbn ? book.isbn.replace(/-/g, '') : '';
                const key = cleanIsbn || `internal-${book.title}`;
                if (cleanIsbn) book.isbn = cleanIsbn; // Use cleaned ISBN
                bookMap.set(key, book);
            });

            // Add Aladin books
            aladinBooks.forEach(book => {
                const cleanIsbn = book.isbn ? book.isbn.replace(/-/g, '') : '';
                const key = cleanIsbn || `aladin-${book.title}`;
                if (cleanIsbn) book.isbn = cleanIsbn; // Use cleaned ISBN

                if (!bookMap.has(key)) {
                    bookMap.set(key, book);
                }
            });

            const combinedBooks = Array.from(bookMap.values());

            return {
                books: combinedBooks,
                total: combinedBooks.length >= 20 ? 100 : combinedBooks.length
            };

        } catch (err) {
            console.error('Search failed:', err);
            setError('도서 검색 중 오류가 발생했습니다.');
            return { books: [], total: 0 };
        } finally {
            setLoading(false);
        }
    };

    return { searchBooks, loading, error };
}
