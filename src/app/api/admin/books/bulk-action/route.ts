
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { BookClassifier } from '../../../../../features/curation/core/classifiers/book-classifier';
import { RuleService } from '../../../../../features/curation/services/rule.service';
import { requireAdmin, AuthError } from '@/shared/lib/auth-server';
import { z } from 'zod';

const BulkActionSchema = z.object({
  isbns: z.array(z.string()),
  action: z.enum(['update-status', 're-audit', 'delete']),
  status: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validation = BulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid Request', details: validation.error.format() }, { status: 400 });
    }

    const { isbns, action, status } = validation.data;

    if (action === 'update-status') {
      if (!status) {
        return NextResponse.json({ error: 'Status is required for update-status action' }, { status: 400 });
      }
      await prisma.verified_books.updateMany({
        where: { isbn13: { in: isbns } },
        data: { verification_status: status, updated_at: new Date() }
      });
    }

    else if (action === 're-audit') {
      // Individual processing for re-audit since logic depends on each book's text
      // Ideally run in parallel or transaction, but logic is complex.
      // Keeping sequence for safety as per original code, but could be Promise.all

      const rules = await RuleService.getRules();
      const classifier = new BookClassifier(rules);

      const results = await Promise.allSettled(isbns.map(async (isbn) => {
        const book = await prisma.verified_books.findUnique({ where: { isbn13: isbn } });
        if (book) {
          const analysis = classifier.analyze(`${book.title} ${book.description || ''}`, '');
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
      }));
    }

    else if (action === 'delete') {
      await prisma.verified_books.deleteMany({
        where: { isbn13: { in: isbns } }
      });
    }

    return NextResponse.json({ success: true, count: isbns.length });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Bulk Action API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
