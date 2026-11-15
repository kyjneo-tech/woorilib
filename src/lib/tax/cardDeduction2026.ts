/**
 * 2026년 귀속 연말정산 — 신용카드 등 사용액 소득공제 계산 엔진
 *
 * 근거
 * - 조세특례제한법 제126조의2 (신용카드 등 사용금액에 대한 소득공제)
 * - 같은 법 시행령 제121조의2 (최저사용금액의 계산 순서, 자녀 등 요건)
 * - 2025년 세제개편(2026년 1월 1일 사용분부터): 자녀 수에 따른 기본한도 확대
 *
 * 설계 원칙
 * 1. 금액은 모두 원(정수) 단위로 다룬다. 화면에서만 만원 단위로 보여 준다.
 * 2. 문턱(최저사용금액)은 공제율이 낮은 결제수단부터 소진한다.
 * 3. 한도는 "기본한도 → 추가한도" 순서로 적용하고, 추가공제는
 *    기본한도 초과분·전통시장/대중교통/문화체육 공제액 합계·추가한도 중 가장 작은 값이다.
 * 4. 이 파일은 React에 의존하지 않는다. 테스트 스크립트가 그대로 import 한다.
 */

export type PaymentKey = "credit" | "debit" | "culture" | "market" | "transit";

export const PAYMENT_LABEL: Record<PaymentKey, string> = {
  credit: "신용카드",
  debit: "체크카드·현금영수증",
  culture: "도서·공연·문화체육",
  market: "전통시장",
  transit: "대중교통",
};

/** 결제수단·사용처별 공제율 */
export const DEDUCTION_RATE: Record<PaymentKey, number> = {
  credit: 0.15,
  debit: 0.3,
  culture: 0.3,
  market: 0.4,
  transit: 0.4,
};

/**
 * 최저사용금액(총급여 25%)을 소진하는 순서.
 * 공제율이 낮은 수단부터 차감해야 실제 공제액이 나온다(시행령 제121조의2③).
 * 공제율이 같은 항목끼리는 순서가 결과에 영향을 주지 않는다.
 */
export const THRESHOLD_ORDER: PaymentKey[] = ["credit", "debit", "culture", "market", "transit"];

/** 최저사용금액 비율 — 총급여의 25% */
export const THRESHOLD_RATE = 0.25;

/** 문화체육(도서·공연 등) 30% 공제가 적용되는 총급여 상한 */
export const CULTURE_SALARY_CAP = 70_000_000;

/** 2026년 개정 기본한도 — [자녀 0명, 1명, 2명 이상] */
export const BASE_LIMIT = {
  /** 총급여 7,000만원 이하 */
  upToCap: [3_000_000, 3_500_000, 4_000_000],
  /** 총급여 7,000만원 초과 */
  overCap: [2_500_000, 2_750_000, 3_000_000],
} as const;

/** 추가공제 한도 */
export const ADDITIONAL_LIMIT = {
  upToCap: 3_000_000,
  overCap: 2_000_000,
} as const;

export type CardDeductionInput = {
  /** 총급여 (원). 연봉이 아니라 비과세를 제외한 근로소득 총급여 */
  grossSalary: number;
  /** 자녀 등 부양가족 수 (0, 1, 2 이상은 2로 취급) */
  children?: number;
  /** 신용카드 사용액 */
  credit?: number;
  /** 체크카드·직불카드·기명식 선불카드·현금영수증 사용액 */
  debit?: number;
  /** 도서·공연·박물관·미술관·영화관·수영장·체력단련장 사용액 (총급여 7천만원 이하만 30%) */
  culture?: number;
  /** 전통시장 사용액 */
  market?: number;
  /** 대중교통 이용액 */
  transit?: number;
};

export type NormalizedInput = Required<CardDeductionInput>;

export type CategoryBreakdown = {
  key: PaymentKey;
  label: string;
  /** 계산에 반영된 사용액 (문화비 재분류 반영 후) */
  spend: number;
  /** 최저사용금액을 채우는 데 소진된 금액 */
  thresholdUsed: number;
  /** 실제로 공제율이 적용된 금액 */
  countedSpend: number;
  rate: number;
  /** 원 단위 반올림한 공제액 */
  deduction: number;
};

export type CardDeductionStatus =
  | "belowThreshold"
  | "fillingBase"
  | "fillingAdditional"
  | "allFilled";

export type CardDeductionResult = {
  input: NormalizedInput;
  /** 자녀 수(0~2로 정리) */
  children: number;
  /** 문화체육 30% 적용 가능 여부 (총급여 7천만원 이하) */
  cultureEligible: boolean;
  /** 7천만원 초과로 신용카드(15%)로 재분류된 문화비 금액 */
  cultureReclassified: number;
  /** 최저사용금액 (총급여 25%) */
  threshold: number;
  /** 공제대상 사용액 합계 (재분류 반영) */
  totalSpend: number;
  /** 문턱을 채우는 데 소진된 금액 */
  thresholdConsumed: number;
  /** 문턱까지 남은 금액 (미달일 때만 > 0) */
  thresholdShortfall: number;
  /** 문턱을 넘은 금액 */
  excessSpend: number;
  categories: CategoryBreakdown[];
  /** 공제율을 적용한 산출 공제액 (한도 적용 전) */
  rawDeduction: number;
  baseLimit: number;
  additionalLimit: number;
  /** 기본한도 안에서 인정된 금액 */
  baseApplied: number;
  /** 기본한도를 넘은 공제액 */
  excessDeduction: number;
  /** 전통시장·대중교통·문화체육 공제액 합계 (추가공제의 상한) */
  specialDeductionSum: number;
  /** 실제 인정된 추가공제액 */
  additionalApplied: number;
  /** 최종 소득공제액 */
  totalDeduction: number;
  /** 기본한도까지 남은 금액 */
  baseLimitRemaining: number;
  /** 추가한도까지 남은 금액 */
  additionalLimitRemaining: number;
  /** 추가한도를 모두 채우는 데 필요한 전통시장·대중교통 추가 지출 */
  specialSpendToFillAdditional: number;
  status: CardDeductionStatus;
};

function won(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

function clampChildren(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.min(2, Math.floor(v));
}

export function baseLimitFor(grossSalary: number, children: number): number {
  const kids = clampChildren(children);
  const table =
    won(grossSalary) <= CULTURE_SALARY_CAP ? BASE_LIMIT.upToCap : BASE_LIMIT.overCap;
  return table[kids];
}

export function additionalLimitFor(grossSalary: number): number {
  return won(grossSalary) <= CULTURE_SALARY_CAP
    ? ADDITIONAL_LIMIT.upToCap
    : ADDITIONAL_LIMIT.overCap;
}

export function thresholdFor(grossSalary: number): number {
  return Math.floor(won(grossSalary) * THRESHOLD_RATE);
}

/** 결제수단별 사용액을 정리하면서 문화비 재분류까지 처리한다. */
function normalize(input: CardDeductionInput): {
  normalized: NormalizedInput;
  cultureEligible: boolean;
  cultureReclassified: number;
} {
  const grossSalary = won(input.grossSalary);
  const children = clampChildren(input.children);
  const cultureEligible = grossSalary <= CULTURE_SALARY_CAP;

  let credit = won(input.credit);
  let culture = won(input.culture);
  let cultureReclassified = 0;

  if (!cultureEligible && culture > 0) {
    // 총급여 7,000만원 초과: 문화체육 30%를 적용할 수 없으므로 신용카드(15%) 사용분으로 본다.
    cultureReclassified = culture;
    credit += culture;
    culture = 0;
  }

  return {
    normalized: {
      grossSalary,
      children,
      credit,
      debit: won(input.debit),
      culture,
      market: won(input.market),
      transit: won(input.transit),
    },
    cultureEligible,
    cultureReclassified,
  };
}

/**
 * 카드 소득공제 계산의 본체.
 * 순서: ① 최저사용금액(25%) → ② 결제수단별 공제율 → ③ 기본한도 → ④ 추가공제
 */
export function calcCardDeduction(input: CardDeductionInput): CardDeductionResult {
  const { normalized, cultureEligible, cultureReclassified } = normalize(input);
  const { grossSalary, children } = normalized;

  const threshold = thresholdFor(grossSalary);

  let thresholdLeft = threshold;
  const categories: CategoryBreakdown[] = THRESHOLD_ORDER.map((key) => {
    const spend = normalized[key];
    const thresholdUsed = Math.min(spend, thresholdLeft);
    thresholdLeft -= thresholdUsed;
    const countedSpend = spend - thresholdUsed;
    const rate = DEDUCTION_RATE[key];
    return {
      key,
      label: PAYMENT_LABEL[key],
      spend,
      thresholdUsed,
      countedSpend,
      rate,
      deduction: Math.round(countedSpend * rate),
    };
  });

  const totalSpend = categories.reduce((sum, c) => sum + c.spend, 0);
  const thresholdConsumed = totalSpend - Math.max(0, thresholdLeft);
  const thresholdShortfall = Math.max(0, thresholdLeft);
  const excessSpend = Math.max(0, totalSpend - threshold);

  const rawDeduction = categories.reduce((sum, c) => sum + c.deduction, 0);

  const baseLimit = baseLimitFor(grossSalary, children);
  const additionalLimit = additionalLimitFor(grossSalary);

  const baseApplied = Math.min(rawDeduction, baseLimit);
  const excessDeduction = Math.max(0, rawDeduction - baseLimit);
  const specialDeductionSum = categories
    .filter((c) => c.key === "culture" || c.key === "market" || c.key === "transit")
    .reduce((sum, c) => sum + c.deduction, 0);
  const additionalApplied = Math.min(excessDeduction, specialDeductionSum, additionalLimit);
  const totalDeduction = baseApplied + additionalApplied;

  const baseLimitRemaining = Math.max(0, baseLimit - rawDeduction);
  const additionalLimitRemaining = Math.max(0, additionalLimit - additionalApplied);

  let status: CardDeductionStatus;
  if (rawDeduction === 0) status = "belowThreshold";
  else if (rawDeduction < baseLimit) status = "fillingBase";
  else if (additionalApplied < additionalLimit) status = "fillingAdditional";
  else status = "allFilled";

  return {
    input: normalized,
    children,
    cultureEligible,
    cultureReclassified,
    threshold,
    totalSpend,
    thresholdConsumed,
    thresholdShortfall,
    excessSpend,
    categories,
    rawDeduction,
    baseLimit,
    additionalLimit,
    baseApplied,
    excessDeduction,
    specialDeductionSum,
    additionalApplied,
    totalDeduction,
    baseLimitRemaining,
    additionalLimitRemaining,
    // 전통시장·대중교통(40%)을 추가로 쓸 때 필요한 금액. 원 단위로 올림.
    specialSpendToFillAdditional:
      additionalLimitRemaining > 0 ? Math.ceil((additionalLimitRemaining * 5) / 2) : 0,
    status,
  };
}

/* ------------------------------------------------------------------ *
 * 세율 — 소득공제액을 실제 세금 감소액으로 환산
 * ------------------------------------------------------------------ */

export type TaxBracket = {
  /** 소득세 한계세율 */
  rate: number;
  /** 과세표준 상한 (원). 마지막 구간은 Infinity */
  upTo: number;
  /** 표시용 라벨 */
  label: string;
};

/** 2026년 귀속 종합소득세 과세표준 구간 (소득세법 제55조) */
export const TAX_BRACKETS: TaxBracket[] = [
  { rate: 0.06, upTo: 14_000_000, label: "1,400만원 이하 · 6%" },
  { rate: 0.15, upTo: 50_000_000, label: "1,400만~5,000만원 · 15%" },
  { rate: 0.24, upTo: 88_000_000, label: "5,000만~8,800만원 · 24%" },
  { rate: 0.35, upTo: 150_000_000, label: "8,800만~1억5,000만원 · 35%" },
  { rate: 0.38, upTo: 300_000_000, label: "1억5,000만~3억원 · 38%" },
  { rate: 0.4, upTo: 500_000_000, label: "3억~5억원 · 40%" },
  { rate: 0.42, upTo: 1_000_000_000, label: "5억~10억원 · 42%" },
  { rate: 0.45, upTo: Number.POSITIVE_INFINITY, label: "10억원 초과 · 45%" },
];

export const LOCAL_TAX_RATE = 0.1;

/** 소득세 한계세율에 지방소득세 10%를 더한 실효 한계세율 */
export function effectiveRate(rate: number): number {
  return rate * (1 + LOCAL_TAX_RATE);
}

/** 소득공제액을 세금 감소액으로 환산 (소득세 + 지방소득세) */
export function taxSavingOf(deduction: number, rate: number): {
  incomeTax: number;
  localTax: number;
  total: number;
} {
  const incomeTax = Math.round(won(deduction) * rate);
  const localTax = Math.round(incomeTax * LOCAL_TAX_RATE);
  return { incomeTax, localTax, total: incomeTax + localTax };
}

/** 근로소득공제 (소득세법 제47조) */
export function laborIncomeDeduction(grossSalary: number): number {
  const gross = won(grossSalary);
  if (gross === 0) return 0;
  if (gross <= 5_000_000) return Math.floor(gross * 0.7);
  if (gross <= 15_000_000) return 3_500_000 + Math.floor((gross - 5_000_000) * 0.4);
  if (gross <= 45_000_000) return 7_500_000 + Math.floor((gross - 15_000_000) * 0.15);
  if (gross <= 100_000_000) return 12_000_000 + Math.floor((gross - 45_000_000) * 0.05);
  return Math.min(20_000_000, 14_750_000 + Math.floor((gross - 100_000_000) * 0.02));
}

/** 과세표준 구간 찾기 */
export function bracketOf(taxBase: number): TaxBracket {
  const base = won(taxBase);
  for (const bracket of TAX_BRACKETS) {
    if (base <= bracket.upTo) return bracket;
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1];
}

export type EstimatedBracket = {
  /** 추정 과세표준 */
  taxBase: number;
  /** 추정 한계세율 (소득세) */
  rate: number;
  /** 지방소득세 포함 실효 한계세율 */
  effectiveRate: number;
  label: string;
  breakdown: {
    grossSalary: number;
    laborDeduction: number;
    laborIncome: number;
    personalDeduction: number;
    pensionDeduction: number;
    healthDeduction: number;
  };
  /** 추정에 쓴 가정 */
  assumptions: string[];
};

/**
 * 총급여·자녀 수로 한계세율 구간을 "참고용으로" 추정한다.
 * 실제 과세표준은 부양가족 등록, 그 밖의 소득공제·세액공제에 따라 달라진다.
 */
export function estimateBracket(grossSalary: number, children: number): EstimatedBracket {
  const gross = won(grossSalary);
  const kids = clampChildren(children);
  const laborDeduction = laborIncomeDeduction(gross);
  const laborIncome = Math.max(0, gross - laborDeduction);
  // 본인 + 배우자 + 자녀 기본공제 (1인당 150만원)
  const personalDeduction = 1_500_000 * (1 + 1 + kids);
  // 국민연금(근로자 4.5%)과 건강보험·장기요양·고용보험(약 3.8%)을 소득금액 한도로 공제
  const pensionDeduction = Math.floor(Math.min(laborIncome, gross) * 0.045);
  const healthDeduction = Math.floor(Math.min(laborIncome, gross) * 0.038);
  const taxBase = Math.max(
    0,
    laborIncome - personalDeduction - pensionDeduction - healthDeduction,
  );
  const bracket = bracketOf(taxBase);

  return {
    taxBase,
    rate: bracket.rate,
    effectiveRate: effectiveRate(bracket.rate),
    label: bracket.label,
    breakdown: {
      grossSalary: gross,
      laborDeduction,
      laborIncome,
      personalDeduction,
      pensionDeduction,
      healthDeduction,
    },
    assumptions: [
      "총급여에서 근로소득공제(소득세법 제47조)만 뺀 근로소득금액을 기준으로 계산했습니다.",
      "기본공제는 본인·배우자·자녀로 가정했습니다(1인당 150만원).",
      "국민연금 4.5%, 건강보험·장기요양·고용보험 3.8%를 소득공제로 반영했습니다.",
      "주택자금·연금저축·보험료·의료비·기부금 등 그 밖의 소득공제는 넣지 않았습니다.",
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 맞춤 액션 코치 — 상태별로 "얼마를 어떻게 써야 얼마를 아끼는지"
 * ------------------------------------------------------------------ */

/** 마지막 글자의 받침 유무로 조사를 고른다 (한글 음절만 판단) */
function finalConsonant(word: string): boolean | null {
  const trimmed = word.trim();
  if (!trimmed) return null;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
}

/** 주격·보조사 은/는 */
export function topicParticle(word: string): string {
  const hasFinal = finalConsonant(word);
  if (hasFinal === null) return "는";
  return hasFinal ? "은" : "는";
}

/** 부사격 조사 으로/로 */
export function instrumentalParticle(word: string): string {
  const hasFinal = finalConsonant(word);
  if (hasFinal === null) return "로";
  return hasFinal ? "으로" : "로";
}

export function formatWon(n: number): string {
  const value = Math.round(Number.isFinite(n) ? n : 0);
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatManwon(n: number): string {
  const value = Math.round(Number.isFinite(n) ? n : 0);
  const man = Math.floor(Math.abs(value) / 10_000);
  const rest = Math.abs(value) % 10_000;
  const sign = value < 0 ? "-" : "";
  if (man === 0) return `${sign}${rest.toLocaleString("ko-KR")}원`;
  if (rest === 0) return `${sign}${man.toLocaleString("ko-KR")}만원`;
  return `${sign}${man.toLocaleString("ko-KR")}만 ${rest.toLocaleString("ko-KR")}원`;
}

export type CoachAction = {
  /** 행동 지침 문장 (금액 포함) */
  text: string;
  /** 강조할 금액 (없으면 0) */
  amount: number;
  tone: "act" | "warn" | "info";
};

export type Coach = {
  status: CardDeductionStatus;
  title: string;
  summary: string;
  actions: CoachAction[];
  /** 이 상태에서 "지금까지의 예상 절세액" */
  taxSaving: number;
  /** 남은 기간 최대로 더 아낄 수 있는 금액 */
  potentialTaxSaving: number;
};

export function buildCoach(result: CardDeductionResult, rate: number): Coach {
  const { status } = result;
  const saving = taxSavingOf(result.totalDeduction, rate);
  const actions: CoachAction[] = [];

  if (status === "belowThreshold") {
    const shortfall = result.thresholdShortfall;
    if (shortfall > 0) {
      actions.push({
        tone: "act",
        amount: shortfall,
        text: `12월에 ${formatWon(shortfall)}을 더 쓰면 문턱을 채웁니다. 문턱을 채우는 데 쓴 돈 자체는 공제되지 않고, 문턱을 넘긴 다음 1원부터 공제가 시작됩니다.`,
      });
    } else {
      actions.push({
        tone: "warn",
        amount: 0,
        text: `공제대상 사용액이 최저사용금액(${formatWon(result.threshold)})과 똑같습니다. 문턱을 넘긴 금액이 0원이라 공제액도 0원입니다. 여기서 1원이라도 더 쓰면 공제가 시작됩니다.`,
      });
    }
    actions.push({
      tone: "info",
      amount: 0,
      text: `문턱을 넘긴 뒤에는 체크카드·현금영수증(30%)이 신용카드(15%)보다 두 배 빠르게 공제됩니다. 같은 돈이라면 체크·현금으로 쓰는 편이 낫습니다.`,
    });
    if (shortfall > 0) {
      actions.push({
        tone: "warn",
        amount: 0,
        text: `공제 30%는 100만원을 써야 과세표준 30만원이 줄어드는 구조입니다. 쓰지 않아도 되는 지출을 새로 만들면 절세보다 지출이 커집니다.`,
      });
    }
    return {
      status,
      title: "아직 총급여 25% 문턱 아래입니다",
      summary: `최저사용금액은 ${formatWon(result.threshold)}이고, 지금까지 공제대상 사용액은 ${formatWon(result.totalSpend)}입니다. ${
        shortfall > 0 ? `${formatWon(shortfall)}이 모자랍니다.` : "문턱을 겨우 채운 상태입니다."
      }`,
      actions,
      taxSaving: saving.total,
      potentialTaxSaving: 0,
    };
  }

  if (status === "fillingBase") {
    const remaining = result.baseLimitRemaining;
    const debitNeed = Math.ceil((remaining * 10) / 3);
    const marketNeed = Math.ceil((remaining * 5) / 2);
    const creditDeductionIfSameSpend = Math.round(debitNeed * DEDUCTION_RATE.credit);
    const extraSaving = taxSavingOf(remaining - creditDeductionIfSameSpend, rate).total;

    actions.push({
      tone: "act",
      amount: debitNeed,
      text: `앞으로 ${formatWon(debitNeed)}을 체크카드·현금영수증으로 쓰면 기본한도 ${formatWon(result.baseLimit)}을 꽉 채웁니다.`,
    });
    actions.push({
      tone: "act",
      amount: extraSaving,
      text: `같은 ${formatWon(debitNeed)}을 신용카드로 쓰면 공제는 ${formatWon(creditDeductionIfSameSpend)}에 그칩니다. 결제수단만 바꾸면 세금을 약 ${formatWon(extraSaving)} 더 아낍니다.`,
    });
    actions.push({
      tone: "info",
      amount: marketNeed,
      text: `전통시장·대중교통(40%)으로 채우면 ${formatWon(marketNeed)}만 쓰면 한도에 닿습니다. 다만 이 금액은 새 지출이 아니라 이미 쓸 돈의 결제수단을 옮기는 것이어야 합니다.`,
    });
    actions.push({
      tone: "info",
      amount: 0,
      text: `기본한도를 채운 뒤에 남는 공제는 전통시장·대중교통·문화체육 사용분에서만 나옵니다. 신용카드 사용액은 추가공제에 기여하지 않습니다.`,
    });
    return {
      status,
      title: "문턱은 넘었고, 기본한도가 남았습니다",
      summary: `지금까지 공제액은 ${formatWon(result.rawDeduction)}이고 기본한도 ${formatWon(result.baseLimit)}까지 ${formatWon(remaining)} 남았습니다.`,
      actions,
      taxSaving: saving.total,
      potentialTaxSaving: taxSavingOf(remaining, rate).total,
    };
  }

  if (status === "fillingAdditional") {
    const addLeft = result.additionalLimitRemaining;
    const specialNeed = result.specialSpendToFillAdditional;
    const extraSaving = taxSavingOf(addLeft, rate).total;
    actions.push({
      tone: "act",
      amount: specialNeed,
      text: `전통시장·대중교통으로 ${formatWon(specialNeed)}을 더 쓰면 추가한도 ${formatWon(result.additionalLimit)}을 모두 채우고, 세금을 약 ${formatWon(extraSaving)} 더 아낍니다.`,
    });
    actions.push({
      tone: "warn",
      amount: 0,
      text: `이 단계에서 신용카드로 더 써도 공제는 늘지 않습니다. 추가공제는 전통시장·대중교통·문화체육 공제액까지만 인정됩니다.`,
    });
    if (result.specialDeductionSum < result.excessDeduction) {
      actions.push({
        tone: "info",
        amount: 0,
        text: `지금은 한도를 넘긴 공제액(${formatWon(result.excessDeduction)})보다 전통시장·대중교통·문화체육 공제액(${formatWon(result.specialDeductionSum)})이 작아, 그만큼만 추가공제로 인정됩니다.`,
      });
    }
    actions.push({
      tone: "info",
      amount: 0,
      text: `12월 31일 사용분까지 반영됩니다. 대중교통은 후불교통카드 승인일, 전통시장은 매출전표 승인일 기준으로 잡히는 점을 확인하세요.`,
    });
    return {
      status,
      title: "기본한도는 찼고, 추가공제 여지가 남았습니다",
      summary: `기본한도 ${formatWon(result.baseLimit)}을 채웠고 추가공제 ${formatWon(result.additionalApplied)}을 받았습니다. 추가한도 ${formatWon(result.additionalLimit)} 중 ${formatWon(addLeft)}이 남아 있습니다.`,
      actions,
      taxSaving: saving.total,
      potentialTaxSaving: extraSaving,
    };
  }

  actions.push({
    tone: "info",
    amount: 0,
    text: `기본한도와 추가한도를 모두 채웠습니다. 남은 기간에 더 써도 소득공제는 늘지 않으니, 카드 혜택이나 포인트가 좋은 카드로 결제하세요.`,
  });
  actions.push({
    tone: "info",
    amount: 0,
    text: `1월 중순 연말정산간소화 서비스에서 전통시장·대중교통 사용분이 빠지지 않았는지 확인하고, 빠졌다면 영수증·승차권으로 증빙해 추가 신청할 수 있습니다.`,
  });
  return {
    status,
    title: "한도를 모두 채웠습니다",
    summary: `소득공제액 ${formatWon(result.totalDeduction)}으로 기본한도와 추가한도를 모두 소진했습니다. 예상 세금 감소액은 ${formatWon(saving.total)}입니다.`,
    actions,
    taxSaving: saving.total,
    potentialTaxSaving: 0,
  };
}

/* ------------------------------------------------------------------ *
 * 남은 기간 시뮬레이터 · 맞벌이 비교
 * ------------------------------------------------------------------ */

export type SimChannel = "credit" | "debit" | "special";

export const SIM_CHANNEL_LABEL: Record<SimChannel, string> = {
  credit: "신용카드",
  debit: "체크카드·현금영수증",
  special: "전통시장·대중교통",
};

/** 특정 결제수단으로 amount를 더 썼을 때의 결과 */
export function simulateExtra(
  input: CardDeductionInput,
  channel: SimChannel,
  amount: number,
): CardDeductionResult {
  const extra = won(amount);
  const next: CardDeductionInput = { ...input };
  if (channel === "credit") next.credit = won(input.credit) + extra;
  if (channel === "debit") next.debit = won(input.debit) + extra;
  if (channel === "special") next.market = won(input.market) + extra;
  return calcCardDeduction(next);
}

export type SimulationRow = {
  channel: SimChannel;
  label: string;
  extraDeduction: number;
  extraTaxSaving: number;
  totalDeduction: number;
};

export function simulateAll(
  input: CardDeductionInput,
  amount: number,
  rate: number,
): { base: CardDeductionResult; rows: SimulationRow[] } {
  const base = calcCardDeduction(input);
  const rows = (["credit", "debit", "special"] as SimChannel[]).map((channel) => {
    const next = simulateExtra(input, channel, amount);
    const extraDeduction = next.totalDeduction - base.totalDeduction;
    return {
      channel,
      label: SIM_CHANNEL_LABEL[channel],
      extraDeduction,
      extraTaxSaving: taxSavingOf(extraDeduction, rate).total,
      totalDeduction: next.totalDeduction,
    };
  });
  return { base, rows };
}

export type CouplePerson = {
  name: string;
  grossSalary: number;
  credit: number;
  debit: number;
  culture: number;
  market: number;
  transit: number;
};

export type CouplePersonReport = {
  name: string;
  result: CardDeductionResult;
  /** 자동 추정 한계세율 (소득세) */
  rate: number;
  rateLabel: string;
  taxSaving: number;
  /** 결제수단별 100만원 추가 사용 시 늘어나는 소득공제액 */
  marginal: { channel: SimChannel; label: string; extraDeduction: number; extraTaxSaving: number }[];
};

export type CoupleReport = {
  people: [CouplePersonReport, CouplePersonReport];
  /** 100만원 추가 지출 시 절세 효과가 더 큰 사람 */
  better: 0 | 1 | null;
  verdict: string;
  caveats: string[];
};

export function compareCouple(
  a: CouplePerson,
  b: CouplePerson,
  children: number,
  unit = 1_000_000,
): CoupleReport {
  const build = (person: CouplePerson): CouplePersonReport => {
    const input: CardDeductionInput = {
      grossSalary: person.grossSalary,
      children,
      credit: person.credit,
      debit: person.debit,
      culture: person.culture,
      market: person.market,
      transit: person.transit,
    };
    const result = calcCardDeduction(input);
    const estimated = estimateBracket(person.grossSalary, children);
    const marginal = (["credit", "debit", "special"] as SimChannel[]).map((channel) => {
      const next = simulateExtra(input, channel, unit);
      const extraDeduction = next.totalDeduction - result.totalDeduction;
      return {
        channel,
        label: SIM_CHANNEL_LABEL[channel],
        extraDeduction,
        extraTaxSaving: taxSavingOf(extraDeduction, estimated.rate).total,
      };
    });
    return {
      name: person.name,
      result,
      rate: estimated.rate,
      rateLabel: estimated.label,
      taxSaving: taxSavingOf(result.totalDeduction, estimated.rate).total,
      marginal,
    };
  };

  const reports: [CouplePersonReport, CouplePersonReport] = [build(a), build(b)];
  const [first, second] = reports;

  // 같은 금액을 어느 쪽 카드로 쓰는 것이 유리한지: 100만원 한계 절세액 비교
  const bestOf = (report: CouplePersonReport) =>
    Math.max(...report.marginal.map((m) => m.extraTaxSaving));
  const firstBest = bestOf(first);
  const secondBest = bestOf(second);

  let better: 0 | 1 | null = null;
  if (firstBest > secondBest) better = 0;
  else if (secondBest > firstBest) better = 1;

  const winner = better === null ? null : reports[better];
  const loser = better === null ? null : reports[better === 0 ? 1 : 0];
  const verdict =
    winner === null || loser === null
      ? "두 사람의 한계 절세액이 같습니다. 남은 지출은 두 사람 중 한도가 덜 찬 쪽에 몰아도 결과가 비슷합니다."
      : `${winner.name} 카드로 결제하는 편이 유리합니다. 같은 ${formatManwon(unit)}을 쓸 때 ${winner.name}${topicParticle(
          winner.name,
        )} ${formatWon(bestOf(winner))}, ${loser.name}${topicParticle(loser.name)} ${formatWon(
          bestOf(loser),
        )}을 더 아낍니다.`;

  return {
    people: reports,
    better,
    verdict,
    caveats: [
      "부부가 서로의 카드 사용액을 한쪽으로 합쳐 공제받을 수 없습니다. 각자 근로소득이 있으면 각자 신고합니다.",
      "자녀 기본공제는 부부 중 한 명만 받을 수 있어, 이 비교에서는 두 사람 모두 같은 자녀 수를 넣었습니다. 실제로는 한도가 붙은 쪽만 자녀 수를 반영하세요.",
      "배우자의 소득금액이 100만원(근로소득만 있으면 총급여 500만원) 이하라면 본인 공제에 부양가족으로 합산할 수 있어, 이 탭(맞벌이 비교)과 계산 방식이 다릅니다.",
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 프리셋
 * ------------------------------------------------------------------ */

export type Preset = {
  id: string;
  label: string;
  description: string;
  input: CardDeductionInput;
};

export const PRESETS: Preset[] = [
  {
    id: "starter",
    label: "사회초년생",
    description: "총급여 4,000만 · 자녀 없음 · 신용 1,200만 + 체크 600만",
    input: {
      grossSalary: 40_000_000,
      children: 0,
      credit: 12_000_000,
      debit: 6_000_000,
      culture: 300_000,
      market: 400_000,
      transit: 600_000,
    },
  },
  {
    id: "single-income",
    label: "외벌이·자녀 1명",
    description: "총급여 5,800만 · 자녀 1명 · 신용 1,800만 + 체크 1,000만",
    input: {
      grossSalary: 58_000_000,
      children: 1,
      credit: 18_000_000,
      debit: 10_000_000,
      culture: 600_000,
      market: 800_000,
      transit: 900_000,
    },
  },
  {
    id: "multi-child",
    label: "다자녀·7천만 이하",
    description: "총급여 7,000만 · 자녀 3명 · 신용 2,000만 + 체크 1,400만",
    input: {
      grossSalary: 70_000_000,
      children: 3,
      credit: 20_000_000,
      debit: 14_000_000,
      culture: 800_000,
      market: 1_200_000,
      transit: 1_000_000,
    },
  },
  {
    id: "high-income",
    label: "고소득·자녀 2명",
    description: "총급여 8,500만 · 자녀 2명 · 신용 3,000만 + 체크 900만",
    input: {
      grossSalary: 85_000_000,
      children: 2,
      credit: 30_000_000,
      debit: 9_000_000,
      culture: 500_000,
      market: 700_000,
      transit: 800_000,
    },
  },
];
