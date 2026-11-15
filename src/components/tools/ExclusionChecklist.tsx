"use client";

import { useState } from "react";

type Item = { id: string; label: string; reason: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "요금·세금",
    items: [
      { id: "maintenance", label: "아파트 관리비", reason: "공과금 성격이라 공제 대상이 아닙니다." },
      { id: "utilities", label: "전기·수도·가스", reason: "요금 자체는 제외됩니다." },
      { id: "telecom", label: "통신·인터넷 요금", reason: "통신요금은 제외, 휴대폰 소액결제 콘텐츠는 포함될 수 있습니다." },
      { id: "taxes", label: "국세·지방세", reason: "세금 납부는 카드 사용액에서 빠집니다." },
      { id: "toll", label: "도로통행료", reason: "통행료는 공제 대상이 아닙니다." },
    ],
  },
  {
    title: "보험·공적 부담",
    items: [
      { id: "social", label: "건강보험료·국민연금", reason: "보험료는 소득공제 항목이지만 카드 공제에는 넣지 않습니다." },
      { id: "insurance", label: "보험계약 보험료", reason: "보장성 보험료는 별도 공제(보험료 세액공제)로 처리합니다." },
      { id: "school", label: "학교 수업료·입학금", reason: "공납금은 카드 사용액에서 제외됩니다." },
      { id: "childcare", label: "어린이집 보육비", reason: "보육비도 공제 대상 사용액이 아닙니다." },
    ],
  },
  {
    title: "재산·자산",
    items: [
      { id: "newcar", label: "신차 구입비", reason: "취득세·등록면허세가 부과되는 재산 구입비는 제외입니다." },
      { id: "giftcard", label: "상품권·유가증권 구입", reason: "현금성 자산 구입은 사용액으로 보지 않습니다." },
      { id: "lease", label: "리스료", reason: "리스료는 공제 대상이 아닙니다." },
    ],
  },
  {
    title: "해외·면세",
    items: [
      { id: "overseas", label: "해외 결제", reason: "국외 사용분은 제외됩니다." },
      { id: "dutyfree", label: "면세점 구입", reason: "지정면세점 구입비는 제외됩니다." },
    ],
  },
  {
    title: "그 밖에",
    items: [
      { id: "company", label: "회사 경비 처리분", reason: "법인·회사 경비로 정산한 금액은 빼야 합니다." },
      { id: "rent", label: "세액공제 받은 월세", reason: "월세 세액공제를 받은 금액은 카드 공제와 중복되지 않습니다." },
      { id: "donation", label: "세액공제 받은 기부금", reason: "기부금 세액공제와 중복 적용되지 않습니다." },
    ],
  },
];

const TOTAL = GROUPS.reduce((sum, group) => sum + group.items.length, 0);

export function ExclusionChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const count = Object.values(checked).filter(Boolean).length;

  return (
    <div className="checklist">
      <div className="checklist__head">
        <p className="checklist__count">
          <strong>{count}</strong> / {TOTAL}개 해당
        </p>
        <button
          type="button"
          className="linkish"
          onClick={() => setChecked({})}
          disabled={count === 0}
        >
          모두 해제
        </button>
      </div>
      <p className="checklist__help">
        지난 1년 명세서에서 해당되는 항목을 눌러 보세요. 체크한 항목은 카드값에는 찍혀도 소득공제에는
        들어가지 않습니다.
      </p>

      {GROUPS.map((group) => (
        <div className="checklist__group" key={group.title}>
          <p className="checklist__group-title">{group.title}</p>
          <ul className="checklist__items">
            {group.items.map((item) => {
              const isOn = Boolean(checked[item.id]);
              return (
                <li key={item.id}>
                  <label className={isOn ? "check-item is-on" : "check-item"}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={(event) =>
                        setChecked((prev) => ({ ...prev, [item.id]: event.target.checked }))
                      }
                    />
                    <span className="check-item__body">
                      <span className="check-item__label">{item.label}</span>
                      <span className="check-item__reason">{item.reason}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {count > 0 ? (
        <p className="checklist__result">
          {count}개 항목이 공제 대상이 아닙니다. 위 계산기의 &lsquo;공제 제외 지출 빼기&rsquo;에 금액을
          넣으면 실제 공제액에 가깝게 계산됩니다.
        </p>
      ) : null}
    </div>
  );
}
