
import { BookCategory } from '../taxonomy';

export interface DevelopmentStage {
  stage: 'SENSORY' | 'HABIT' | 'EXPLORER' | 'INTELLECTUAL'; // 감각기, 생활습관기, 탐색기, 지적확장기
  label: string;
  description: string;
  coreCategories: BookCategory[]; // Primary focus
  subCategories: BookCategory[];  // Secondary focus
}

/**
 * Age Matcher
 * Maps a child's age (months) to their development stage and curation strategy.
 * "Precision Age Matching" logic from the plan.
 */
export class AgeMatcher {
  static analyze(months: number): DevelopmentStage {
    if (months <= 12) {
      return {
        stage: 'SENSORY',
        label: '감각 발달기',
        description: '세상을 감각으로 배우는 시기입니다. 초점, 소리, 질감이 중요합니다.',
        coreCategories: ['TOY', 'COGNITIVE'],
        subCategories: ['ENGLISH', 'ART_MUSIC'] // Hearing English rhythm, Lullabies
      };
    } else if (months <= 30) {
      return {
        stage: 'HABIT',
        label: '생활습관 형성기',
        description: '자아가 생기고 모방 행동을 시작합니다. 올바른 생활 습관이 핵심입니다.',
        coreCategories: ['EMOTION', 'VEHICLE', 'TOY'],
        subCategories: ['NATURE', 'LANGUAGE']
      };
    } else if (months <= 48) {
      return {
        stage: 'EXPLORER',
        label: '세상 탐색기',
        description: '호기심이 폭발하며 "왜?"가 시작됩니다. 자연과 이야기에 빠져듭니다.',
        coreCategories: ['NATURE', 'CREATIVE', 'EMOTION'],
        subCategories: ['ENGLISH', 'MATH_SCI']
      };
    } else {
      // 49m+ (4 years ~ 7 years)
      return {
        stage: 'INTELLECTUAL',
        label: '지적 확장기',
        description: '논리적 사고가 발달하고 사회성이 확장됩니다. 지식과 교훈을 찾습니다.',
        coreCategories: ['MATH_SCI', 'HISTORY', 'CREATIVE'],
        subCategories: ['NATURE', 'ENGLISH', 'ART_MUSIC']
      };
    }
  }
}
