
/**
 * PenDetector
 * Analyzes text (title, description, tags) to detect compatible smart pens.
 */

export interface PenCompatibility {
  saypen: boolean;     // 세이펜
  banapen: boolean;    // 바나펜 (아람)
  fishtalk: boolean;   // 피쉬톡 (블루래빗)
  pororopen: boolean;  // 뽀로로펜
  rainbowpen: boolean; // 레인보우펜 (추피)
  babystep: boolean;   // 잉글리시에그 플링/펜
  seampen: boolean;    // 세이펜 (Alternative)
  qpen: boolean;       // 큐브펜
  thinkpen: boolean;   // 씽크펜 (웅진)
}

export class PenDetector {
  static analyze(text: string): PenCompatibility {
    const clean = text.toLowerCase().replace(/\s+/g, '');
    
    return {
      saypen: /세이펜|saypen|세이팬|음원코딩|음원다운/.test(clean),
      banapen: /바나펜|바나나펜|banapen/.test(clean),
      fishtalk: /피쉬톡|피시톡|fishtalk/.test(clean),
      pororopen: /뽀로로펜|pororopen|리틀퓨처북/.test(clean),
      rainbowpen: /레인보우펜|rainbowpen/.test(clean),
      babystep: /플링|플링펜|에그펜/.test(clean),
      qpen: /큐브펜|큐펜/.test(clean),
      thinkpen: /씽크펜|웅진펜/.test(clean),
      seampen: false // Reserved
    };
  }

  static getBadgeList(features: PenCompatibility): string[] {
    const badges: string[] = [];
    if (features.saypen) badges.push('세이펜');
    if (features.banapen) badges.push('바나펜');
    if (features.fishtalk) badges.push('피쉬톡');
    if (features.pororopen) badges.push('뽀로로펜');
    if (features.rainbowpen) badges.push('레인보우펜');
    if (features.thinkpen) badges.push('씽크펜');
    return badges;
  }
}
