import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BookClassifier } from '../../../../../../features/curation/core/classifiers/book-classifier';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ isbn: string }> }) {
  try {
    const { isbn } = await params;

    // 1. Get current book data
    const book = await prisma.verified_books.findUnique({
      where: { isbn13: isbn }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 2. Re-run Classification Logic
    const fullText = `${book.title} ${book.description || ''}`;
    const analysis = BookClassifier.analyze(fullText, book.publisher || ''); 

    // 3. Update DB
    const updatedBook = await prisma.verified_books.update({
      where: { isbn13: isbn },
      data: {
        developmental_areas: analysis.areas,
        sub_competencies: analysis.subCompetencies,
        emotional_keywords: analysis.tags,
        target_months_min: analysis.age.min,
        target_months_max: analysis.age.max,
        energy_level: analysis.energyLevel,
        volume_number: analysis.volume,
        ai_comment: analysis.aiComment,
        updated_at: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updatedBook });
    
  } catch (error) {
    console.error('Re-audit API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}