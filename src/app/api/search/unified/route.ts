import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { libraryApiClient } from "@/entities/book/api/library-api.client";
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
    // 1. Internal Search (Trusted DB)
    // We assume anything in 'library_curations' has passed the heuristic filter or is manually verified.
    const internalResults = await prisma.$queryRawUnsafe<any[]>(
      `SELECT isbn13, title, author, publisher, cover_url, age_group, is_purified 
       FROM library_curations 
       WHERE title ILIKE $1 OR author ILIKE $1
       LIMIT 20`,
      `%${query}%`
    );

    const internalBooks = internalResults.map(b => ({
      isbn: b.isbn13,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      bookImageURL: b.cover_url,
      source: 'internal',
      isVerified: b.is_purified,
      tags: b.is_purified ? ['검증됨'] : ['AI선별']
    }));

    let finalBooks = [...internalBooks];

    // 2. Fallback to External (if few results)
    if (finalBooks.length < 5) {
      console.log(`[UnifiedSearch] Internal results (${finalBooks.length}) are low. Fetching external.`);
      try {
        const externalRes = await libraryApiClient.searchBooks({
          keyword: query,
          pageSize: 50 // Fetch more to allow for filtering attrition
        });

        const externalDocs = externalRes?.response?.docs || [];
        
        const filteredExternal = externalDocs
          .map((item: any) => ({
            isbn: item.doc.isbn13 || item.doc.isbn,
            title: item.doc.bookname,
            author: item.doc.authors,
            publisher: item.doc.publisher,
            publishYear: item.doc.publication_year,
            bookImageURL: item.doc.bookImageURL,
            source: 'external'
          }))
          .filter((book: any) => {
            // Deduplicate against internal results
            if (finalBooks.some(fb => fb.isbn === book.isbn)) return false;

            // Apply Strict Heuristic Filter
            const filterRes = LibraryFilterService.filterByAge(book, age);
            return filterRes.passed;
          })
          .slice(0, 20); // Limit external additions

        finalBooks = [...finalBooks, ...filteredExternal];
      } catch (extErr) {
        console.error('[UnifiedSearch] External search failed', extErr);
      }
    }

    return NextResponse.json({ books: finalBooks });
  } catch (error) {
    console.error('[UnifiedSearch] Error:', error);
    return NextResponse.json({ error: "Search Failed" }, { status: 500 });
  }
}
