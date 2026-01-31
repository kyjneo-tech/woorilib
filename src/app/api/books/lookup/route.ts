
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { AladinCollector } from "@/features/curation/collectors/aladin-collector";
import { ClassificationService } from "@/features/classification/lib/classification.service";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn');
    const query = searchParams.get('query');

    if (!isbn && !query) {
        return NextResponse.json({ error: "isbn or query required" }, { status: 400 });
    }

    try {
        // 1. Search by ISBN (Priority)
        if (isbn) {
            // Check cache
            const cache = await prisma.verified_books.findUnique({
                where: { isbn13: isbn }
            });

            if (cache) {
                return NextResponse.json({ 
                    book: cache, 
                    analysis: ClassificationService.classify(cache.title, cache.description || '')
                });
            }

            // Fallback to Aladin
            const book = await AladinCollector.getByIsbn(isbn);
            if (book) {
                const analysis = ClassificationService.classify(book.title, book.categoryName);
                
                // Save to Cache
                const saved = await prisma.verified_books.upsert({
                    where: { isbn13: isbn },
                    update: {},
                    create: {
                        isbn13: book.isbn13,
                        title: book.title,
                        author: book.author,
                        publisher: book.publisher,
                        pub_date: new Date(book.pubDate),
                        cover_url: book.cover,
                        description: book.description,
                        price_standard: book.priceStandard,
                        domain: analysis.domain,
                        type: 'book',
                        source: 'aladin'
                    }
                });

                return NextResponse.json({ book: saved, analysis });
            }
        }

        // 2. Search by Query (Keyword)
        if (query) {
            const results = await AladinCollector.search(query, 5);
            const analyzedResults = results.map(book => ({
                ...book,
                analysis: ClassificationService.classify(book.title, book.categoryName)
            }));
            
            return NextResponse.json({ results: analyzedResults });
        }

        return NextResponse.json({ error: "Not found" }, { status: 404 });

    } catch (e) {
        console.error("Book Lookup API Error:", e);
        return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
}
