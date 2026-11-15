/**
 * 2026년 카드 소득공제 계산 엔진 검증 스크립트
 *
 * 실행: node scripts/test-card-deduction.mjs
 * - src/lib/tax/cardDeduction2026.ts 를 tsc 로 컴파일해 그대로 가져와 검증한다.
 * - content/posts/2026-card-deduction-limit.md 의 예시 1·2·3, 경계값,
 *   추가공제 상한, 코치 문구 금액, 시뮬레이터 증분을 1원 단위로 확인한다.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outDir = path.join(root, ".tmp-test-tax");

fs.rmSync(outDir, { recursive: true, force: true });
execFileSync(
  "npx",
  [
    "tsc",
    "src/lib/tax/cardDeduction2026.ts",
    "--outDir",
    outDir,
    "--target",
    "es2022",
    "--module",
    "esnext",
    "--moduleResolution",
    "bundler",
    "--skipLibCheck",
    "--strict",
  ],
  { stdio: "inherit", cwd: root },
);

const jsPath = path.join(outDir, "cardDeduction2026.js");
const mjsPath = path.join(outDir, "cardDeduction2026.mjs");
fs.renameSync(jsPath, mjsPath);

const engine = await import(pathToFileURL(mjsPath).href);
const {
  calcCardDeduction,
  buildCoach,
  estimateBracket,
  simulateAll,
  simulateExtra,
  compareCouple,
  taxSavingOf,
  baseLimitFor,
  additionalLimitFor,
  laborIncomeDeduction,
} = engine;

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const ok =
    typeof expected === "number"
      ? Math.abs(actual - expected) < 0.5
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed += 1;
  else failures.push(`${name}: 기대 ${JSON.stringify(expected)} / 실제 ${JSON.stringify(actual)}`);
}

function checkTrue(name, value) {
  if (value) passed += 1;
  else failures.push(`${name}: 조건 불충족`);
}

const 만 = 10_000;

/* ---------------------------------------------------------------- *
 * 1. 글(content/posts/2026-card-deduction-limit.md)의 예시와 대조
 * ---------------------------------------------------------------- */

// 예시 1: 총급여 5,000만, 자녀 2명, 신용카드만 3,500만
{
  const r = calcCardDeduction({
    grossSalary: 5_000 * 만,
    children: 2,
    credit: 3_500 * 만,
  });
  check("예시1 최저사용금액", r.threshold, 1_250 * 만);
  check("예시1 공제대상(문턱 차감)", r.categories[0].countedSpend, 2_250 * 만);
  check("예시1 산출 공제액", r.rawDeduction, 3_375_000);
  check("예시1 기본한도", r.baseLimit, 400 * 만);
  check("예시1 최종 공제액", r.totalDeduction, 3_375_000);
  check("예시1 상태", r.status, "fillingBase");
}

// 예시 2: 총급여 6,000만, 자녀 1명, 신용 1,000만 + 체크 2,000만
{
  const r = calcCardDeduction({
    grossSalary: 6_000 * 만,
    children: 1,
    credit: 1_000 * 만,
    debit: 2_000 * 만,
  });
  check("예시2 최저사용금액", r.threshold, 1_500 * 만);
  check("예시2 신용카드 소진", r.categories[0].thresholdUsed, 1_000 * 만);
  check("예시2 체크카드 소진", r.categories[1].thresholdUsed, 500 * 만);
  check("예시2 체크 공제대상", r.categories[1].countedSpend, 1_500 * 만);
  check("예시2 산출 공제액", r.rawDeduction, 4_500_000);
  check("예시2 기본한도", r.baseLimit, 350 * 만);
  check("예시2 최종 공제액", r.totalDeduction, 3_500_000);

  // 전부 신용카드로 썼을 때와 비교
  const creditOnly = calcCardDeduction({
    grossSalary: 6_000 * 만,
    children: 1,
    credit: 3_000 * 만,
  });
  check("예시2 신용카드만 공제액", creditOnly.totalDeduction, 2_250_000);
  check("예시2 수단 분리 차이", r.totalDeduction - creditOnly.totalDeduction, 1_250_000);
}

// 예시 3: 총급여 8,000만, 자녀 2명, 신용 4,000만
{
  const r = calcCardDeduction({
    grossSalary: 8_000 * 만,
    children: 2,
    credit: 4_000 * 만,
  });
  check("예시3 최저사용금액", r.threshold, 2_000 * 만);
  check("예시3 산출 공제액", r.rawDeduction, 3_000_000);
  check("예시3 기본한도(7천만 초과·자녀2)", r.baseLimit, 300 * 만);
  check("예시3 최종 공제액", r.totalDeduction, 3_000_000);

  const noChild = calcCardDeduction({
    grossSalary: 8_000 * 만,
    children: 0,
    credit: 4_000 * 만,
  });
  check("예시3 자녀 0명 한도", noChild.baseLimit, 250 * 만);
  check("예시3 자녀 0명 공제액", noChild.totalDeduction, 2_500_000);
}

// 글의 절세액 설명: 337만 5,000원 × 15% ≈ 50만 6,000원
{
  const r = calcCardDeduction({ grossSalary: 5_000 * 만, children: 2, credit: 3_500 * 만 });
  const saving = taxSavingOf(r.totalDeduction, 0.15);
  check("절세액(소득세 15%)", saving.incomeTax, 506_250);
  check("지방소득세", saving.localTax, 50_625);
  check("절세액 합계", saving.total, 556_875);
}

/* ---------------------------------------------------------------- *
 * 2. 2026년 개정 기본한도 표 (자녀 수 × 총급여 구간)
 * ---------------------------------------------------------------- */

{
  const expected = [
    // [총급여, 자녀, 기본한도, 추가한도]
    [4_000 * 만, 0, 300 * 만, 300 * 만],
    [7_000 * 만, 0, 300 * 만, 300 * 만], // 7,000만원 "이하"
    [7_000 * 만, 1, 350 * 만, 300 * 만],
    [7_000 * 만, 2, 400 * 만, 300 * 만],
    [7_000 * 만, 3, 400 * 만, 300 * 만], // 2명 이상은 400만원
    [7_000 * 만 + 1, 0, 250 * 만, 200 * 만],
    [7_100 * 만, 1, 275 * 만, 200 * 만],
    [8_000 * 만, 2, 300 * 만, 200 * 만],
    [10_000 * 만, 5, 300 * 만, 200 * 만],
  ];
  for (const [gross, kids, base, add] of expected) {
    check(`기본한도 ${gross}원/${kids}명`, baseLimitFor(gross, kids), base);
    check(`추가한도 ${gross}원/${kids}명`, additionalLimitFor(gross), add);
  }
}

// 총급여 경계에서 문화체육 30% 적용 여부가 갈린다
{
  const atCap = calcCardDeduction({
    grossSalary: 7_000 * 만,
    children: 0,
    culture: 100 * 만,
  });
  check("7,000만원 문화비 30%", atCap.categories[2].rate, 0.3);
  checkTrue("7,000만원 문화비 적용 가능", atCap.cultureEligible);

  const overCap = calcCardDeduction({
    grossSalary: 7_000 * 만 + 1,
    children: 0,
    culture: 100 * 만,
  });
  checkTrue("7,000만원 초과 문화비 미적용", overCap.cultureEligible === false);
  check("초과 시 문화비 재분류 금액", overCap.cultureReclassified, 100 * 만);
  check("초과 시 신용카드로 합산", overCap.input.credit, 100 * 만);
  // 문턱(1,750만원)을 넘지 못하므로 공제 0원
  check("초과 시 공제액", overCap.totalDeduction, 0);
}

/* ---------------------------------------------------------------- *
 * 3. 문턱·경계값·추가공제 상한
 * ---------------------------------------------------------------- */

// 문턱 미달
{
  const r = calcCardDeduction({ grossSalary: 5_000 * 만, children: 0, credit: 500 * 만 });
  check("문턱 미달 부족액", r.thresholdShortfall, 750 * 만);
  check("문턱 미달 공제액", r.totalDeduction, 0);
  check("문턱 미달 상태", r.status, "belowThreshold");
  const coach = buildCoach(r, 0.15);
  checkTrue("문턱 미달 코치 문구에 부족액", coach.summary.includes("7,500,000원"));
  checkTrue("문턱 미달 코치 상태", coach.status === "belowThreshold");
}

// 문턱과 정확히 일치 → 초과분 0원
{
  const r = calcCardDeduction({ grossSalary: 5_000 * 만, children: 0, credit: 1_250 * 만 });
  check("문턱 정확히 일치 부족액", r.thresholdShortfall, 0);
  check("문턱 정확히 일치 초과분", r.excessSpend, 0);
  check("문턱 정확히 일치 공제액", r.totalDeduction, 0);
  check("문턱 정확히 일치 상태", r.status, "belowThreshold");
}

// 1원 차이로 공제가 시작되는지
{
  const r = calcCardDeduction({ grossSalary: 5_000 * 만, children: 0, credit: 1_250 * 만 + 1 });
  // 1원 × 15% = 0.15원 → 원 단위 반올림 0원
  check("문턱 +1원 공제액", r.totalDeduction, 0);
  const r2 = calcCardDeduction({ grossSalary: 5_000 * 만, children: 0, credit: 1_250 * 만 + 100 });
  check("문턱 +100원 공제액", r2.totalDeduction, 15); // 100 × 15% = 15원
}

// 추가공제: 전통시장만 4,000만원 (추가한도 300만원 상한 확인)
{
  const r = calcCardDeduction({ grossSalary: 5_000 * 만, children: 0, market: 4_000 * 만 });
  check("전통시장 문턱 차감", r.categories[3].countedSpend, 2_750 * 만);
  check("전통시장 공제액", r.rawDeduction, 1_100 * 만);
  check("기본한도 인정액", r.baseApplied, 300 * 만);
  check("초과 공제액", r.excessDeduction, 800 * 만);
  check("추가공제 인정액(한도 300만)", r.additionalApplied, 300 * 만);
  check("최종 공제액", r.totalDeduction, 600 * 만);
  check("추가한도 소진 상태", r.status, "allFilled");
  check("추가한도 잔액", r.additionalLimitRemaining, 0);
}

// 추가공제: 특례 공제액이 초과분보다 작으면 그만큼만 인정
{
  const r = calcCardDeduction({
    grossSalary: 5_000 * 만,
    children: 0,
    credit: 5_000 * 만,
    market: 100 * 만,
  });
  check("신용 5,000만 공제액", r.categories[0].deduction, 5_625_000); // 3,750만 × 15% = 562만 5,000원
  check("전통시장 공제액", r.categories[3].deduction, 40 * 만);
  check("산출 공제액 합계", r.rawDeduction, 6_025_000);
  check("기본한도 300만 인정", r.baseApplied, 300 * 만);
  check("초과분", r.excessDeduction, 3_025_000);
  check("추가공제 = 특례 공제액", r.additionalApplied, 40 * 만);
  check("최종 공제액", r.totalDeduction, 340 * 만);
  check("추가공제 여지 상태", r.status, "fillingAdditional");
  // 추가한도(300만)를 다 채우려면 특례 사용분 750만원이 필요: (300만-40만)/0.4 = 650만
  check("추가한도 채우는 특례 지출", r.specialSpendToFillAdditional, 650 * 만);
}

/* ---------------------------------------------------------------- *
 * 4. 코치 문구 금액과 시뮬레이터 증분이 실제 계산과 맞는지
 * ---------------------------------------------------------------- */

// 기본한도 남은 상태: 체크카드로 한도를 채우는 금액
{
  // 예시2는 산출 공제액 450만 > 기본한도 350만 → 추가공제 단계
  const example2 = calcCardDeduction({
    grossSalary: 6_000 * 만,
    children: 1,
    credit: 1_000 * 만,
    debit: 2_000 * 만,
  });
  checkTrue("예시2는 기본한도 초과", example2.rawDeduction > example2.baseLimit);
  check("예시2 코치 상태", buildCoach(example2, 0.15).status, "fillingAdditional");

  // 기본한도가 남은 상태: 총급여 6,000만 / 자녀 1명 / 신용 1,500만 + 체크 1,000만
  const input = { grossSalary: 6_000 * 만, children: 1, credit: 1_500 * 만, debit: 1_000 * 만 };
  const r2 = calcCardDeduction(input);
  const coach2 = buildCoach(r2, 0.15);
  const need = Math.ceil((r2.baseLimitRemaining * 10) / 3);
  check("기본한도 잔액", r2.baseLimitRemaining, 500_000);
  checkTrue("코치 기본한도 문구", coach2.actions[0].text.includes("체크카드"));
  check("코치 금액 = 체크카드 필요액", coach2.actions[0].amount, need);
  check("코치 체크카드 필요액", need, 1_666_667);
  const filled = simulateExtra(input, "debit", need);
  check("코치 금액만큼 쓰면 기본한도 도달", filled.rawDeduction, r2.baseLimit);
  check("코치 상태", coach2.status, "fillingBase");
}

// 시뮬레이터: 같은 금액을 채널별로 썼을 때 증분이 공제율 순서와 맞는지
{
  const input = { grossSalary: 5_000 * 만, children: 0, credit: 2_000 * 만, market: 200 * 만 };
  const { base, rows } = simulateAll(input, 100 * 만, 0.15);
  const credit = rows.find((r) => r.channel === "credit");
  const debit = rows.find((r) => r.channel === "debit");
  const special = rows.find((r) => r.channel === "special");
  // 이미 문턱(1,250만)을 넘겼으므로 100만원 추가는 15%/30%/40% 그대로
  check("시뮬 신용 증분 공제", credit.extraDeduction, 15 * 만);
  check("시뮬 체크 증분 공제", debit.extraDeduction, 30 * 만);
  check("시뮬 전통시장 증분 공제", special.extraDeduction, 40 * 만);
  check("시뮬 신용 절세", credit.extraTaxSaving, 24_750); // 150,000 × 15% + 지방소득세
  check("시뮬 기준 공제액", base.totalDeduction, 1_925_000); // 750만×15% + 200만×40%
}

// 문턱 미달 상태에서의 시뮬레이션은 문턱을 채우기 전까지 공제 0원
{
  const input = { grossSalary: 5_000 * 만, children: 0, credit: 500 * 만 };
  const { rows } = simulateAll(input, 100 * 만, 0.15);
  check("문턱 미달 시뮬 증분 0", rows[0].extraDeduction, 0);
}

// 추가한도 채우기: 코치가 말한 금액을 쓰면 정말 한도가 차는지
{
  const input = {
    grossSalary: 5_000 * 만,
    children: 0,
    credit: 5_000 * 만,
    market: 100 * 만,
  };
  const r = calcCardDeduction(input);
  const need = r.specialSpendToFillAdditional;
  const after = simulateExtra(input, "special", need);
  check("추가한도 채우기 검증", after.additionalApplied, 300 * 만);
  check("추가한도 채운 뒤 총 공제", after.totalDeduction, 600 * 만);
  // 조금 덜 쓰면 한도에 닿지 않는다
  const before = simulateExtra(input, "special", need - 1_000);
  checkTrue("추가한도 직전은 미달", before.additionalApplied < 300 * 만);
}

/* ---------------------------------------------------------------- *
 * 5. 한계세율 추정
 * ---------------------------------------------------------------- */

{
  const e1 = estimateBracket(5_000 * 만, 2);
  check("5,000만 근로소득공제", e1.breakdown.laborDeduction, 12_250_000);
  check("5,000만 추정 과세표준", e1.taxBase, 28_616_750);
  check("5,000만 추정 세율", e1.rate, 0.15);

  const e2 = estimateBracket(8_000 * 만, 2);
  check("8,000만 근로소득공제", e2.breakdown.laborDeduction, 13_750_000);
  check("8,000만 추정 세율", e2.rate, 0.24);

  const e3 = estimateBracket(4_000 * 만, 0);
  check("4,000만 근로소득공제", laborIncomeDeduction(4_000 * 만), 1_125 * 만);
  checkTrue("4,000만 추정 세율 존재", [0.06, 0.15].includes(e3.rate));
}

/* ---------------------------------------------------------------- *
 * 6. 맞벌이 비교
 * ---------------------------------------------------------------- */

{
  const report = compareCouple(
    {
      name: "본인",
      grossSalary: 8_500 * 만,
      credit: 3_000 * 만,
      debit: 500 * 만,
      culture: 0,
      market: 0,
      transit: 0,
    },
    {
      name: "배우자",
      grossSalary: 3_600 * 만,
      credit: 400 * 만,
      debit: 900 * 만,
      culture: 0,
      market: 0,
      transit: 0,
    },
    1,
  );
  checkTrue("맞벌이 리포트 2명", report.people.length === 2);
  checkTrue("맞벌이 판정 존재", report.better === 0 || report.better === 1 || report.better === null);
  checkTrue("맞벌이 판정 문구", report.verdict.includes("카드"));
  checkTrue("맞벌이 유의사항", report.caveats.length === 3);
  // 배우자는 문턱(900만) 미달이므로 100만원 추가 시 공제 증가가 본인보다 작거나 같아야 한다
  const ownerBest = Math.max(...report.people[0].marginal.map((m) => m.extraTaxSaving));
  const spouseBest = Math.max(...report.people[1].marginal.map((m) => m.extraTaxSaving));
  check("본인 한계 절세액", ownerBest, 105_600); // 100만×40% = 40만 공제 × 24%(+지방세)
  // 배우자는 문턱을 이미 넘겨 전통시장·대중교통(40%)이 가장 유리: 100만×40% = 40만 공제 × 15%(+지방세)
  check("배우자 최선 한계 절세액", spouseBest, 66_000);
  check(
    "배우자 체크카드 한계 절세액",
    report.people[1].marginal.find((m) => m.channel === "debit").extraTaxSaving,
    49_500,
  );
  check("본인 한계세율", report.people[0].rate, 0.24);
  check("배우자 한계세율", report.people[1].rate, 0.15);
  check("유리한 쪽 = 본인", report.better, 0);
}

/* ---------------------------------------------------------------- *
 * 7. 프리셋 4종이 모두 정상 계산되는지 (0으로 나누기·NaN 없음)
 * ---------------------------------------------------------------- */

{
  for (const preset of engine.PRESETS) {
    const r = calcCardDeduction(preset.input);
    checkTrue(`프리셋 ${preset.id} 공제액 유한`, Number.isFinite(r.totalDeduction));
    checkTrue(`프리셋 ${preset.id} 공제액 >= 0`, r.totalDeduction >= 0);
    checkTrue(`프리셋 ${preset.id} 공제액 <= 산출액`, r.totalDeduction <= r.rawDeduction);
    const coach = buildCoach(r, estimateBracket(preset.input.grossSalary, preset.input.children).rate);
    checkTrue(`프리셋 ${preset.id} 코치 문구`, coach.actions.length > 0);
  }
}

// 0원·음수 입력에서도 깨지지 않는지
{
  const r = calcCardDeduction({ grossSalary: 0, children: 0, credit: -100, debit: 0 });
  check("0원 입력 공제액", r.totalDeduction, 0);
  check("0원 입력 한도", r.baseLimit, 300 * 만);
}

/* ---------------------------------------------------------------- *
 * 결과 출력
 * ---------------------------------------------------------------- */

if (failures.length > 0) {
  console.error(`\n❌ 실패 ${failures.length}건 / 통과 ${passed}건`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log(`\n✅ 카드 소득공제 엔진 검증 통과: ${passed}건`);
