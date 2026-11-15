import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-*/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // App Router 루트 레이아웃에서 <head>에 직접 넣는 폰트/스타일 링크는 한 번만 로드된다.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;
