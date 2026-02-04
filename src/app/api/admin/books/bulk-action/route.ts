
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BookClassifier } from '../../../../../features/curation/core/classifiers/book-classifier';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isbns, action, status } = body;

    if (!isbns || !Array.isArray(isbns)) {
      return NextResponse.json({ error: 'Invalid ISBNS' }, { status: 400 });
    }

    if (action === 'update-status') {
      await prisma.verified_books.updateMany({
        where: { isbn13: { in: isbns } },
        data: { verification_status: status, updated_at: new Date() }
      });
    } 
    
    else if (action === 're-audit') {
      // Individual processing for re-audit since logic depends on each book's text
      for (const isbn of isbns) {
        const book = await prisma.verified_books.findUnique({ where: { isbn13: isbn } });
        if (book) {
          const analysis = BookClassifier.analyze(`${book.title} ${book.description || ''}`, '');
          await prisma.verified_books.update({
            where: { isbn13: isbn },
            data: {
              developmental_areas: analysis.areas,
              target_months_min: analysis.age.min,
              target_months_max: analysis.age.max,
              energy_level: analysis.energyLevel,
              ai_comment: analysis.aiComment,
              updated_at: new Date()
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, count: isbns.length });
    
  } catch (error) {
    console.error('Bulk Action API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
