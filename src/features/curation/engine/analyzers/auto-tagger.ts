
import { TAXONOMY_RULES, BookCategory } from '../taxonomy';

export interface AnalysisResult {
  primaryCategory: BookCategory;
  tags: string[];
}

/**
 * Auto Tagger
 * Deterministically assigns categories and tags based on text analysis.
 */
export class AutoTagger {
  static analyze(text: string): AnalysisResult {
    const content = text.toLowerCase();
    
    let bestMatch: BookCategory = 'UNKNOWN';
    let maxScore = 0;
    const detectedTags: string[] = [];

    // 1. Category Matching
    for (const rule of TAXONOMY_RULES) {
      let score = 0;
      for (const keyword of rule.keywords) {
        if (content.includes(keyword)) {
          score++;
          detectedTags.push(keyword); // Add keyword as a tag too
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = rule.id;
      }
    }

    // Default to CREATIVE if no specific category matched but it's a book
    if (bestMatch === 'UNKNOWN' && maxScore === 0) {
      // Very naive fallback, usually for picture books
      bestMatch = 'CREATIVE'; 
    }

    return {
      primaryCategory: bestMatch,
      tags: [...new Set(detectedTags)] // Deduplicate tags
    };
  }
}
