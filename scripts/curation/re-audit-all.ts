import { PrismaClient } from '@prisma/client';
import { BookClassifier } from '../../src/features/curation/core/classifiers/book-classifier';
import { CrossValidator } from '../../src/features/curation/core/validators/cross-validator';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Global Re-Audit of all books in DB...');

  // 1. Fetch all books
  const books = await prisma.verified_books.findMany();
  console.log(`📊 Found ${books.length} books to re-audit.`);

  let count = 0;
  for (const book of books) {
    try {
      // 2. Re-calculate Classification (Fast, no API)
      const fullText = `${book.title} ${book.description || ''}`;
      const analysis = BookClassifier.analyze(fullText, book.publisher || '');

      // 3. Since we want to re-calculate the SCORE too, 
      // but CrossValidator needs API (Naver), we will use existing score if available,
      // OR we can do a soft-re-score based on analysis result.
      // For now, let's keep the confidence_score but adjust status based on NEW thresholds.
      
      let newStatus = 'pending';
      const score = book.confidence_score;

      if (score >= 80) newStatus = 'verified';
      else if (score < 60) newStatus = 'rejected';

      // 4. Update DB
      await prisma.verified_books.update({
        where: { isbn13: book.isbn13 },
        data: {
          developmental_areas: analysis.areas,
          sub_competencies: analysis.subCompetencies, // New: 30+ granular skills
          target_months_min: analysis.age.min,
          target_months_max: analysis.age.max,
          energy_level: analysis.energyLevel,
          ai_comment: analysis.aiComment,
          tags: Array.from(new Set([...analysis.tags, ...analysis.subCompetencies])), // Sync tags
          verification_status: newStatus,
          updated_at: new Date()
        }
      });

      count++;
      if (count % 50 === 0) console.log(`   ✅ Processed ${count}/${books.length}...`);
      
    } catch (e) {
      console.error(`   ❌ Failed to re-audit: ${book.title}`, e);
    }
  }

  console.log(`
🎉 Global Re-Audit Completed! ${count} books updated.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
