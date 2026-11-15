"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEDUCTION_RATE,
  PAYMENT_LABEL,
  PRESETS,
  TAX_BRACKETS,
  buildCoach,
  calcCardDeduction,
  compareCouple,
  effectiveRate,
  estimateBracket,
  formatManwon,
  formatWon,
  instrumentalParticle,
  simulateAll,
  taxSavingOf,
  type CardDeductionInput,
  type CardDeductionResult,
  type CouplePerson,
  type PaymentKey,
  type Preset,
  type SimChannel,
} from "@/lib/tax/cardDeduction2026";

type Unit = "man" | "won";
type Tab = "calc" | "couple";

type Fields = {
  grossSalary: number;
  children: number;
  credit: number;
  debit: number;
  culture: number;
  market: number;
  transit: number;
};

const EXCLUSIONS = [
  { key: "maintenance", label: "아파트 관리비" },
  { key: "utilities", label: "전기·수도·가스" },
  { key: "telecom", label: "통신·인터넷" },
  { key: "taxes", label: "국세·지방세" },
  { key: "insurance", label: "보험료(건강·연금)" },
  { key: "school", label: "공납금·보육비" },
  { key: "vehicle", label: "신차·리스료" },
  { key: "overseas", label: "해외결제·면세점" },
  { key: "giftcard", label: "상품권 구입" },
] as const;

type ExclusionKey = (typeof EXCLUSIONS)[number]["key"];

const EMPTY_EXCLUSIONS: Record<ExclusionKey, number> = {
  maintenance: 0,
  utilities: 0,
  telecom: 0,
  taxes: 0,
  insurance: 0,
  school: 0,
  vehicle: 0,
  overseas: 0,
  giftcard: 0,
};

const SHORT_LABEL: Record<PaymentKey, string> = {
  credit: "신용카드",
  debit: "체크·현금",
  culture: "문화·공연",
  market: "전통시장",
  transit: "대중교통",
};

const DEFAULT_FIELDS: Fields = {
  grossSalary: 58_000_000,
  children: 1,
  credit: 18_000_000,
  debit: 10_000_000,
  culture: 600_000,
  market: 800_000,
  transit: 900_000,
};

const DEFAULT_COUPLE = {
  a: {
    name: "본인",
    grossSalary: 85_000_000,
    credit: 30_000_000,
    debit: 9_000_000,
    culture: 500_000,
    market: 700_000,
    transit: 800_000,
  } as CouplePerson,
  b: {
    name: "배우자",
    grossSalary: 38_000_000,
    credit: 4_000_000,
    debit: 7_000_000,
    culture: 0,
    market: 600_000,
    transit: 0,
  } as CouplePerson,
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function clampPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

/* ------------------------------ 입력 필드 ------------------------------ */

function MoneyInput({
  id,
  label,
  hint,
  value,
  onChange,
  unit,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  unit: Unit;
  disabled?: boolean;
}) {
  const factor = unit === "man" ? 10_000 : 1;
  const display = value > 0 ? Math.round(value / factor).toLocaleString("ko-KR") : "";
  return (
    <div className={`field${disabled ? " field--disabled" : ""}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="input-money">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          placeholder="0"
          disabled={disabled}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^0-9]/g, "");
            onChange(digits ? Number(digits) * factor : 0);
          }}
        />
        <span className="input-money__unit">{unit === "man" ? "만원" : "원"}</span>
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

function Gauge({
  label,
  value,
  total,
  caption,
  tone = "accent",
}: {
  label: string;
  value: number;
  total: number;
  caption: string;
  tone?: "accent" | "warm";
}) {
  const percent = clampPercent(value, total);
  return (
    <div className="gauge">
      <div className="gauge__head">
        <span className="gauge__label">{label}</span>
        <span className="gauge__percent">{percent.toFixed(percent >= 99.95 ? 0 : 1)}%</span>
      </div>
      <div
        className="gauge__bar"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span
          className={`gauge__fill${tone === "warm" ? " gauge__fill--warm" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="gauge__caption">{caption}</p>
    </div>
  );
}

/* ------------------------------ 결과 요약 ------------------------------ */

function ResultSummary({
  result,
  rate,
  onCopy,
  copied,
}: {
  result: CardDeductionResult;
  rate: number;
  onCopy: () => void;
  copied: boolean;
}) {
  const saving = taxSavingOf(result.totalDeduction, rate);
  const thresholdReached = result.totalSpend > result.threshold;
  return (
    <div className="panel panel--result">
      <p className="panel__eyebrow">2026년 귀속 · 예상 공제액</p>
      <p className="result__value">{formatWon(result.totalDeduction)}</p>
      <p className="result__sub">
        소득공제액 <span>·</span> 예상 세금 감소 <strong>{formatWon(saving.total)}</strong>
      </p>
      <p className="result__note">
        소득세 {formatWon(saving.incomeTax)} + 지방소득세 {formatWon(saving.localTax)} · 한계세율{" "}
        {pct(rate)} 기준
      </p>

      <div className="gauges">
        <Gauge
          label="① 총급여 25% 문턱"
          value={result.totalSpend}
          total={result.threshold}
          caption={
            thresholdReached
              ? `문턱 ${formatWon(result.threshold)} 대비 ${formatWon(result.excessSpend)} 초과`
              : `${formatWon(result.thresholdShortfall)} 부족 — 이 구간은 공제 0원`
          }
        />
        <Gauge
          label="② 기본한도"
          value={result.rawDeduction}
          total={result.baseLimit}
          caption={
            result.baseLimitRemaining > 0
              ? `${formatWon(result.baseLimitRemaining)} 남음 (한도 ${formatWon(result.baseLimit)})`
              : `한도 ${formatWon(result.baseLimit)} 소진`
          }
        />
        <Gauge
          label="③ 추가한도"
          value={result.additionalApplied}
          total={result.additionalLimit}
          tone="warm"
          caption={
            result.additionalLimitRemaining > 0
              ? `추가공제 ${formatWon(result.additionalApplied)} · ${formatWon(
                  result.additionalLimitRemaining,
                )} 남음`
              : `추가공제 ${formatWon(result.additionalApplied)} (한도 소진)`
          }
        />
      </div>

      <div className="calc-rows calc-rows--head" aria-hidden="true">
        <span>사용처</span>
        <span>공제대상</span>
        <span>공제액</span>
      </div>
      <ul className="calc-rows">
        {result.categories.map((category) => (
          <li className="calc-row" key={category.key}>
            <span className="calc-row__name" title={PAYMENT_LABEL[category.key]}>
              {SHORT_LABEL[category.key]}
              <em>{Math.round(category.rate * 100)}%</em>
            </span>
            <span className="calc-row__counted">{formatWon(category.countedSpend)}</span>
            <span className="calc-row__deduct">{formatWon(category.deduction)}</span>
          </li>
        ))}
      </ul>

      <div className="calc-totals">
        <div>
          <span>산출 공제액</span>
          <strong>{formatWon(result.rawDeduction)}</strong>
        </div>
        <div>
          <span>기본한도 인정</span>
          <strong>{formatWon(result.baseApplied)}</strong>
        </div>
        <div>
          <span>추가공제 인정</span>
          <strong>{formatWon(result.additionalApplied)}</strong>
        </div>
      </div>

      <details className="calc-details">
        <summary>계산 과정 자세히 보기</summary>
        <ol className="calc-steps">
          <li>
            최저사용금액 = 총급여 {formatWon(result.input.grossSalary)} × 25% ={" "}
            <strong>{formatWon(result.threshold)}</strong>
          </li>
          <li>
            공제율이 낮은 결제수단부터 문턱을 소진: 신용카드 {formatWon(result.categories[0].thresholdUsed)} → 체크·현금{" "}
            {formatWon(result.categories[1].thresholdUsed)} → 문화체육 {formatWon(result.categories[2].thresholdUsed)} →
            전통시장 {formatWon(result.categories[3].thresholdUsed)} → 대중교통{" "}
            {formatWon(result.categories[4].thresholdUsed)}
          </li>
          <li>
            문턱을 넘은 금액에 공제율을 곱해 <strong>{formatWon(result.rawDeduction)}</strong> 산출
          </li>
          <li>
            기본한도 {formatWon(result.baseLimit)} 적용 → {formatWon(result.baseApplied)}, 초과분{" "}
            {formatWon(result.excessDeduction)}
          </li>
          <li>
            추가공제 = min(초과분 {formatWon(result.excessDeduction)}, 전통시장·대중교통·문화체육 공제액{" "}
            {formatWon(result.specialDeductionSum)}, 추가한도 {formatWon(result.additionalLimit)}) ={" "}
            <strong>{formatWon(result.additionalApplied)}</strong>
          </li>
          <li>
            최종 소득공제액 = {formatWon(result.baseApplied)} + {formatWon(result.additionalApplied)} ={" "}
            <strong>{formatWon(result.totalDeduction)}</strong>
          </li>
        </ol>
        {result.cultureReclassified > 0 ? (
          <p className="calc-details__warn">
            총급여가 7,000만원을 넘어 문화체육 30% 공제를 쓸 수 없습니다. 입력한 문화비{" "}
            {formatWon(result.cultureReclassified)}은 신용카드 사용액(15%)으로 계산했습니다.
          </p>
        ) : null}
      </details>

      <button type="button" className="button button--ghost" onClick={onCopy}>
        {copied ? "복사했습니다 ✓" : "결과 요약 복사"}
      </button>
    </div>
  );
}

/* ------------------------------ 본체 ------------------------------ */

export function CardDeductionCalculator() {
  const [tab, setTab] = useState<Tab>("calc");
  const [unit, setUnit] = useState<Unit>("man");
  const [fields, setFields] = useState<Fields>(DEFAULT_FIELDS);
  const [exclusions, setExclusions] = useState<Record<ExclusionKey, number>>(EMPTY_EXCLUSIONS);
  const [exSource, setExSource] = useState<"credit" | "debit">("credit");
  const [exOpen, setExOpen] = useState(false);
  const [rateChoice, setRateChoice] = useState<string>("auto");
  const [simAmount, setSimAmount] = useState(1_000_000);
  const [copied, setCopied] = useState(false);
  const [couple, setCouple] = useState(DEFAULT_COUPLE);
  const [coupleChildren, setCoupleChildren] = useState(1);

  const exclusionTotal = useMemo(
    () => Object.values(exclusions).reduce((sum, value) => sum + value, 0),
    [exclusions],
  );

  const effectiveInput: CardDeductionInput = useMemo(() => {
    const credit = Math.max(0, fields.credit - (exSource === "credit" ? exclusionTotal : 0));
    const debit = Math.max(0, fields.debit - (exSource === "debit" ? exclusionTotal : 0));
    return {
      grossSalary: fields.grossSalary,
      children: fields.children,
      credit,
      debit,
      culture: fields.culture,
      market: fields.market,
      transit: fields.transit,
    };
  }, [fields, exclusionTotal, exSource]);

  const result = useMemo(() => calcCardDeduction(effectiveInput), [effectiveInput]);
  const estimate = useMemo(
    () => estimateBracket(fields.grossSalary, fields.children),
    [fields.grossSalary, fields.children],
  );

  const rate =
    rateChoice === "auto"
      ? estimate.rate
      : TAX_BRACKETS[Number(rateChoice)]?.rate ?? estimate.rate;

  const coach = useMemo(() => buildCoach(result, rate), [result, rate]);
  const simulation = useMemo(
    () => simulateAll(effectiveInput, simAmount, rate),
    [effectiveInput, simAmount, rate],
  );

  const bestChannel = useMemo<SimChannel | null>(() => {
    const sorted = [...simulation.rows].sort((a, b) => b.extraTaxSaving - a.extraTaxSaving);
    const best = sorted[0];
    return best && best.extraTaxSaving > 0 ? best.channel : null;
  }, [simulation.rows]);

  const coupleReport = useMemo(
    () => compareCouple(couple.a, couple.b, coupleChildren),
    [couple, coupleChildren],
  );

  const updateField = (key: keyof Fields) => (value: number) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (preset: Preset) => {
    setFields({
      grossSalary: preset.input.grossSalary,
      children: preset.input.children ?? 0,
      credit: preset.input.credit ?? 0,
      debit: preset.input.debit ?? 0,
      culture: preset.input.culture ?? 0,
      market: preset.input.market ?? 0,
      transit: preset.input.transit ?? 0,
    });
    setExclusions(EMPTY_EXCLUSIONS);
  };

  const copySummary = useCallback(() => {
    const saving = taxSavingOf(result.totalDeduction, rate);
    const lines = [
      "[2026년 귀속 연말정산 카드 소득공제 계산 결과]",
      `· 총급여 ${formatManwon(result.input.grossSalary)} / 자녀 등 ${result.children}명`,
      `· 최저사용금액(총급여 25%): ${formatWon(result.threshold)}`,
      `· 공제대상 사용액: 신용 ${formatWon(result.categories[0].spend)} / 체크·현금 ${formatWon(
        result.categories[1].spend,
      )} / 문화체육 ${formatWon(result.categories[2].spend)} / 전통시장 ${formatWon(
        result.categories[3].spend,
      )} / 대중교통 ${formatWon(result.categories[4].spend)}`,
      `· 산출 공제액: ${formatWon(result.rawDeduction)} (기본한도 ${formatWon(
        result.baseLimit,
      )} / 추가한도 ${formatWon(result.additionalLimit)})`,
      `· 최종 소득공제액: ${formatWon(result.totalDeduction)}`,
      `· 적용 한계세율: ${pct(rate)} (지방소득세 포함 ${pct(effectiveRate(rate))})`,
      `· 예상 세금 감소액: ${formatWon(saving.total)} (소득세 ${formatWon(
        saving.incomeTax,
      )} + 지방소득세 ${formatWon(saving.localTax)})`,
      `· 다음 행동: ${coach.actions[0]?.text ?? "-"}`,
      "출처: 우리집 라이브러리 카드 소득공제 계산기 https://woorilib.com/tools/card-deduction",
    ];
    const text = lines.join("\n");

    const fallback = () => {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(area);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else {
      fallback();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }, [coach, rate, result]);

  const statusLabel: Record<CardDeductionResult["status"], string> = {
    belowThreshold: "문턱 미달",
    fillingBase: "기본한도 채우는 중",
    fillingAdditional: "추가한도 채우는 중",
    allFilled: "한도 소진",
  };

  return (
    <div className="tool">
      <div className="tool__bar">
        <div className="tabs" role="tablist" aria-label="계산기 모드">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "calc"}
            className={tab === "calc" ? "tabs__btn is-active" : "tabs__btn"}
            onClick={() => setTab("calc")}
          >
            내 공제 계산
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "couple"}
            className={tab === "couple" ? "tabs__btn is-active" : "tabs__btn"}
            onClick={() => setTab("couple")}
          >
            맞벌이 비교
          </button>
        </div>
        <div className="seg" role="group" aria-label="입력 단위">
          <button
            type="button"
            className={unit === "man" ? "seg__btn is-active" : "seg__btn"}
            onClick={() => setUnit("man")}
          >
            만원
          </button>
          <button
            type="button"
            className={unit === "won" ? "seg__btn is-active" : "seg__btn"}
            onClick={() => setUnit("won")}
          >
            원
          </button>
        </div>
      </div>

      {tab === "calc" ? (
        <div className="calc">
          <div className="calc__inputs">
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">① 내 소득과 카드 사용액</h2>
                <span className={`status status--${result.status}`}>{statusLabel[result.status]}</span>
              </div>

              <div className="presets" role="group" aria-label="예시 불러오기">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="preset"
                    onClick={() => applyPreset(preset)}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="calc-live">
                지금 결과 <strong>{formatWon(result.totalDeduction)}</strong> 공제 · 세금 약{" "}
                {formatWon(taxSavingOf(result.totalDeduction, rate).total)} 감소
              </p>

              <div className="field-grid">
                <MoneyInput
                  id="gross-salary"
                  label="총급여 (비과세 제외)"
                  hint="원천징수영수증의 '총급여' 금액"
                  value={fields.grossSalary}
                  onChange={updateField("grossSalary")}
                  unit={unit}
                />
                <div className="field">
                  <span className="field__label" id="children-label">
                    자녀 등 부양가족 수
                  </span>
                  <div className="seg seg--wide" role="group" aria-labelledby="children-label">
                    {[0, 1, 2, 3].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={fields.children === count ? "seg__btn is-active" : "seg__btn"}
                        onClick={() =>
                          setFields((prev) => ({ ...prev, children: count }))
                        }
                      >
                        {count === 0 ? "없음" : count === 3 ? "3명 이상" : `${count}명`}
                      </button>
                    ))}
                  </div>
                  <p className="field__hint">
                    2026년 개정: 7천만원 이하 300/350/400만원, 초과 250/275/300만원
                  </p>
                </div>
              </div>

              <h3 className="panel__subtitle">결제수단·사용처별 사용액</h3>
              <p className="panel__help">
                각 칸은 겹치지 않게 나눠서 입력하세요. 문화체육 사용액은 신용·체크카드 금액에서 빼서
                따로 적습니다. 금액은 2026년 1월 1일 이후 사용분 기준입니다.
              </p>

              <div className="field-grid field-grid--2">
                <MoneyInput
                  id="credit"
                  label="신용카드"
                  hint="공제율 15%"
                  value={fields.credit}
                  onChange={updateField("credit")}
                  unit={unit}
                />
                <MoneyInput
                  id="debit"
                  label="체크카드·현금영수증"
                  hint="공제율 30%"
                  value={fields.debit}
                  onChange={updateField("debit")}
                  unit={unit}
                />
                <MoneyInput
                  id="market"
                  label="전통시장"
                  hint="공제율 40%"
                  value={fields.market}
                  onChange={updateField("market")}
                  unit={unit}
                />
                <MoneyInput
                  id="transit"
                  label="대중교통"
                  hint="공제율 40%"
                  value={fields.transit}
                  onChange={updateField("transit")}
                  unit={unit}
                />
                <MoneyInput
                  id="culture"
                  label="도서·공연·문화체육"
                  hint={
                    fields.grossSalary > 70_000_000
                      ? "총급여 7천만원 초과 — 30% 적용 불가"
                      : "공제율 30% (총급여 7천만원 이하)"
                  }
                  value={fields.culture}
                  onChange={updateField("culture")}
                  unit={unit}
                />
              </div>

              {fields.grossSalary > 70_000_000 && fields.culture > 0 ? (
                <p className="alert alert--warn">
                  총급여가 7,000만원을 넘으면 문화체육 30%가 적용되지 않습니다. 입력한{" "}
                  {formatWon(fields.culture)}은 신용카드 사용액(15%)으로 계산합니다.
                </p>
              ) : null}

              <div className="exclusion">
                <button
                  type="button"
                  className="exclusion__toggle"
                  aria-expanded={exOpen}
                  onClick={() => setExOpen((prev) => !prev)}
                >
                  <span>
                    공제 제외 지출 빼기
                    {exclusionTotal > 0 ? ` · ${formatWon(exclusionTotal)} 반영됨` : ""}
                  </span>
                  <span aria-hidden="true">{exOpen ? "접기 −" : "펼치기 +"}</span>
                </button>

                {exOpen ? (
                  <div className="exclusion__body">
                    <p className="panel__help">
                      명세서에 찍혔지만 소득공제에서 빠지는 지출입니다. 금액을 넣으면 아래
                      결제수단에서 빼고 계산합니다.
                    </p>
                    <div className="seg" role="group" aria-label="제외 지출 결제수단">
                      <button
                        type="button"
                        className={exSource === "credit" ? "seg__btn is-active" : "seg__btn"}
                        onClick={() => setExSource("credit")}
                      >
                        신용카드로 결제
                      </button>
                      <button
                        type="button"
                        className={exSource === "debit" ? "seg__btn is-active" : "seg__btn"}
                        onClick={() => setExSource("debit")}
                      >
                        체크카드로 결제
                      </button>
                    </div>
                    <div className="field-grid field-grid--2">
                      {EXCLUSIONS.map((item) => (
                        <MoneyInput
                          key={item.key}
                          id={`ex-${item.key}`}
                          label={item.label}
                          value={exclusions[item.key]}
                          onChange={(value) =>
                            setExclusions((prev) => ({ ...prev, [item.key]: value }))
                          }
                          unit={unit}
                        />
                      ))}
                    </div>
                    {exclusionTotal > 0 ? (
                      <p className="exclusion__result">
                        정리 후 계산 금액 — 신용카드 {formatWon(result.categories[0].spend)} / 체크·현금{" "}
                        {formatWon(result.categories[1].spend)}
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => setExclusions(EMPTY_EXCLUSIONS)}
                        >
                          초기화
                        </button>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="rate">
                <label className="field__label" htmlFor="rate-select">
                  적용 한계세율
                </label>
                <select
                  id="rate-select"
                  className="select"
                  value={rateChoice}
                  onChange={(event) => setRateChoice(event.target.value)}
                >
                  <option value="auto">
                    자동 추정 — 총급여·자녀 수로 계산 ({pct(estimate.rate)}, 지방세 포함{" "}
                    {pct(estimate.effectiveRate)})
                  </option>
                  {TAX_BRACKETS.map((bracket, index) => (
                    <option key={bracket.label} value={String(index)}>
                      {bracket.label} · 지방세 포함 {pct(effectiveRate(bracket.rate))}
                    </option>
                  ))}
                </select>
                <p className="field__hint">
                  {rateChoice === "auto"
                    ? `추정 과세표준 ${formatWon(estimate.taxBase)} → ${estimate.label}`
                    : "직접 고른 구간의 한계세율로 세금 감소액을 계산합니다."}
                </p>
                <details className="rate__details">
                  <summary>한계세율을 어떻게 추정했나요?</summary>
                  <ul>
                    {estimate.assumptions.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p>
                    실제 과세표준은 부양가족 등록, 연금계좌·보험료·의료비·기부금 공제에 따라 달라집니다.
                    회사 원천징수영수증의 과세표준을 알고 있다면 위에서 구간을 직접 고르세요.
                  </p>
                </details>
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">③ 남은 기간, 어느 카드로 쓸까</h2>
                <span className="panel__pill">12월 31일 사용분까지</span>
              </div>
              <p className="panel__help">
                앞으로 연말까지 쓸 예상 금액을 움직여 결제수단별로 늘어나는 공제액과 세금 감소액을
                비교합니다. 새 지출을 만들기보다, 이미 쓸 돈의 결제수단을 바꾸는 용도로 보세요.
              </p>
              <div className="sim">
                <div className="sim__head">
                  <span>추가로 쓸 금액</span>
                  <strong>{formatWon(simAmount)}</strong>
                </div>
                <input
                  className="range"
                  type="range"
                  min={0}
                  max={10_000_000}
                  step={100_000}
                  value={simAmount}
                  onChange={(event) => setSimAmount(Number(event.target.value))}
                  aria-label="추가로 쓸 금액"
                />
                <div className="sim__scale">
                  <span>0원</span>
                  <span>500만원</span>
                  <span>1,000만원</span>
                </div>
                <div className="sim__cards">
                  {simulation.rows.map((row) => (
                    <div
                      key={row.channel}
                      className={
                        row.channel === bestChannel ? "sim__card is-best" : "sim__card"
                      }
                    >
                      <p className="sim__card-label">
                        {row.label}
                        <em>{Math.round(DEDUCTION_RATE[row.channel === "special" ? "market" : row.channel] * 100)}%</em>
                      </p>
                      {row.extraDeduction > 0 ? (
                        <>
                          <p className="sim__card-deduct">
                            +{formatWon(row.extraDeduction)}
                            <span>공제</span>
                          </p>
                          <p className="sim__card-tax">세금 −{formatWon(row.extraTaxSaving)}</p>
                        </>
                      ) : (
                        <p className="sim__card-none">공제 증가 없음</p>
                      )}
                      {row.channel === bestChannel ? (
                        <span className="sim__card-badge">가장 유리</span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="sim__foot">
                  {bestChannel === null
                    ? "지금은 추가 지출로 늘릴 수 있는 공제가 없습니다. 한도가 이미 찼거나 문턱에 못 미치는 구간입니다."
                    : `${formatWon(simAmount)}을 ${
                        simulation.rows.find((row) => row.channel === bestChannel)?.label ?? ""
                      }${instrumentalParticle(
                        simulation.rows.find((row) => row.channel === bestChannel)?.label ?? "",
                      )} 쓰면 공제가 ${formatWon(
                        simulation.rows.find((row) => row.channel === bestChannel)?.extraDeduction ?? 0,
                      )} 늘고, 세금은 약 ${formatWon(
                        simulation.rows.find((row) => row.channel === bestChannel)?.extraTaxSaving ?? 0,
                      )} 줄어듭니다.`}
                </p>
              </div>
            </section>
          </div>

          <aside className="calc__result">
            <ResultSummary result={result} rate={rate} onCopy={copySummary} copied={copied} />

            <section className="panel panel--coach">
              <p className="panel__eyebrow">맞춤 액션 코치</p>
              <h2 className="coach__title">{coach.title}</h2>
              <p className="coach__summary">{coach.summary}</p>
              <ul className="coach__list">
                {coach.actions.map((action) => (
                  <li key={action.text} className={`coach__item coach__item--${action.tone}`}>
                    {action.text}
                  </li>
                ))}
              </ul>
              {coach.potentialTaxSaving > 0 ? (
                <p className="coach__foot">
                  남은 기간에 최대 {formatWon(coach.potentialTaxSaving)}을 더 아낄 수 있습니다.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      ) : (
        <div className="couple">
          <div className="couple__people">
            {(["a", "b"] as const).map((side) => {
              const person = couple[side];
              const report = coupleReport.people[side === "a" ? 0 : 1];
              const setPerson = (patch: Partial<CouplePerson>) =>
                setCouple((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }));
              return (
                <section className="panel" key={side}>
                  <div className="panel__head">
                    <h2 className="panel__title">{side === "a" ? "본인" : "배우자"} 정보</h2>
                    <span className={`status status--${report.result.status}`}>
                      {statusLabel[report.result.status]}
                    </span>
                  </div>
                  <div className="field-grid field-grid--2">
                    <MoneyInput
                      id={`couple-${side}-salary`}
                      label="총급여"
                      value={person.grossSalary}
                      onChange={(value) => setPerson({ grossSalary: value })}
                      unit={unit}
                    />
                    <MoneyInput
                      id={`couple-${side}-credit`}
                      label="신용카드"
                      value={person.credit}
                      onChange={(value) => setPerson({ credit: value })}
                      unit={unit}
                    />
                    <MoneyInput
                      id={`couple-${side}-debit`}
                      label="체크·현금영수증"
                      value={person.debit}
                      onChange={(value) => setPerson({ debit: value })}
                      unit={unit}
                    />
                    <MoneyInput
                      id={`couple-${side}-market`}
                      label="전통시장"
                      value={person.market}
                      onChange={(value) => setPerson({ market: value })}
                      unit={unit}
                    />
                    <MoneyInput
                      id={`couple-${side}-transit`}
                      label="대중교통"
                      value={person.transit}
                      onChange={(value) => setPerson({ transit: value })}
                      unit={unit}
                    />
                    <MoneyInput
                      id={`couple-${side}-culture`}
                      label="도서·공연·문화"
                      value={person.culture}
                      onChange={(value) => setPerson({ culture: value })}
                      unit={unit}
                    />
                  </div>
                  {report.result.cultureReclassified > 0 ? (
                    <p className="alert alert--warn">
                      총급여 7,000만원 초과 — 문화비 {formatWon(report.result.cultureReclassified)}은
                      신용카드 15%로 계산했습니다.
                    </p>
                  ) : null}
                  <div className="couple__summary">
                    <div>
                      <span>소득공제</span>
                      <strong>{formatWon(report.result.totalDeduction)}</strong>
                    </div>
                    <div>
                      <span>예상 절세</span>
                      <strong>{formatWon(report.taxSaving)}</strong>
                    </div>
                    <div>
                      <span>문턱</span>
                      <strong>
                        {report.result.thresholdShortfall > 0
                          ? `${formatWon(report.result.thresholdShortfall)} 부족`
                          : "통과"}
                      </strong>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <section className="panel couple__verdict">
            <div className="panel__head">
              <h2 className="panel__title">누구 카드로 결제할까</h2>
              <div className="seg" role="group" aria-label="자녀 수">
                {[0, 1, 2].map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={coupleChildren === count ? "seg__btn is-active" : "seg__btn"}
                    onClick={() => setCoupleChildren(count)}
                  >
                    자녀 {count === 2 ? "2명 이상" : count === 0 ? "없음" : "1명"}
                  </button>
                ))}
              </div>
            </div>
            <p className="couple__answer">{coupleReport.verdict}</p>

            <table className="compare">
              <caption>100만원을 더 쓸 때 늘어나는 절세액</caption>
              <thead>
                <tr>
                  <th scope="col">결제수단</th>
                  <th scope="col">{coupleReport.people[0].name}</th>
                  <th scope="col">{coupleReport.people[1].name}</th>
                </tr>
              </thead>
              <tbody>
                {coupleReport.people[0].marginal.map((row, index) => {
                  const other = coupleReport.people[1].marginal[index];
                  return (
                    <tr key={row.channel}>
                      <th scope="row">{row.label}</th>
                      <td className={row.extraTaxSaving >= other.extraTaxSaving ? "is-better" : ""}>
                        {formatWon(row.extraTaxSaving)}
                      </td>
                      <td className={other.extraTaxSaving > row.extraTaxSaving ? "is-better" : ""}>
                        {formatWon(other.extraTaxSaving)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="compare__note">
              0원은 그 결제수단으로 더 써도 공제가 늘지 않는 상태입니다(기본한도 소진, 추가공제는
              전통시장·대중교통·문화체육에서만 인정).
            </p>

            <div className="couple__detail">
              {coupleReport.people.map((person) => (
                <div key={person.name}>
                  <p className="couple__name">
                    {person.name} <span>한계세율 {pct(person.rate)}</span>
                  </p>
                  <p>
                    최저사용금액 {formatWon(person.result.threshold)} · 산출 공제액{" "}
                    {formatWon(person.result.rawDeduction)} · 기본한도{" "}
                    {formatWon(person.result.baseLimit)}
                  </p>
                </div>
              ))}
            </div>

            <ul className="couple__caveats">
              {coupleReport.caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
