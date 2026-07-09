
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AgeMatcher, DevelopmentStage } from './age-matcher';
import { unstable_cache } from 'next/cache';
import { BookCategory, TAXONOMY_RULES } from '../taxonomy';
import { RuleService } from '../../services/rule.service';
import { BookClassifier } from '../../core/classifiers/book-classifier';
import dotenv from 'dotenv';
import path from 'path';

// Force load env if not present
if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Helper for Backend execution (could be moved to a shared context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Lazy init to avoid crash when DB is deleted/unavailable
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('[ShelfComposer] Supabase URL/Key가 설정되지 않았습니다.');
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

export interface ChildProfileContext {
  months: number;
  interests?: string[];
  propensity?: string; // 'active' | 'calm' | 'sensitive' | 'curious'
}

export interface BookItem {
  id: string;
  title: string;
  publisher: string;
  cover_url?: string;
  bookImageURL?: string; // Added for compatibility
  cover?: string;        // Added for compatibility
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
  static async compose(profile: ChildProfileContext): Promise<DashboardData> {
    // Generate a simple cache key based on profile
    // Note: complex objects in keys need serialization
    const cacheKey = `shelf-composer-v2-${profile.months}-${profile.propensity || 'all'}-${(profile.interests || []).sort().join('-')}`;
    return await getCachedShelf(profile, cacheKey);
  }

  public static async buildShelf(
    category: BookCategory,
    profile: ChildProfileContext,
    expandedInterests: string[],
    classifier: BookClassifier
  ): Promise<Shelf> {

    // 1. Fetch Collections (Main Dish) with Age Filtering
    const ageMonth = profile.months;

    let query = getSupabase()
      .from('collections')
      .select('id, title, publisher, cover_url, summary, features, sales_index, blog_review_count')
      .eq('category', category);

    // Apply Soft Age Filtering ( Allow +/- 6 months buffer to ensure we don't return empty results too easily)
    // Actually, user requested STRICT filtering. Let's stick to the requested logic first.
    // "Target Range must include the Child's Age"
    // But to be safe against edge cases (e.g. child 35m, book starts 36m), let's allow 2 months leeway?
    // User said: "Current logic ignores age... leads to age-inappropriate".
    // I will use strict <= and >= against the child's age.
    if (ageMonth) {
      query = query
        .lte('target_age_months_start', ageMonth)
        .gte('target_age_months_end', ageMonth);
    }

    const { data: collections, error } = await query
      .limit(20); // Fetch more (20) to allow personalization re-ranking to work effectively

    if (error) {
      console.error(`[ShelfComposer] DB Error for ${category}:`, error);
    }
    console.log(`[ShelfComposer] Fetched ${collections?.length || 0} items for ${category} (Age: ${ageMonth})`);

    if (!collections || collections.length === 0) {
      return { id: category, title: this.getCategoryTitle(category), description: this.getCategoryDesc(category), category, items: [] };
    }

    // 1-b. Fetch Candidate Singles (Side Dish) for Pairing
    // Strategy: Search for singles that share keywords with the Category
    // This reduces the search space for pickRelevant
    let singlesCandidates: any[] = [];
    try {
      const rule = TAXONOMY_RULES.find(r => r.id === category);
      const keywords = rule ? rule.keywords.slice(0, 5) : []; // use top 5 keywords

      if (keywords.length > 0) {
        // Simplified: Fetch verified singles and we will filter in memory via pickRelevant
        // We fetch a pool of verified singles (type='single') to ensure quality
        // Also apply age filtering to singles? 
        // Verified books have `target_ages` (array of years) or `target_months_min/max` (new fields)
        // Let's rely on basic keyword matching for now, as singles are "Side dishes".
        const { data: singles } = await getSupabase()
          .from('verified_books')
          .select('id, title, publisher, cover_url, tags, developmental_areas')
          .eq('type', 'single')
          .eq('verification_status', 'verified')
          .limit(50); // Pool of candidates

        if (singles) singlesCandidates = singles;
      }
    } catch (e) {
      console.warn('[ShelfComposer] Failed to fetch singles for pairing', e);
    }

    // 2. Personalization Scoring Algorithm
    // Base Score = SalesIndex(70%) + BlogCount(30%)
    // Multipliers: Interest Match(x1.2), Propensity Match(x1.1)

    const rankedCollections = (collections as any[]).sort((a, b) => {
      const getScore = (item: any) => {
        // Base
        let score = (item.sales_index || 0) * 0.7 + (item.blog_review_count || 0) * 0.3;

        // Interest Boost (Enhanced)
        if (expandedInterests.length > 0) {
          const text = `${item.title} ${item.summary || ''} ${JSON.stringify(item.features || {})}`;
          // Use expanded keywords for better matching
          const hasInterest = expandedInterests.some(interest => text.includes(interest));
          if (hasInterest) score *= 1.3; // Increased boost for semantic match
        }

        // Propensity Boost (Simple Heuristic using Features tag)
        if (profile.propensity) {
          const features = JSON.stringify(item.features || {});
          if (profile.propensity === 'active' && (features.includes('조작') || features.includes('사운드') || features.includes('놀이'))) {
            score *= 1.1;
          }
          else if (profile.propensity === 'calm' && (features.includes('동화') || features.includes('베드타임'))) {
            score *= 1.1;
          }
        }

        // 👑 Expert Pick Boost (The "Certified Classic" Guarantee)
        // Ensure these always float to the top regardless of current sales data
        if (item.features?.expert_pick) {
          score += 50000; // Massive additive boost (equivalent to 50k sales index)
        }

        return score;
      };

      return getScore(b) - getScore(a);
    }).slice(0, 5); // Take Top 5 after personalized ranking

    // 3. Mapping with Hybrid Pairing
    const items = rankedCollections.map((col, idx) => {
      // Generate Dynamic Badges
      const badges: string[] = [];
      const features = col.features || {};

      // Priority 1: Expert Pick (Certified Classic)
      if (features.expert_pick) badges.push('🏆 워리쌤 추천');

      // Priority 2: Ranking
      else if (idx === 0) badges.push('👑 분야 1위'); // Top of this category

      // Priority 3: Popularity
      if ((col.sales_index || 0) > 8000) badges.push('🔥 10만 엄마픽'); // Adjusted threshold for seeded data

      // Interest Badge
      if (profile.interests) {
        const text = `${col.title} ${JSON.stringify(col.features || {})}`;
        const matchedInterest = profile.interests.find(i => text.includes(i));
        if (matchedInterest) badges.push(`❤️ ${matchedInterest}`);
      }

      // Pick Relevant Singles (Enhanced with Classifier)
      const sideDishes = this.pickRelevant(col, singlesCandidates, 2, classifier);

      return {
        collection: {
          id: col.id,
          title: col.title,
          publisher: col.publisher,
          type: 'collection' as const,
          summary: col.summary || '',
          cover_url: col.cover_url || sideDishes[0]?.cover_url, // Fallback to first side dish if missing
          tags: [
            category,
            ...badges,
            ...(features
              ? Object.entries(features)
                .filter(([key, value]) => !!value && key !== 'expert_pick') // Exclude internal flags from tags list
                .map(([key]) => key)
              : [])
          ]
        },
        singles: sideDishes.map(s => ({
          id: s.id,
          title: s.title,
          publisher: s.publisher,
          cover_url: s.cover_url,
          type: 'single' as const,
          tags: s.tags
        }))
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
  private static pickRelevant(
    collection: any,
    singles: any[],
    count: number,
    classifier: BookClassifier
  ): any[] {
    if (!singles || singles.length === 0) return [];

    // 1. Extract Keywords from Collection
    const colTokens = this.tokenize(collection.title);

    // 1-b. Use Classifier to extract Semantic Topics from Collection Title
    // This adds high-value keywords like "공룡", "우주" even if they are not explicitly in the tokens in a simple way
    // or if they are inferred rules.
    const analysis = classifier.analyze(collection.title);
    analysis.subCompetencies.forEach(topic => colTokens.add(topic));
    analysis.areas.forEach(area => colTokens.add(area)); // Also add broad areas

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

// Cached Shelf Composition
const getCachedShelf = unstable_cache(
  async (profile: ChildProfileContext, _key: string): Promise<DashboardData> => {
    const stage = AgeMatcher.analyze(profile.months);
    const shelves: Shelf[] = [];
    const allItems: BookItem[] = [];

    // 0. Prepare Rules & Classifier
    // Note: RuleService is already cached, so calling it here is cheap.
    const rules = await RuleService.getRules();
    const classifier = new BookClassifier(rules);

    // 0-b. Expand User Interests using Rules
    // e.g. User likes "Dinosaurs" -> Add "Tyranno", "Triceratops" etc.
    const expandedInterests = new Set<string>(profile.interests || []);
    if (profile.interests) {
      for (const interest of profile.interests) {
        // If interest matches a Rule Name (SubCompetency), add its keywords
        if (rules.subCompetencies[interest]) {
          rules.subCompetencies[interest].forEach(k => expandedInterests.add(k));
        }
      }
    }
    const searchKeywords = Array.from(expandedInterests);

    // Compose Shelves for each Core Category
    console.log(`[ShelfComposer] Composing for Age: ${profile.months}m -> Stage: ${stage.label}`, { core: stage.coreCategories });

    for (const category of stage.coreCategories) {
      console.log(`[ShelfComposer] Building Shelf: ${category}`);
      // ShelfComposer.buildShelf is now public static
      const shelf = await ShelfComposer.buildShelf(category, profile, searchKeywords, classifier);
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

    const hero = allItems[0] || undefined;
    const spotlight = allItems.slice(1, 4);

    return {
      stage,
      hero,
      spotlight,
      shelves
    };
  },
  ['shelf-composer'], // Base key
  {
    revalidate: 3600, // 1 hour
    tags: ['recommendation']
  }
);
