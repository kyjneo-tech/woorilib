import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 기본 산출물 경로는 .next (Vercel 표준). 로컬 검증용으로만 환경변수로 바꿀 수 있다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // 정적 페이지 중심 (SSG) — DB, 서버 전용 런타임 의존성 없음. Vercel 무료 플랜에서 환경변수 0개로 빌드.
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // 커버 이미지는 빌드 시 public/에 들어간 정적 PNG. 원격 이미지 도메인 없음.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1200],
    imageSizes: [96, 160, 240, 320],
  },
  async headers() {
    return [
      {
        source: "/ads.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        source: "/feed.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
