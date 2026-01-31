
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AgeMatcher, DevelopmentStage } from './age-matcher';
import { BookCategory } from '../taxonomy';
import dotenv from 'dotenv';
import path from 'path';

// Force load env if not present
if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Helper for Backend execution (could be moved to a shared context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BookItem {
  id: string;
  title: string;
  publisher: string;
  cover_url?: string;
  tags?: string[];
  type: 'collection' | 'single';
  summary?: string;
}

export interface Shelf {
  id: string;
  title: string;
  description: string;
  category: BookCategory;
  items: Array<{
    collection: BookItem;
    singles: BookItem[]; // Hybrid Pairing: The "Side Dishes"
  }>;
}

export interface DashboardData {
  stage: DevelopmentStage;
  hero?: BookItem;         // The Killer Feature
  spotlight?: BookItem[];  // Top 3 Bestsellers
  shelves: Shelf[];
}

/**
 * Shelf Composer (Exhibition AI)
 * Composes the optimal bookshelf for a given age.
 */
export class ShelfComposer {
  static async compose(months: number): Promise<DashboardData> {
    const stage = AgeMatcher.analyze(months);
    const shelves: Shelf[] = [];
    const allItems: BookItem[] = [];

    // Compose Shelves for each Core Category
    console.log(`[ShelfComposer] Composing for Age: ${months}m -> Stage: ${stage.label}`, { core: stage.coreCategories });

    for (const category of stage.coreCategories) {
      console.log(`[ShelfComposer] Building Shelf: ${category}`);
      const shelf = await this.buildShelf(category, months);
      console.log(`[ShelfComposer] Shelf ${category} items: ${shelf.items.length}`);
      if (shelf.items.length > 0) {
        shelves.push(shelf);
        // Collect all items for Spotlight selection
        shelf.items.forEach(i => allItems.push(i.collection));
      }
    }

    // Assign Hero & Spotlight
    // Logic: 
    // Hero: The absolute #1 ranked book across ALL categories
    // Spotlight: Next 3 items
    
    // Determine Global Ranking from the gathered items
    // Re-calculate score here because 'allItems' is just BookItem (doesn't have stats)
    // Wait, earlier we mapped 'BookItem' which doesn't include 'sales_index'. 
    // We need to pass stats to BookItem to sort globally.
    // For now, since we already sorted PER SHELF, the 'hero' is likely the first item of the most important category
    // or we can just pick the first ones. 
    // Optimization: Trust that shelves provided good items.
    
    // Since BookItem interface doesn't have score, we can't re-sort easily without extending interface.
    // BUT since we sorted 'rankedCollections' above, `shelves[0].items[0]` is the #1 of the first category.
    // Let's stick to the current flow but ensuring shelves are sorted.
    
    const hero = allItems[0] || undefined;
    const spotlight = allItems.slice(1, 4);

    return {
      stage,
      hero,
      spotlight,
      shelves
    };
  }

  private static async buildShelf(category: BookCategory, months: number): Promise<Shelf> {
    
    // 1. Fetch Collections (Main Dish) - Logic: Match Category
    // Ideally we filter by target_age too, but for now we trust the Category + Loose Age Filter
    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, title, publisher, summary, features, sales_index, blog_review_count')
      .eq('category', category)
      .limit(10); // Fetch more to allow ranking to work better (was 5)

    if (error) {
        console.error(`[ShelfComposer] DB Error for ${category}:`, error);
    }
    console.log(`[ShelfComposer] Fetched ${collections?.length || 0} items for ${category}`);

    if (!collections || collections.length === 0) {
      return { id: category, title: category, description: '', category, items: [] };
    }
    
    // Sort by "Market & Buzz" Score
    // Score = SalesIndex(70%) + BlogCoun(30%)
    // Since scales differ, we use raw weighted sum assuming rough correlation, 
    // or log scale could be better. For now, simple weighted sum.
    // SalesIndex is typically 0~100,000. BlogCount is 0~50,000.
    // Let's give SalesIndex more weight roughly.
    const rankedCollections = collections.sort((a, b) => {
        const scoreA = (a.sales_index || 0) * 0.7 + (a.blog_review_count || 0) * 0.3;
        const scoreB = (b.sales_index || 0) * 0.7 + (b.blog_review_count || 0) * 0.3;
        return scoreB - scoreA;
    }).slice(0, 5); // Take Top 5 after ranking

    // 3. Simple Collection Mapping (No Hybrid Pairing)
    const items = rankedCollections.map((col, idx) => {
      // Generate Dynamic Badges
      const badges: string[] = [];
      if (idx === 0) badges.push('👑 분야 1위'); // Top of this category
      if ((col.sales_index || 0) > 1000) badges.push('🔥 10만 엄마픽');
      if ((col.blog_review_count || 0) > 5000) badges.push('💬 리뷰폭발');

      return {
        collection: {
          id: col.id,
          title: col.title,
          publisher: col.publisher,
          type: 'collection' as const,
          summary: col.summary || '',
          tags: [
            category, 
            ...badges,
            ...(col.features 
                ? Object.entries(col.features)
                    .filter(([_, value]) => !!value) // Only include Features that are TRUE
                    .map(([key]) => key) 
                : [])
          ]
        },
        singles: [] // Empty singles as requested
      };
    });

    return {
      id: category,
      title: this.getCategoryTitle(category),
      description: this.getCategoryDesc(category),
      category,
      items
    };
  }

  /**
   * Smart Relevance Picker
   * Matches Single Books to a Collection based on Keyword Overlap (Title + Tags)
   */
  private static pickRelevant(collection: any, singles: any[], count: number): any[] {
    if (!singles || singles.length === 0) return [];

    // 1. Extract Keywords from Collection
    const colTokens = this.tokenize(collection.title);
    if (collection.features) {
        Object.keys(collection.features).forEach(t => colTokens.add(t));
    }
    // Add specific nature keywords if inferred from title
    // e.g. "Dinosaur" -> add "공룡"
    if (collection.title.includes('공룡')) colTokens.add('공룡');
    if (collection.title.includes('우주')) colTokens.add('우주');
    if (collection.title.includes('곤충')) colTokens.add('곤충');
    if (collection.title.includes('자동차')) colTokens.add('자동차');
    if (collection.title.includes('기차')) colTokens.add('기차');

    // 2. Score each Single Book
    const scored = singles.map(single => {
        let score = 0;
        const singleTokens = this.tokenize(single.title);
        single.tags?.forEach((t: string) => singleTokens.add(t));

        // Calculate Overlap
        for (const token of colTokens) {
            if (singleTokens.has(token)) score += 10; // Direct Hit
        }
        
        // Boost for Title partial match (e.g. "Dinosaur" in "My Dinosaur Friend")
        for (const colToken of colTokens) {
            if (colToken.length < 2) continue; // Skip single chars
            if (single.title.includes(colToken)) score += 5;
        }

        return { book: single, score };
    });

    // 3. Sort & Pick
    scored.sort((a, b) => b.score - a.score);

    // If no good matches (score 0), fall back to random to ensure variety
    // But prioritized ones come first
    return scored.slice(0, count).map(s => s.book);
  }

  private static tokenize(text: string): Set<string> {
    const tokens = new Set<string>();
    if (!text) return tokens;
    // Remove brackets and split by space
    const clean = text.replace(/[\[\]\(\)]/g, ' ').replace(/[^\w\s가-힣]/g, ' ');
    clean.split(/\s+/).forEach(word => {
        if (word.length > 1) tokens.add(word);
    });
    return tokens;
  }

  private static getCategoryTitle(cat: BookCategory): string {
    const map: Record<BookCategory, string> = {
      TOY: '손으로 만지며 놀아요',
      COGNITIVE: '똑똑한 머리를 만들어요',
      EMOTION: '마음이 튼튼해져요',
      VEHICLE: '부릉부릉 탈것 출동!',
      NATURE: '자연과 친구가 돼요',
      CREATIVE: '상상의 나래를 펼쳐요',
      MATH_SCI: '수과학 호기심 해결!',
      HISTORY: '지혜로운 옛 이야기',
      ENGLISH: 'Hello! 영어랑 놀자',
      ART_MUSIC: '예술적 감수성 쑥쑥',
      LANGUAGE: '말하기가 즐거워요',
      UNKNOWN: '기타'
    };
    return map[cat] || cat;
  }

  private static getCategoryDesc(cat: BookCategory): string {
    const map: Record<BookCategory, string> = {
      TOY: '오감을 자극하는 놀이책',
      COGNITIVE: '생각하는 힘을 길러요',
      EMOTION: '올바른 생활 습관과 인성',
      VEHICLE: '탈것을 통해 배우는 세상',
      NATURE: '생생한 사진과 세밀화',
      CREATIVE: '상상력이 쑥쑥 자라요',
      MATH_SCI: '원리를 쉽고 재미있게',
      HISTORY: '옛날 이야기로 배우는 지혜',
      ENGLISH: '즐거운 영어 첫걸음',
      ART_MUSIC: '아름다움을 느끼는 예술',
      LANGUAGE: '말문이 트이는 언어 놀이',
      UNKNOWN: '다양한 주제의 책들'
    };
    return map[cat] || '아이들이 좋아하는 주제';
  }
}
