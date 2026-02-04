
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get diverse samples (5 from each major age group)
  const samples = await Promise.all([
    // 0~24m
    prisma.verified_books.findMany({ where: { target_months_min: { lte: 24 } }, take: 5, orderBy: { created_at: 'desc' } }),
    // 24~48m
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 24, lte: 48 } }, take: 5, orderBy: { created_at: 'desc' } }),
    // 48~84m
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 48, lte: 84 } }, take: 5, orderBy: { created_at: 'desc' } }),
    // 84m+ (Elementary)
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 84 } }, take: 5, orderBy: { created_at: 'desc' } }),
  ]);

  const flatSamples = samples.flat();

  console.log(JSON.stringify(flatSamples, null, 2));
}

main().finally(() => prisma.$disconnect());
