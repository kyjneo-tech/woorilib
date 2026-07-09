import { AladinCollector, BookSpec } from '../collectors/aladin-collector';
import { NaverCollector } from '../collectors/naver-collector';
import { BookClassifier } from '../core/classifiers/book-classifier';
import { CrossValidator } from '../core/validators/cross-validator';
import { RuleService } from './rule.service';

export interface EnrichedBook extends BookSpec {
  cover_url_naver?: string | null;
  developmental_areas: string[];
  sub_competencies: string[];
  emotional_keywords: string[];
  target_months_min: number;
  target_months_max: number;
  energy_level: number;
  volume_number: number | null;
  ai_comment: string;
  verification_status: string;
  confidence_score: number;
  tags: string[];
}

/**
 * Book Enrichment Service
 * Unifies the pipeline of: External Fetch -> Cross Check -> Classification -> Validation
 */
export class BookEnrichmentService {
  private static classifier: BookClassifier | null = null;

  private static async getClassifier(): Promise<BookClassifier> {
    if (!this.classifier) {
      const rules = await RuleService.getRules();
      this.classifier = new BookClassifier(rules);
    }
    return this.classifier;
  }

  /**
   * Enriches a raw book with deep metadata and validation
   */
  static async enrich(book: BookSpec, options: { ageYears?: number } = {}): Promise<EnrichedBook> {
    const classifier = await this.getClassifier();

    // 1. Cross-Check with Naver (Description & Image)
    let finalDescription = book.description;
    let naverImage = null;
    
    try {
      const naverResults = await NaverCollector.searchBook(book.isbn13 || book.title, 1);
      if (naverResults && naverResults.length > 0) {
        const nBook = naverResults[0];
        if ((nBook.description?.length || 0) > (finalDescription?.length || 0)) {
          finalDescription = nBook.description.replace(/<[^>]*>?/gm, '');
        }
        naverImage = nBook.image;
      }
    } catch (e) {
      console.warn(`[Enrichment] Naver cross-check failed for ${book.title}`);
    }

    // 2. Classification
    const analysis = classifier.analyze(`${book.title} ${finalDescription}`, book.categoryName);

    // 3. Validation
    const validator = await CrossValidator.validateByBlog(book.title, book.author, options.ageYears || 0);
    
    let status = 'pending';
    if (validator.passed && validator.score >= 80) status = 'verified';
    else if (!validator.passed || validator.score < 60) status = 'rejected';

    return {
      ...book,
      description: finalDescription,
      cover_url_naver: naverImage,
      developmental_areas: analysis.areas,
      sub_competencies: analysis.subCompetencies,
      emotional_keywords: analysis.tags,
      target_months_min: analysis.age.min,
      target_months_max: analysis.age.max,
      energy_level: analysis.energyLevel,
      volume_number: analysis.volume,
      ai_comment: analysis.aiComment,
      verification_status: status,
      confidence_score: validator.score,
      tags: Array.from(new Set([...analysis.tags, ...analysis.subCompetencies]))
    };
  }

  /**
   * Batch enrichment for a list of books
   */
  static async enrichMany(books: BookSpec[], options: { ageYears?: number } = {}): Promise<EnrichedBook[]> {
    const results: EnrichedBook[] = [];
    for (const book of books) {
      const enriched = await this.enrich(book, options);
      results.push(enriched);
      // Small delay to prevent rate limiting if needed
      await new Promise(r => setTimeout(r, 200));
    }
    return results;
  }
}
