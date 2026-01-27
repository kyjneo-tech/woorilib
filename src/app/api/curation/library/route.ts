import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { libraryApiClient } from "@/entities/book/api/library-api.client";
import { LibraryFilterService } from "@/features/curation/lib/library-filter.service";

// Auto-Archive Function (Background)
async function archiveSafeBooks(books: any[], ageGroup: number) {
  try {
    const safeBooks = books.filter(b => b.isSafeGuess);
    if (safeBooks.length === 0) return;

    // Use Raw SQL for UPSERT because library_curations is not in Prisma Schema
    for (const book of safeBooks) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO library_curations (isbn13, title, author, publisher, cover_url, age_group, loan_count, is_purified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (isbn13) 
         DO UPDATE SET 
           loan_count = $7,
           updated_at = NOW()`,
        book.isbn13,
        book.title,
        book.author || '',
        book.publisher || '',
        book.cover || '',
        ageGroup,
        book.loanCount ? Number(book.loanCount) : 0,
        false // is_purified = false (Pending Review)
      );
    }
  } catch (e) {
    console.error('Auto-archiving failed (non-blocking):', e);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const age = parseInt(searchParams.get("age") || "0", 10);
  const regionCode = searchParams.get("region") || "11"; 
  
  // Parse Region: "11010" -> Region "11", Dtl "11010"
  // If regionCode is 2 digits (e.g. 11), use it as region.
  // If regionCode is 5 digits (e.g. 11680), use 11 as region, 11680 as dtl_region.
  let regionParam = regionCode.substring(0, 2);
  let dtlParam = regionCode.length > 2 ? regionCode : undefined;

  try {
    // 1. Real-time Fetch from Naru (Broad Fetch: 100 items)
    // We fetch broadly because strict filtering creates high attrition.
    const response = await libraryApiClient.getPopularBooks({
      age: getApiAgeCode(age), // Map internal age (0, 3, 5..) to API codes
      region: regionParam,
      dtl_region: dtlParam,
      pageSize: 100 
    });

    const docs = response?.response?.docs || [];
    const rawBooks = docs.map((item: any) => ({
      isbn13: item.doc.isbn13,
      title: item.doc.bookname,
      author: item.doc.authors,
      publisher: item.doc.publisher,
      cover: item.doc.bookImageURL,
      loanCount: item.doc.loan_count,
    }));

    // 2. Strict Filter
    const filtered = rawBooks
      .map((b: any) => {
        const check = LibraryFilterService.filterByAge(b, age);
        return { ...b, ...check };
      })
      .filter((b: any) => b.passed); // Remove 'Common Siblings' etc.

    // 3. Auto-Archive (Background - Fire & Forget)
    // We don't await this to keep response fast? actually Next.js 14 serverless might kill it. 
    // Let's await for safety in this demo scale.
    await archiveSafeBooks(filtered, age);

    // 4. Return Top 10
    const books = filtered.slice(0, 10).map((b: any) => {
      return {
        collection: {
          id: b.isbn13,
          title: b.title || "No Title",
          publisher: b.publisher || "No Publisher",
          summary: "이 지역 도서관 인기 급상승! (대출 " + Number(b.loanCount).toLocaleString() + "회)",
          features: { saypen: false }
        },
        singles: [],
        tags: b.isSafeGuess ? ["AI선별", "주변도서관","인기"] : ["주변도서관", "인기"],
        is_new: false,
        match_score: b.isSafeGuess ? 80 : 90,
        is_library_book: true,
        region: regionCode
      };
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}

// Helper: Map internal age to API codes
// Naru API: 0:Infant, 6:Preschool, 8:Elementary, etc.
// But Naru uses specific codes. Let's check docs or use rough mapping.
// Actually Naru 'age' param uses codes like: 0(Infants), 6(Preschool), 8(Elementary), 14(Teens), 20(20s)...
// Valid API values: 0, 6, 8, 14, 20, 30, 40, 50, 60
function getApiAgeCode(internalAge: number): string {
    if (internalAge <= 2) return '0';  // Infants (0-5 in Naru terms usually covers this)
    if (internalAge <= 5) return '6';  // Preschool (6-7)
    if (internalAge <= 8) return '8';  // Elementary (8-13)
    return '8';
}
