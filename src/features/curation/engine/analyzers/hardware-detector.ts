
export interface HardwareFeatures {
  saypen: boolean;
  banapen: boolean;
  fishtalk: boolean;
  qr_code: boolean;
  cd_included: boolean;
  workbook_included: boolean;
}

/**
 * Hardware & Feature Detector
 * Analyzes text (title, description) to find compatibility with parenting tech.
 */
export class HardwareDetector {
  static detect(text: string): HardwareFeatures {
    const content = text.toLowerCase();

    return {
      saypen: /세이펜|saypen|세이 펜/.test(content),
      banapen: /바나펜|banapen|바나 펜/.test(content),
      fishtalk: /피시톡|fishtalk|피씨톡/.test(content),
      qr_code: /qr코드|qr code|qr|큐알/.test(content),
      cd_included: /cd|오디오/.test(content),
      workbook_included: /워크북|활동지|workbook|activity book/.test(content),
    };
  }
}
