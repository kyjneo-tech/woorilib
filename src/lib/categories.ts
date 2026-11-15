export type CategorySlug = "money" | "insurance" | "living";

export type Category = {
  slug: CategorySlug;
  label: string;
  title: string;
  description: string;
};

export const CATEGORIES: Record<CategorySlug, Category> = {
  money: {
    slug: "money",
    label: "돈·세금",
    title: "돈·세금",
    description:
      "연말정산, 공제·감면, 카드·계좌 관리처럼 해마다 반복되는 돈 문제를 제도 원문 기준으로 정리합니다.",
  },
  insurance: {
    slug: "insurance",
    label: "보험·의료비",
    title: "보험·의료비",
    description:
      "실손보험 청구, 자기부담금, 병원비 서류처럼 헷갈리는 보험·의료비 절차를 한 번에 정리합니다.",
  },
  living: {
    slug: "living",
    label: "생활·테크",
    title: "생활·테크",
    description:
      "집안 인터넷, 무선 공유기, 생활 속 기기 설정처럼 직접 손으로 고칠 수 있는 문제를 다룹니다.",
  },
};

export const CATEGORY_LIST: Category[] = [
  CATEGORIES.money,
  CATEGORIES.insurance,
  CATEGORIES.living,
];

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORIES;
}

export function categoryOf(slug: string): Category {
  if (!isCategorySlug(slug)) {
    throw new Error(
      `알 수 없는 카테고리입니다: "${slug}" (가능한 값: ${Object.keys(CATEGORIES).join(", ")})`,
    );
  }
  return CATEGORIES[slug];
}
