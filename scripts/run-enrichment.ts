import { PrismaClient } from '@prisma/client';
import { AutoTagger } from '../src/features/curation/engine/analyzers/auto-tagger';
import { DeepAnalyzer } from '../src/features/curation/engine/analyzers/deep-analyzer';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function enrichData() {
  console.log('[ENRICH] 🐾 Coco is warming up the analysis factory...');

  try {
    // 1. Fetch pending books
    const books = await prisma.verified_books.findMany({
      where: { verification_status: 'pending' },
      take: 100 
    });

    if (books.length === 0) {
      console.log('[ENRICH] 💤 No pending books. Coco is happy!');
      return;
    }

    console.log(`\n[ENRICH] 📖 Munching on ${books.length} books...`);

    for (const book of books) {
      console.log(`[ENRICH] 🔍 Analyzing: "${book.title}"`);
      
      const fullText = `${book.title} ${book.description || ''}`;
      const basicResult = AutoTagger.analyze(fullText);
      
      let deepResult = await DeepAnalyzer.analyze({
        title: book.title,
        author: book.author || '',
        description: book.description || ''
      });

      if (!deepResult) {
        deepResult = {
          developmental_areas: basicResult.tags.length > 0 ? [basicResult.primaryCategory] : ['인지'],
          sub_competencies: ['기본정제'],
          emotional_keywords: ['일반'],
          curation_points: ['코코 자동 분석 도서'],
          energy_level: 5,
          ai_comment: '코코 에이전트가 기본 규칙으로 분석한 책입니다. 멍! 🐾'
        };
      }

      await prisma.verified_books.update({
        where: { id: book.id },
        data: {
          developmental_areas: deepResult.developmental_areas,
          sub_competencies: deepResult.sub_competencies,
          emotional_keywords: deepResult.emotional_keywords,
          curation_points: deepResult.curation_points,
          energy_level: deepResult.energy_level,
          ai_comment: deepResult.ai_comment,
          tags: { set: [...new Set([...(book.tags || []), ...basicResult.tags, basicResult.primaryCategory])] },
          verification_status: 'verified',
          confidence_score: 70
        }
      });
      process.stdout.write('🐾');
    }

    console.log('\n\n[ENRICH] ✨ Success! 100 books updated.');
  } catch (error: any) {
    console.error('\n[ENRICH] 💥 ERROR:', error.message);
  }
}

enrichData().finally(() => prisma.$disconnect());