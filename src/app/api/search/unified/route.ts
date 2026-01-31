import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aladinApiClient } from "@/entities/book/api/aladin-api.client";
import { LibraryFilterService } from "@/features/curation/lib/library-filter.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const ageStr = searchParams.get("age");
  const age = ageStr ? parseInt(ageStr, 10) : 0;

  if (!query) {
    return NextResponse.json({ books: [] });
  }

  try {
    // 1. Aladin Search (Rich Data) - Primary Source
    const aladinBooks = await aladinApiClient.searchBooks(query);
    
    // 2. Internal Search (Trusted & Curated Data)
    // We fetch internal data to "enhance" Aladin results (e.g., add verification badge)
    // and to catch any locally curated books that might be obscure.
    const internalResults = await prisma.$queryRawUnsafe<any[]>(
      `SELECT isbn13, title, author, publisher, cover_url, age_group, is_purified 
       FROM library_curations 
       WHERE title ILIKE $1 OR author ILIKE $1
       LIMIT 50`,
      `%${query}%`
    );

    // Create a Map for fast lookup of internal data
    const internalMap = new Map();
    internalResults.forEach(b => {
      // Normalize ISBN
      if (b.isbn13) internalMap.set(b.isbn13, b);
    });

    // 3. Merge & Create Final List
    // Strategy: Aladin results are the base. If an internal book matches by ISBN, we merge metadata.
    // If an internal book is NOT in Aladin, we append it (optional, but good for custom curations).
    
    const processedBooks = aladinBooks.map(book => {
      const internal = internalMap.get(book.isbn);
      return {
        ...book,
        // If we have internal data, use it to flag verification
        isVerified: internal?.is_purified || false,
        source: 'aladin',
        tags: internal?.is_purified ? ['검증됨'] : []
      };
    });

    // Append Internal-only books (that weren't in Aladin results)
    const aladinIsbns = new Set(aladinBooks.map(b => b.isbn));
    const uniqueInternalBooks = internalResults
      .filter(b => b.isbn13 && !aladinIsbns.has(b.isbn13))
      .map(b => ({
        isbn: b.isbn13,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        bookImageURL: b.cover_url,
        source: 'internal',
        isVerified: b.is_purified,
        tags: b.is_purified ? ['검증됨Local'] : ['AI선별']
      }));

    const finalBooks = [...processedBooks, ...uniqueInternalBooks];

    // Optional: We can still apply a loose age filter if the user selected an age group
    // But for "Search", users usually expect to find what they typed. 
    // We will prioritize returning the list but maybe mark "Recommendation" if it fits age.

    return NextResponse.json({ books: finalBooks });
  } catch (error: any) {
    console.error('[UnifiedSearch] Error:', error);
    return NextResponse.json({ 
      error: "Search Failed", 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
