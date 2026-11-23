"use client";

import { useState } from "react";

const taxYear = 2026;
const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const formatWon = (value: number) => `${won.format(value)}원`;

function calculateEngineTax(cc: number, year: number) {
  const rate = cc <= 1000 ? 80 : cc <= 1600 ? 140 : 200;
  const age = taxYear - year + 1;
  const discount = Math.max(0, Math.min(age, 12) - 2) * 5;
  return { annual: cc * rate * (100 - discount) / 100, age, discount, rate };
}

export function CarTaxCalculator() {
  const [electric, setElectric] = useState(false);
  const [displacement, setDisplacement] = useState("");
  const [registered, setRegistered] = useState("");
  const cc = Number(displacement);
  const year = Number(registered);
  const validCc = /^\d+$/.test(displacement) && cc > 0;
  const validYear = /^[1-9]\d{3}$/.test(registered) && year <= taxYear;
  const engine = !electric && validCc && validYear ? calculateEngineTax(cc, year) : null;
  const annual = electric ? 100_000 : engine?.annual;
  const total = annual === undefined ? undefined : annual * 130 / 100;

  return (
    <div className="calc">
      <div className="calc__inputs">
        <section className="panel" aria-labelledby="car-inputs">
          <div className="panel__head">
            <h2 id="car-inputs" className="panel__title">내 차 정보</h2>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="car-kind">비영업용 승용차 종류</label>
            <select id="car-kind" className="select" value={electric ? "electric" : "engine"}
              onChange={(event) => setElectric(event.target.value === "electric")}>
              <option value="engine">배기량이 있는 승용차</option>
              <option value="electric">전기·수소 승용차</option>
            </select>
          </div>
          {electric ? (
            <p className="field__hint">배기량과 차령을 적용하지 않고 정액으로 계산해요.</p>
          ) : (
            <div className="field-grid field-grid--2">
              <div className="field">
                <label className="field__label" htmlFor="car-cc">배기량 (cc)</label>
                <div className="input-money">
                  <input id="car-cc" type="text" inputMode="numeric" autoComplete="off" required
                    placeholder="예: 1,998" maxLength={11} value={displacement}
                    aria-invalid={displacement !== "" && !validCc} aria-describedby="car-cc-hint"
                    onChange={(event) => setDisplacement(event.target.value.replace(/,/g, "").trim())} />
                  <span className="input-money__unit" aria-hidden="true">cc</span>
                </div>
                <p className="field__hint" id="car-cc-hint">
                  {displacement && !validCc ? "배기량은 양의 정수로 입력해 주세요." : "자동차등록증에 적힌 배기량을 입력해 주세요."}
                </p>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="car-year">최초 등록 연도</label>
                <div className="input-money">
                  <input id="car-year" type="text" inputMode="numeric" autoComplete="off" required
                    placeholder="예: 2022" value={registered}
                    aria-invalid={registered !== "" && !validYear} aria-describedby="car-year-hint"
                    onChange={(event) => setRegistered(event.target.value.trim())} />
                  <span className="input-money__unit" aria-hidden="true">년</span>
                </div>
                <p className="field__hint" id="car-year-hint">
                  {registered && !validYear ? "2026년까지의 연도를 네 자리로 입력해 주세요." : "차가 처음 등록된 연도로 차령을 계산해요."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="calc__result" aria-labelledby="car-result">
        <section className="panel panel--result">
          <h2 id="car-result" className="panel__title">2기분(12월) 예상액</h2>
          <div aria-live="polite" aria-atomic="true">
            {annual !== undefined && total !== undefined ? (
              <>
                <p className="result__value">{formatWon(total / 2)}</p>
                <p className="result__sub">나누어 낼 때의 12월 금액 · 지방교육세 포함</p>
                {annual <= 100_000 && (
                  <p className="result__note">연세액이 10만원 이하라 지자체에서 6월에 전액 고지할 수 있어요. 전액 냈다면 12월에 따로 낼 금액은 없어요.</p>
                )}
                <p className="result__sub">자동차세 연세액 {formatWon(annual)} · 지방교육세 {formatWon(annual * 30 / 100)}</p>
                <p className="result__sub">지방교육세 포함 연세액 {formatWon(total)}</p>
                {engine && <p className="result__sub">cc당 {engine.rate}원 · 차령 {engine.age}년 · 경감률 {engine.discount}%</p>}
              </>
            ) : (
              <p className="result__sub">배기량과 최초 등록 연도를 바르게 입력하면 예상액이 나와요.</p>
            )}
          </div>
          <p className="result__note">
            표준세율 기준이며 지자체 조례에 따라 달라질 수 있어요. 원 단위 절사 때문에 고지서와 수십 원 차이가 날 수 있어요.
            연납이나 보유기간에 따른 일할 계산을 반영한 실제 납부액은 고지서나 위택스에서 확인해 주세요.
          </p>
        </section>
      </aside>
    </div>
  );
}
