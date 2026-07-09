
import { DevelopmentalArea } from '@/shared/config/constants';
import { ClassificationRules } from '../../services/rule.service';

export interface ClassificationResult {
  areas: DevelopmentalArea[];
  subCompetencies: string[];
  tags: string[];
  formFactor: string;
  isWorkbook: boolean;
  age: { min: number; max: number };
  energyLevel: number;
  volume: number | null;
  aiComment: string;
}

export class BookClassifier {
  private rules: ClassificationRules;

  constructor(rules: ClassificationRules) {
    this.rules = rules;
  }

  public analyze(text: string, categoryName: string = ''): ClassificationResult {
    const combinedText = `${text} ${categoryName}`;
    const formFactor = this.detectFormFactor(combinedText, categoryName);
    const isWorkbook = this.detectWorkbook(combinedText, categoryName);
    const areas = this.classifyAreas(text, categoryName);
    const subComps = this.extractSubCompetencies(combinedText);
    const tags = this.extractTags(combinedText);
    const age = this.estimateAgeRange(formFactor, isWorkbook, text.length, combinedText);
    const energy = this.calculateEnergyLevel(combinedText, formFactor);

    return {
      areas,
      subCompetencies: subComps,
      tags,
      formFactor,
      isWorkbook,
      age,
      energyLevel: energy,
      volume: this.extractVolume(text),
      aiComment: this.generateComment(areas, age, formFactor, isWorkbook, subComps)
    };
  }

  private extractSubCompetencies(text: string): string[] {
    const matched: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    for (const [comp, keywords] of Object.entries(this.rules.subCompetencies)) {
      if (keywords.some(k => lowerText.includes(k.toLowerCase()))) {
        matched.add(comp);
      }
    }
    return Array.from(matched);
  }

  private classifyAreas(text: string, categoryName: string): DevelopmentalArea[] {
    const scores: Record<string, number> = {};
    const lowerText = text.toLowerCase();
    const lowerCategory = categoryName.toLowerCase();

    // Use injected parentAreas mapping
    for (const [comp, area] of Object.entries(this.rules.parentAreas)) {
      const keywords = this.rules.subCompetencies[comp] || [];
      if (keywords.some(k => lowerText.includes(k.toLowerCase()) || lowerCategory.includes(k.toLowerCase()))) {
        // Validation: Ensure area is valid DevelopmentalArea
        // In real app, we might want strict type checking here or in DB seed
        scores[area] = (scores[area] || 0) + 2;
      }
    }

    return Object.entries(scores)
      .filter(([_, score]) => score >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area as DevelopmentalArea);
  }

  // Helper methods (Logic remains mostly same, but made instance methods)

  private extractVolume(text: string): number | null {
    const match = text.match(/(?:제|Vol\.|No\.|권)?\s*(\d+)\s*(?:권|호)/);
    if (match) return parseInt(match[1]);
    const endMatch = text.match(/\s(\d+)$/);
    if (endMatch) return parseInt(endMatch[1]);
    return null;
  }

  private generateComment(areas: DevelopmentalArea[], age: { min: number, max: number }, form: string, isWorkbook: boolean, subComps: string[]): string {
    const mainComp = subComps[0] || areas[0] || '종합 발달';
    const ageStr = `${Math.floor(age.min / 12)}~${Math.floor(age.max / 12)}세`;
    if (isWorkbook) return `${mainComp} 역량을 키워주는 ${ageStr} 아이용 워크북이에요.`;
    return `${mainComp}에 도움을 주는 ${ageStr} 시기 필수 그림책이에요.`;
  }

  private calculateEnergyLevel(text: string, formFactor: string): number {
    let score = 5;
    const activeKeywords = ['운동', '신체', '놀이', '춤', '노래', '사운드', '자동차', '공룡', 'Active', 'Play'];
    score += activeKeywords.filter(k => text.includes(k)).length * 2;
    if (formFactor === 'soundbook' || formFactor === 'flapbook') score += 2;
    return Math.max(0, Math.min(10, score));
  }

  private estimateAgeRange(formFactor: string, isWorkbook: boolean, textLength: number, text: string): { min: number; max: number } {
    const elementaryKeywords = ['초등', '학교', '글쓰기', '교과서', '학년', 'Grade', 'Elementary'];
    if (elementaryKeywords.some(k => text.includes(k))) return { min: 84, max: 120 };
    if (isWorkbook) return { min: 48, max: 84 };
    switch (formFactor) {
      case 'boardbook': return { min: 0, max: 24 };
      case 'flapbook': return { min: 12, max: 36 };
      default: return textLength < 150 ? { min: 24, max: 48 } : { min: 48, max: 84 };
    }
  }

  private extractTags(text: string): string[] {
    const tags: Set<string> = new Set();
    const tagMap: Record<string, string[]> = {
      '자존감': ['자존감', '용기'], '상상력': ['상상', '꿈'], '애착': ['사랑', '포옹']
    };
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(k => text.includes(k))) tags.add(tag);
    }
    return Array.from(tags);
  }

  private detectFormFactor(text: string, category: string): string {
    if (category.includes('보드북') || text.includes('보드북')) return 'boardbook';
    if (text.includes('플랩') || text.includes('팝업')) return 'flapbook';
    if (text.includes('사운드') || text.includes('소리')) return 'soundbook';
    return 'hardcover';
  }

  private detectWorkbook(text: string, category: string): boolean {
    const kw = ['워크북', '학습지', '문제집', 'Activity', 'Sticker'];
    return kw.some(k => text.includes(k) || category.includes(k));
  }
}