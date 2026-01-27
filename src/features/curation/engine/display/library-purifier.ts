
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { NaverCollector } from '../../collectors/naver-collector';

export interface PurifiedBook {
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  age_group: number;
  loan_count: number;
  buzz_count: number;
  age_density_ratio: number;
  is_purified: boolean;
}

export class LibraryPurifier {
  private AGE_KEYWORDS: Record<number, string[]> = {
    0: ['"돌아기"', '"1세"', '"2세"'],
    1: ['"돌아기"', '"2세"'],
    2: ['"3세"', '"2세"'],
    3: ['"3세"', '"4세"'],
    4: ['"4세"', '"5세"'],
    5: ['"5세"', '"6세"'],
    6: ['"6세"', '"7세"', '"예비초등"'],
    7: ['"초등"', '"1학년"'],
    8: ['"2학년"', '"3학년"']
  };

  /**
   * Purify library popular books for a specific age group
   */
  async purifyAgeGroup(ageGroup: number, limit = 50): Promise<PurifiedBook[]> {
    console.log(`[LibraryPurifier] Starting purification for age group: ${ageGroup}`);
    
    // 1. Fetch from Naru
    const naruAgeCode = this.mapToNaruAge(ageGroup);
    const naruResponse = await libraryApiClient.getPopularBooks({
      age: naruAgeCode,
      pageSize: limit
    });

    const candidateDocs = naruResponse.response?.docs || [];
    const results: PurifiedBook[] = [];

    for (const doc of candidateDocs) {
      const book = doc.doc;
      const title = book.bookname;
      const isbn13 = book.isbn13;

      // Skip common "ノイズ" (noise)
      if (this.isNoise(title)) continue;

      // 2. Check Buzz Density
      const totalBuzz = await NaverCollector.getBlogReviewCount(`"${title}"`);
      if (totalBuzz < 10) continue; // Not enough data to trust

      const ageKeywords = this.AGE_KEYWORDS[ageGroup] || [];
      const ageQuery = `"${title}" (${ageKeywords.join(' | ')})`;
      const ageBuzz = await NaverCollector.getBlogReviewCount(ageQuery);

      const densityRatio = ageBuzz / totalBuzz;
      
      // Decision Logic: 
      // If density ratio is very low, it's likely a mismatch for this age group (Hallucination)
      // Exception: 0-2y books are extremely specific, higher threshold needed.
      const threshold = ageGroup <= 2 ? 0.005 : 0.002; 
      const isPurified = densityRatio >= threshold;

      results.push({
        isbn13,
        title,
        author: book.authors,
        publisher: book.publisher,
        age_group: ageGroup,
        loan_count: parseInt(book.loan_count, 10),
        buzz_count: totalBuzz,
        age_density_ratio: densityRatio,
        is_purified: isPurified
      });

      // Throttle for API rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    return results;
  }

  private mapToNaruAge(age: number): string {
    if (age <= 5) return '0'; // 0-5y
    if (age <= 7) return '6'; // 6-7y
    return '8'; // 8-13y
  }

  private isNoise(title: string): boolean {
    const blackList = ['흔한남매', '만화', '코믹스', '에그박사', '브래드이발소'];
    return blackList.some(keyword => title.includes(keyword));
  }
}

export const libraryPurifier = new LibraryPurifier();
