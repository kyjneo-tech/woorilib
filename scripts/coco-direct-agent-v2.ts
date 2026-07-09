
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

class AdvancedAutoAnalyzerV2 {
  static analyze(title: string, description: string = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    // 1. 성인/전문 서적 필터 (Negative Filter) 🐾
    // 아이들 책이 아닌 것을 먼저 걸러냅니다.
    const adultKeywords = [
      '인적성', '공사', '공무원', '자격증', '취업', '토익', 'toeic', 
      '실무', '전공', '수험서', '기출문제', '산업기사', '기사시험', 
      '화력발전', '제어공학', '부동산', '주식투자', '성인', '대학교'
    ];
    
    if (this.matches(text, adultKeywords)) {
      return { is_adult: true };
    }

    // 2. 아동 도서 여부 재확인 (Positive Filter)
    // 최소한의 아동 도서 징후가 있는지 확인 (그림책, 전집, 세, 유아 등)
    const kidsContextKeywords = ['그림책', '동화', '유아', '아동', '세', '개월', '전집', '사운드북', '팝업북', '토이북', '어린이'];
    const hasKidsContext = this.matches(text, kidsContextKeywords);

    // 3. 발달 영역 분석 (Developmental Areas)
    const areas: string[] = [];
    if (this.matches(text, ['단어', '말놀이', '한글', '언어', '이야기', '대화', '표현'])) areas.push('언어');
    if (this.matches(text, ['감정', '마음', '친구', '사랑', '배려', '공감', '사회', '인성'])) areas.push('정서', '사회성');
    if (this.matches(text, ['수학', '과학', '숫자', '도형', '공간', '비교', '분류', '색깔', '모양'])) areas.push('인지');
    if (this.matches(text, ['자연', '동물', '식물', '곤충', '공룡', '바다', '우주'])) areas.push('자연탐구');
    
    // 아동 컨텍스트가 없는데 인지만 걸린 경우 위험군으로 분류
    if (!hasKidsContext && areas.length === 1 && areas[0] === '인지') {
        return { is_suspicious: true };
    }

    if (areas.length === 0) areas.push('창의');

    return {
      is_adult: false,
      is_suspicious: false,
      developmental_areas: [...new Set(areas)],
      sub_competencies: this.extractSubComps(text),
      emotional_keywords: this.extractEmotions(text),
      energy_level: this.extractEnergy(text),
      curation_points: [`'${title}'를 통한 맞춤형 발달 자극`],
      ai_comment: `우리 아이의 성장을 돕는 '${title}' 책이에요. 🐾`
    };
  }

  private static extractSubComps(text: string) {
    const comps = [];
    if (this.matches(text, ['어휘', '낱말'])) comps.push('어휘력');
    if (this.matches(text, ['마음', '조절'])) comps.push('정서조절');
    if (this.matches(text, ['창의', '상상'])) comps.push('창의력');
    return comps.length > 0 ? comps : ['기본발달'];
  }

  private static extractEmotions(text: string) {
    if (this.matches(text, ['따뜻', '사랑'])) return ['따뜻한'];
    if (this.matches(text, ['호기심', '궁금'])) return ['호기심'];
    return ['일반'];
  }

  private static extractEnergy(text: string) {
    if (this.matches(text, ['잠', '잘자'])) return 2;
    if (this.matches(text, ['신나', '활발'])) return 8;
    return 5;
  }

  private static matches(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }
}

async function fixIncorrectAnalysis() {
  console.log('🐾 [COCO] Logic Updated. Re-analyzing to filter out adult books...');
  
  let fixedCount = 0;
  let rejectedCount = 0;
  
  // 이미 verified된 도서들 전체를 대상으로 재검사
  const books = await prisma.verified_books.findMany({
    where: { verification_status: 'verified' }
  });

  console.log(`🔍 Checking ${books.length} verified books...`);

  for (const book of books) {
    const analysis = AdvancedAutoAnalyzerV2.analyze(book.title, book.description || '');

    if (analysis.is_adult || analysis.is_suspicious) {
      // 성인 서적이나 의심스러운 경우 'rejected' 또는 'needs_review'로 변경
      await prisma.verified_books.update({
        where: { id: book.id },
        data: {
          verification_status: analysis.is_adult ? 'rejected' : 'needs_review',
          ai_comment: analysis.is_adult ? '성인용/전문 서적으로 판단되어 제외되었습니다.' : '아동 도서 여부 재확인이 필요합니다.',
          developmental_areas: [],
          sub_competencies: [],
          tags: { set: [] }
        }
      });
      rejectedCount++;
      process.stdout.write('❌');
    }
  }

  console.log(`

✨ [COCO] Cleanup Finished!`);
  console.log(`✅ Fixed: ${fixedCount} (No change needed)`);
  console.log(`🚫 Rejected/Flagged: ${rejectedCount} adult/suspicious books filtered out. 🐾`);
}

fixIncorrectAnalysis()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
