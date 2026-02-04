
import { NaverCollector } from '../../collectors/naver-collector';

export interface ValidationResult {
  passed: boolean;
  score: number;
  reason?: string;
  source: string;
  details?: any;
}

export class CrossValidator {
  /**
   * Validate a book using Naver Blog sentiment & keyword analysis
   */
  static async validateByBlog(bookTitle: string, bookAuthor: string, targetAge: number): Promise<ValidationResult> {
    try {
      // 1. Search Query Optimization
      // Use Author to disambiguate generic titles (e.g. "사과", "엄마")
      // Extract first author only (e.g. "안나 강, 크리스토퍼..." -> "안나 강")
      const primaryAuthor = bookAuthor.split(',')[0].split('(')[0].trim();
      
      // Query: "Title" "Author"
      const query = `"${bookTitle}" "${primaryAuthor}"`;
      const blogResults = await NaverCollector.searchBlog(query, 5);
      
      const reviewCount = blogResults.length;
      
      // If no reviews, we don't reject immediately (could be new), but score is low.
      if (reviewCount === 0) {
        return {
          passed: true,
          score: 50, // Neutral score
          reason: 'No reviews found (New or Rare)',
          source: 'naver_blog',
          details: { reviewCount: 0 }
        };
      }

      // 2. Scoring Logic
      let infantScore = 0;
      let elementaryScore = 0;
      
      const combinedText = blogResults.map(b => b.title + " " + b.description).join(" ");
      
      // Regex for keyword counting
      const infantKeywords = /3세|4세|두돌|세돌|아기|유아|그림책/g;
      const elementaryKeywords = /초등|1학년|2학년|학습만화|교과서|수험서/g;
      
      const infantMatches = combinedText.match(infantKeywords);
      const elementaryMatches = combinedText.match(elementaryKeywords);
      
      if (infantMatches) infantScore = infantMatches.length;
      if (elementaryMatches) elementaryScore = elementaryMatches.length;

      // 3. Decision Making
      // If looking for Infant (0-6)
      if (targetAge > 0 && targetAge <= 6) {
         // Reject if Elementary signal is strong AND Infant signal is weak
         if (elementaryScore > 3 && infantScore === 0) {
           return {
             passed: false,
             score: 0,
             reason: `Context Mismatch (Elem: ${elementaryScore} vs Infant: ${infantScore})`,
             source: 'naver_blog',
             details: { infantScore, elementaryScore }
           };
         }
      }

      // Passed
      return {
        passed: true,
        score: 80 + (infantScore * 2), // Boost score if keywords match
        source: 'naver_blog',
        details: { infantScore, elementaryScore, reviewCount }
      };

    } catch (error) {
      console.error('[CrossValidator] Error:', error);
      // Fail-safe: Pass but with warning
      return {
        passed: true,
        score: 50,
        reason: 'Validation Error (Skipped)',
        source: 'system'
      };
    }
  }
}
