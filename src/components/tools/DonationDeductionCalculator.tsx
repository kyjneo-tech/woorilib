"use client";

import { useState } from "react";

const fields = [
  { id: "gross", label: "총급여", hint: "원천징수영수증의 총급여를 참고로 적어요. 비워도 계산할 수 있어요." },
  { id: "income", label: "소득금액 (근로소득금액)", hint: "총급여에서 근로소득공제를 뺀 금액을 직접 적어요." },
  { id: "combined", label: "특례·일반 기부금 합계", hint: "특례와 종교단체 외 일반기부금을 더해 적어요." },
  { id: "special", label: "합계에 포함된 특례기부금", hint: "비워 두면 위 합계를 모두 종교단체 외 일반기부금으로 계산해요." },
  { id: "religious", label: "종교단체 기부금", hint: "종교단체에 낸 일반기부금은 여기에만 적어요." },
  { id: "political", label: "정치자금 기부금" },
  { id: "hometown", label: "고향사랑기부금" },
  { id: "disaster", label: "20만원 초과분 중 특별재난지역 우대 대상액", hint: "특별재난지역에 정해진 기간 안에 낸 금액 중 30%를 적용받는 초과분만 적어요." },
] as const satisfies ReadonlyArray<{ id: string; label: string; hint?: string }>;

type FieldId = (typeof fields)[number]["id"];

const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const formatWon = (amount: number) => `${won.format(amount)}원`;
const standardCredit = (amount: number) => amount * 0.15 + Math.max(0, amount - 10_000_000) * 0.15;

function calculateDonation(
  income: number,
  combined: number,
  special: number,
  religious: number,
  political: number,
  hometown: number,
  disaster: number,
) {
  const politicalEligible = Math.min(political, income);
  const politicalCredit =
    Math.min(politicalEligible, 100_000) * (100 / 110) +
    Math.max(0, Math.min(politicalEligible, 30_000_000) - 100_000) * 0.15 +
    Math.max(0, politicalEligible - 30_000_000) * 0.25;

  const hometownEligible = Math.min(hometown, 20_000_000);
  const hometownUpperBand = Math.max(0, hometownEligible - 200_000);
  const hometownCredit =
    Math.min(hometownEligible, 100_000) * (100 / 110) +
    Math.max(0, Math.min(hometownEligible, 200_000) - 100_000) * 0.4 +
    hometownUpperBand * 0.15 +
    Math.min(disaster, hometownUpperBand) * 0.15;

  const specialBase = Math.max(0, income - politicalEligible - hometownEligible);
  const specialEligible = Math.min(special, specialBase);
  const generalBase = specialBase - specialEligible;
  const nonReligious = combined - special;
  const generalLimit = religious > 0
    ? Math.floor(generalBase * 0.1 + Math.min(generalBase * 0.2, nonReligious))
    : Math.floor(generalBase * 0.3);
  const generalEligible = Math.min(nonReligious, generalLimit);
  const religiousEligible = Math.min(religious, generalLimit - generalEligible);

  // 특례 → 종교단체 외 일반 → 종교단체 일반 순서로 합산 공제율을 적용해요.
  const specialCredit = standardCredit(specialEligible);
  const withoutReligiousCredit = standardCredit(specialEligible + generalEligible);
  const totalStandardCredit = standardCredit(specialEligible + generalEligible + religiousEligible);

  return [
    { label: "정치자금", paid: political, eligible: politicalEligible, credit: politicalCredit, carry: false },
    { label: "고향사랑", paid: hometown, eligible: hometownEligible, credit: hometownCredit, carry: false },
    { label: "특례", paid: special, eligible: specialEligible, credit: specialCredit, carry: true },
    { label: "일반 (종교단체 외)", paid: nonReligious, eligible: generalEligible, credit: withoutReligiousCredit - specialCredit, carry: true },
    { label: "일반 (종교단체)", paid: religious, eligible: religiousEligible, credit: totalStandardCredit - withoutReligiousCredit, carry: true },
  ];
}

export function DonationDeductionCalculator() {
  const [values, setValues] = useState<Partial<Record<FieldId, string>>>({});
  const amount = (id: FieldId) => Number(values[id] ?? "") * 10_000;

  const gross = amount("gross");
  const income = amount("income");
  const combined = amount("combined");
  const special = amount("special");
  const hometown = amount("hometown");
  const disaster = amount("disaster");
  const errors: Partial<Record<FieldId, string>> = {
    income: values.gross && income > gross ? "근로소득금액은 총급여 이하로 적어 주세요." : undefined,
    special: special > combined ? "특례기부금은 특례·일반 기부금 합계 이하로 적어 주세요." : undefined,
    disaster: disaster > Math.max(0, hometown - 200_000) ? "고향사랑기부금의 20만원 초과분 안에서 적어 주세요." : undefined,
  };
  const canCalculate = Boolean(values.income) && !Object.values(errors).some(Boolean);
  const rows = canCalculate
    ? calculateDonation(income, combined, special, amount("religious"), amount("political"), hometown, disaster)
    : [];
  const incomeTax = rows.reduce((total, row) => total + row.credit, 0);
  const localTax = incomeTax * 0.1;

  return (
    <>
      <div className="calc">
        <div className="calc__inputs">
          <section className="panel" aria-labelledby="donation-inputs">
            <div className="panel__head">
              <h2 className="panel__title" id="donation-inputs">소득과 기부금 입력</h2>
            </div>
            <div className="field-grid field-grid--2">
              {fields.map((field) => {
                const { id, label } = field;
                const hint = "hint" in field ? field.hint : undefined;
                const error = errors[id];
                return (
                  <div className="field" key={id}>
                    <label className="field__label" htmlFor={`donation-${id}`}>{label} (만원)</label>
                    <div className="input-money">
                      <input
                        id={`donation-${id}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0"
                        maxLength={16}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={hint || error ? `donation-${id}-hint` : undefined}
                        value={values[id] ?? ""}
                        onChange={(event) => {
                          const next = event.target.value.replace(/,/g, "").trim();
                          if (/^\d{0,11}$/.test(next)) {
                            setValues((previous) => ({ ...previous, [id]: next }));
                          }
                        }}
                      />
                      <span className="input-money__unit" aria-hidden="true">만원</span>
                    </div>
                    {(hint || error) && <p className="field__hint" id={`donation-${id}-hint`}>{error ?? hint}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="calc__result" aria-labelledby="donation-result">
          <section className="panel panel--result">
            <h2 id="donation-result" className="panel__title">예상 기부금 세액공제</h2>
            <div aria-live="polite" aria-atomic="true">
              {canCalculate ? (
                <>
                  <p className="result__value">{formatWon(incomeTax + localTax)}</p>
                  <p className="result__sub">지방소득세 포함 합계</p>
                  <p className="result__sub">소득세 {formatWon(incomeTax)} · 지방소득세 {formatWon(localTax)}</p>
                </>
              ) : (
                <p className="result__sub">
                  {values.income ? "표시된 입력값을 확인해 주세요." : "근로소득금액을 입력하면 예상 공제액이 나와요."}
                </p>
              )}
            </div>
            <p className="result__note">
              이 계산기는 참고용이에요. 실제 공제액은 한도와 산출세액에 따라 달라져요.
              올해 지급분만 계산하며 이월분과 우리사주조합기부금은 별도로 확인해 주세요.
            </p>
          </section>
        </aside>
      </div>

      {canCalculate && (
        <section className="tool-doc prose" aria-labelledby="donation-breakdown">
          <h2 id="donation-breakdown">기부금 유형별 계산 결과</h2>
          <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="donation-breakdown">
            <table>
              <thead>
                <tr>
                  <th scope="col">기부금 유형</th>
                  <th scope="col">공제 대상액</th>
                  <th scope="col">한도 초과액</th>
                  <th scope="col">소득세 공제액</th>
                  <th scope="col">이월 안내</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{formatWon(row.eligible)}</td>
                    <td>{formatWon(row.paid - row.eligible)}</td>
                    <td>{formatWon(row.credit)}</td>
                    <td>{row.carry ? "한도·산출세액 때문에 못 받은 분은 다음 과세기간부터 10년" : "이월 없음"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
