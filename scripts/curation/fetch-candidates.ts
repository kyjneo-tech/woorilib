import { AladinCollector } from '../../src/features/curation/collectors/aladin-collector';
import { CrossValidator } from '../../src/features/curation/core/validators/cross-validator';
import { NaverCollector } from '../../src/features/curation/collectors/naver-collector';
import { BookClassifier } from '../../src/features/curation/core/classifiers/book-classifier';
import { ALADIN_CATEGORIES } from '../../src/shared/config/constants';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const keyword = args.find(arg => arg.startsWith('--keyword='))?.split('=')[1] || '육아';
  const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '5');
  const ageYears = parseInt(args.find(arg => arg.startsWith('--age='))?.split('=')[1] || '0');
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // 1. Fetch from Aladin (Primary)
    let books = await AladinCollector.search(keyword, Math.min(count, 50));
    if (!books || books.length === 0) { console.log('[]'); return; }

    const processedBooks = [];

    for (const book of books) {
      await sleep(200); 

      // --- [Consensus Logic] Cross-Check with Naver ---
      let finalDescription = book.description;
      let naverImage = null;
      
      try {
        const naverResults = await NaverCollector.searchBook(book.isbn13 || book.title, 1);
        if (naverResults && naverResults.length > 0) {
          const nBook = naverResults[0];
          // 1. Conflict Resolution: Use longer description
          if ((nBook.description?.length || 0) > (finalDescription?.length || 0)) {
            finalDescription = nBook.description.replace(/<[^>]*>?/gm, '');
          }
          naverImage = nBook.image;
        }
      } catch (e) { /* Fallback to Aladin only */ }

      // 2. Intelligence V3: Granular Classification
      const analysis = BookClassifier.analyze(`${book.title} ${finalDescription}`, book.categoryName);

      // 3. Status Decision
      const validator = await CrossValidator.validateByBlog(book.title, book.author, ageYears);
      let status = 'pending';
      if (validator.passed && validator.score >= 80) status = 'verified';
      else if (!validator.passed || validator.score < 60) status = 'rejected';

      processedBooks.push({
        ...book,
        description: finalDescription,
        cover_url_naver: naverImage,
        developmental_areas: analysis.areas,
        sub_competencies: analysis.subCompetencies, // New: 30+ skills
        emotional_keywords: analysis.tags,
        target_months_min: analysis.age.min,
        target_months_max: analysis.age.max,
        energy_level: analysis.energyLevel,
        volume_number: analysis.volume,
        ai_comment: analysis.aiComment,
        verification_status: status,
        confidence_score: validator.score,
        tags: Array.from(new Set([...analysis.tags, ...analysis.subCompetencies]))
      });

      console.error(`   🧠 [${status.toUpperCase()}] ${book.title} | Skills: ${analysis.subCompetencies.length}`);
    }

    console.log(JSON.stringify(processedBooks, null, 2));

  } catch (error) {
    console.error('Fetch Candidates Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();