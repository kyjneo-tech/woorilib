/**
 * Recommendation Service
 * Aggregates data from multiple sources for age-based recommendations
 */

import { Book } from '@/entities/book/model/types';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { aladinApiClient, AladinBook, ALADIN_CHILD_CATEGORIES } from '@/entities/book/api/aladin-api.client';
import { AGE_GROUPS, AgeGroupId } from '@/shared/config/constants';

export interface RecommendedBook extends Book {
  score: number;
  sources: ('library' | 'aladin' | 'curated')[];
  aladinPrice?: number;
  libraryPopularity?: number;
}

// Map age groups to library API age codes
const AGE_TO_LIBRARY_CODE: Record<AgeGroupId, string> = {
  '0-2': '0',  // 영아
  '3-4': '6',  // 유아
  '5-6': '6',  // 취학전 (유아)
  '7-8': '8',  // 초등1-2 (초등 저학년)
};

// Map age groups to Aladin categories
const AGE_TO_ALADIN_CATEGORY: Record<AgeGroupId, number> = {
  '0-2': ALADIN_CHILD_CATEGORIES.PICTURE_BOOK,
  '3-4': ALADIN_CHILD_CATEGORIES.PICTURE_BOOK,
  '5-6': ALADIN_CHILD_CATEGORIES.FAIRY_TALE,
  '7-8': ALADIN_CHILD_CATEGORIES.CREATIVE,
};

class RecommendationService {
  /**
   * Get age-appropriate book recommendations
   * Combines library popularity + Aladin bestsellers
   */
  async getRecommendations(params: {
    ageGroup: AgeGroupId;
    region?: string;
    limit?: number;
  }): Promise<RecommendedBook[]> {
    const { ageGroup, region, limit = 20 } = params;

    // Fetch from multiple sources in parallel
    const [libraryBooks, aladinBooks] = await Promise.all([
      this.fetchLibraryPopular(ageGroup, region),
      this.fetchAladinBestsellers(ageGroup),
    ]);

    // Merge and score books
    const merged = this.mergeAndScore(libraryBooks, aladinBooks);

    // Sort by score and return top N
    return merged
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get popular books from library API (hotTrend - more reliable)
   */
  private async fetchLibraryPopular(
    ageGroup: AgeGroupId,
    region?: string
  ): Promise<RecommendedBook[]> {
    try {
      // Use hotTrend API with a known-good date (API may not have recent data)
      const searchDt = '2025-12-01';

      const response = await libraryApiClient.getHotTrend(searchDt);

      // hotTrend returns: response.results[].result.docs[].doc
      const results = response?.response?.results || [];
      
      // Flatten all docs from all result dates
      const allBooks: RecommendedBook[] = [];
      
      results.forEach((resultItem: any) => {
        const docs = resultItem?.result?.docs || [];
        docs.forEach((docItem: any, index: number) => {
          const doc = docItem.doc;
          if (doc && doc.isbn13) {
            allBooks.push({
              isbn: doc.isbn13,
              title: doc.bookname,
              author: doc.authors,
              publisher: doc.publisher,
              publishYear: doc.publication_year,
              bookImageURL: doc.bookImageURL,
              className: doc.class_nm,
              loanCnt: doc.loan_count,
              ranking: doc.no || (allBooks.length + 1),
              score: 0,
              sources: ['library'] as const,
              libraryPopularity: doc.difference || 0,
            });
          }
        });
      });

      console.log(`[RecommendationService] Found ${allBooks.length} books from hotTrend`);
      return allBooks.slice(0, 20);
    } catch (error) {
      console.error('[RecommendationService] Library fetch error:', error);
      return [];
    }
  }


  /**
   * Get bestsellers from Aladin API
   */
  private async fetchAladinBestsellers(ageGroup: AgeGroupId): Promise<RecommendedBook[]> {
    try {
      const categoryId = AGE_TO_ALADIN_CATEGORY[ageGroup];
      const books = await aladinApiClient.getBestseller({
        categoryId,
        maxResults: 30,
      });

      return books.map((book, index) => ({
        isbn: book.isbn13,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        publishYear: book.pubDate?.split('-')[0],
        bookImageURL: book.cover,
        className: book.categoryName,
        ranking: index + 1,
        // Scoring
        score: 0,
        sources: ['aladin'] as const,
        aladinPrice: book.priceSales,
      }));
    } catch (error) {
      console.error('[RecommendationService] Aladin fetch error:', error);
      return [];
    }
  }

  /**
   * Merge books from multiple sources and calculate scores
   */
  private mergeAndScore(
    libraryBooks: RecommendedBook[],
    aladinBooks: RecommendedBook[]
  ): RecommendedBook[] {
    const bookMap = new Map<string, RecommendedBook>();

    // Process library books (40% weight)
    libraryBooks.forEach((book, index) => {
      const libraryScore = ((30 - index) / 30) * 40; // Top book gets 40 points
      
      bookMap.set(book.isbn, {
        ...book,
        score: libraryScore,
        sources: ['library'],
      });
    });

    // Process Aladin books (30% weight)
    aladinBooks.forEach((book, index) => {
      const aladinScore = ((30 - index) / 30) * 30; // Top book gets 30 points
      
      const existing = bookMap.get(book.isbn);
      
      if (existing) {
        // Book exists in both sources - merge and boost score
        existing.score += aladinScore + 10; // Bonus for appearing in both
        existing.sources = [...existing.sources, 'aladin'];
        existing.aladinPrice = book.aladinPrice;
        existing.bookImageURL = existing.bookImageURL || book.bookImageURL;
      } else {
        bookMap.set(book.isbn, {
          ...book,
          score: aladinScore,
          sources: ['aladin'],
        });
      }
    });

    return Array.from(bookMap.values());
  }

  /**
   * Get "peer-reading" books (what kids same age are reading)
   */
  async getPeerReading(params: {
    ageGroup: AgeGroupId;
    region?: string;
    limit?: number;
  }): Promise<RecommendedBook[]> {
    // For now, this is just library popular books
    // In future, could add more social signals
    return this.fetchLibraryPopular(params.ageGroup, params.region);
  }
}

export const recommendationService = new RecommendationService();
