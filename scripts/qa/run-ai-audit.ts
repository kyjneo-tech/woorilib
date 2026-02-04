import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.error('🔍 AI 검수를 위한 샘플 데이터를 추출 중입니다 (20권)...');

  // 각 연령대별로 최신 데이터 5권씩 추출하여 다양성 확보
  const [infant, toddler, preschool, elementary] = await Promise.all([
    prisma.verified_books.findMany({ where: { target_months_min: { lte: 24 } }, take: 5, orderBy: { created_at: 'desc' } }),
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 24, lte: 48 } }, take: 5, orderBy: { created_at: 'desc' } }),
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 48, lte: 84 } }, take: 5, orderBy: { created_at: 'desc' } }),
    prisma.verified_books.findMany({ where: { target_months_min: { gt: 84 } }, take: 5, orderBy: { created_at: 'desc' } }),
  ]);

  const allSamples = [...infant, ...toddler, ...preschool, ...elementary];

  if (allSamples.length === 0) {
    console.log('[] ');
    console.error('⚠️ DB에 데이터가 없습니다. 먼저 수집을 진행하세요.');
    return;
  }

  // JSON 데이터 출력 (AI가 이 출력을 읽어서 분석함)
  console.log(JSON.stringify(allSamples, null, 2));
  console.error(`\n✅ 추출 완료: 총 ${allSamples.length}권의 샘플이 준비되었습니다.`);
}

main().finally(() => prisma.$disconnect());
