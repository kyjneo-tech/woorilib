import { NextRequest, NextResponse } from "next/server";
import { libraryApiClient } from "@/entities/book/api/library-api.client";
import { MetadataVerificationService } from "@/features/curation/lib/metadata-verification.service";

// Age Range Mapping (Granular Targeting)
function getAgeRange(internalAge: number): { from_age: number, to_age: number } {
  // Baby (0-2)
  if (internalAge <= 2) return { from_age: 0, to_age: 2 };
  // Toddler (3-4)
  if (internalAge === 3) return { from_age: 3, to_age: 4 };
  // Preschool (5-6)
  if (internalAge === 5) return { from_age: 5, to_age: 6 };
  // School (7-8)
  if (internalAge >= 7) return { from_age: 7, to_age: 8 }; // Close target
  
  return { from_age: 5, to_age: 6 }; // Default
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const age = parseInt(searchParams.get("age") || "0", 10);
  const regionCode = searchParams.get("region") || "11"; 
  
  // Parse Region
  let regionParam = regionCode.substring(0, 2);
  let dtlParam = regionCode.length > 2 ? regionCode : undefined;

  const { from_age, to_age } = getAgeRange(age);

  try {
    // 1. Real-time Fetch from Naru (Targeted by Age)
    const response = await libraryApiClient.getPopularBooks({
      from_age,
      to_age,
      region: regionParam,
      dtl_region: dtlParam,
      pageSize: 30 // Fetch enough candidates to survive filtering
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

    // 2. Metadata Verification (Aladin Cross-Check)
    // Run in parallel for performance
    const verificationResults = await Promise.all(
      rawBooks.map(async (book: any) => {
        const verify = await MetadataVerificationService.verify(book.isbn13);
        return { ...book, ...verify };
      })
    );

    // 3. Strict Safety Filter
    const safeBooks = verificationResults.filter((b: any) => b.isSafe);

    // 4. Return Top 10
    const books = safeBooks.slice(0, 10).map((b: any) => {
      // Tags generation
      const tags = ["우리동네인기", `${from_age}~${to_age}세`];
      if (b.ageGrade === 'TODDLER') tags.push('유아추천');
      if (b.ageGrade === 'SCHOOL') tags.push('초등추천');

      return {
        collection: {
          id: b.isbn13,
          title: b.title || "No Title",
          publisher: b.publisher || "No Publisher",
          summary: `[${from_age}~${to_age}세 Top] ${b.categoryPath?.split('>').pop() || '인기도서'}`,
          features: { saypen: false }
        },
        singles: [],
        tags: tags,
        is_new: false,
        match_score: 95, // High confidence due to strict filtering
        is_library_book: true,
        region: regionCode
      };
    });

    return NextResponse.json({ 
      books,
      meta: {
        totalFetched: rawBooks.length,
        passedSafety: safeBooks.length,
        ageTarget: `${from_age}~${to_age}`
      }
    });

  } catch (error) {
    console.error('[LibraryCuration] Error:', error);
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}
