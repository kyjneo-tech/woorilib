
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

export interface BookRecommendation {
  isbn: string;
  title: string;
  cover: string;
  reason: string;
  tags: string[];
}

export interface WeeklyPlan {
  week: number;
  theme: string; // "흥미 유발", "지식 탐구", "심화 확장"
  description: string;
  books: BookRecommendation[];
}

export interface CurriculumResult {
  keyword: string;
  targetAge: number;
  roadmap: WeeklyPlan[];
}

export class CurriculumService {
  
  /**
   * Generate a 3-week reading roadmap for a specific child and keyword.
   * If books are missing, it triggers on-demand fetching.
   */
  static async generateRoadmap(keyword: string, ageMonths: number, propensity: string = 'active'): Promise<CurriculumResult> {
    const ageYears = Math.floor(ageMonths / 12);
    
    // 1. Check DB for existing books
    let books = await this.queryBooks(keyword, ageMonths);

    // 2. On-Demand Fetching if data is scarce
    if (books.length < 5) {
      console.log(`[Curriculum] Not enough books for "${keyword}" (Found: ${books.length}). Fetching...`);
      await this.fetchOnDemand(keyword, ageYears);
      books = await this.queryBooks(keyword, ageMonths); // Re-query
    }

    // 3. Roadmap Construction (The Algorithm)
    const roadmap: WeeklyPlan[] = [
      {
        week: 1,
        theme: '흥미 유발',
        description: `아이가 ${keyword}에 관심을 갖도록 재미있는 책으로 시작해요!`,
        books: this.selectBooksForWeek1(books, propensity)
      },
      {
        week: 2,
        theme: '지식 탐구',
        description: `${keyword}에 대해 더 깊이 알아볼까요?`,
        books: this.selectBooksForWeek2(books)
      },
      {
        week: 3,
        theme: '심화 확장',
        description: '워크북이나 연계 도서로 독후 활동을 해보세요.',
        books: this.selectBooksForWeek3(books)
      }
    ];

    return {
      keyword,
      targetAge: ageYears,
      roadmap
    };
  }

  // --- Helpers ---

  private static async queryBooks(keyword: string, ageMonths: number) {
    // Search by keyword in title/tags AND age range overlap
    // Using simple contains for now. Full text search is better but this works for prototype.
    return await prisma.verified_books.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { tags: { has: keyword } }
        ],
        target_months_min: { lte: ageMonths + 12 }, // Allow slightly older books
        target_months_max: { gte: ageMonths - 6 }   // Allow slightly younger books
      },
      take: 50
    });
  }

  private static async fetchOnDemand(keyword: string, ageYears: number) {
    try {
      // Execute the script. 
      // Note: In production, this should be a job queue (BullMQ), not exec.
      // But for this CLI Agent environment, exec is fine.
      const scriptPath = path.resolve(process.cwd(), 'scripts/curation/fetch-candidates.ts');
      const savePath = path.resolve(process.cwd(), 'scripts/curation/save-verified.ts');
      
      // Pass env explicitly if needed, though process.env usually inherits
      const cmd = `npx tsx ${scriptPath} --keyword="${keyword}" --age=${ageYears} --count=10 | npx tsx ${savePath}`;
      
      console.log(`[Curriculum] Executing: ${cmd}`);
      await execPromise(cmd);
      
    } catch (error) {
      console.error('[Curriculum] Fetch failed:', error);
      // We continue with whatever data we have
    }
  }

  // Week 1: High Energy (Sound, Flap, Board)
  private static selectBooksForWeek1(books: any[], propensity: string): BookRecommendation[] {
    // Filter: High Energy
    let candidates = books.filter(b => (b.energy_level || 5) >= 7);
    
    // If calm child, maybe lower energy threshold? No, Week 1 is about fun.
    // If not enough, fallback to boardbooks
    if (candidates.length < 2) {
        candidates = books.filter(b => b.tags.includes('boardbook') || b.tags.includes('soundbook'));
    }
    
    return this.mapToRecommendation(candidates.slice(0, 3), '흥미');
  }

  // Week 2: Medium Energy, Knowledge (Hardcover, Series)
  private static selectBooksForWeek2(books: any[]): BookRecommendation[] {
    const candidates = books.filter(b => 
      (b.energy_level || 5) >= 4 && (b.energy_level || 5) < 8 
      && !b.tags.includes('워크북')
    );
    return this.mapToRecommendation(candidates.slice(0, 3), '지식');
  }

  // Week 3: Expansion (Workbook, Hard)
  private static selectBooksForWeek3(books: any[]): BookRecommendation[] {
    // Priority: Workbooks
    let candidates = books.filter(b => b.type === 'workbook' || b.tags.includes('워크북'));
    
    // Fallback: Harder books (High age min)
    if (candidates.length < 2) {
       candidates = books.filter(b => (b.target_months_min || 0) > 36);
    }
    
    return this.mapToRecommendation(candidates.slice(0, 3), '확장');
  }

  private static mapToRecommendation(books: any[], context: string): BookRecommendation[] {
    return books.map(b => ({
      isbn: b.isbn13,
      title: b.title,
      cover: b.cover_url,
      tags: b.tags,
      // Dynamic Comment Generation
      reason: this.generateSmartComment(b, context)
    }));
  }

  private static generateSmartComment(book: any, context: string): string {
    // Use pre-generated AI comment if good, or build one
    if (book.ai_comment && book.ai_comment.length > 10) return book.ai_comment;

    const tags = book.emotional_keywords || [];
    const mainTag = tags.length > 0 ? tags[0] : '재미있는';
    
    if (context === '흥미') return `아이의 호기심을 자극하는 ${mainTag} 책이에요.`;
    if (context === '지식') return `${mainTag} 이야기를 통해 지식을 쌓을 수 있어요.`;
    return `${mainTag} 활동으로 독서를 확장해보세요.`;
  }
}
