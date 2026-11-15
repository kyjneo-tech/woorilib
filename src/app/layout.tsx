import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { ADSENSE, SITE } from "@/lib/site";

const siteUrl = SITE.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} — 연말정산·보험·생활 테크 실용 가이드`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "연말정산",
    "신용카드 소득공제",
    "체크카드 공제",
    "실손보험 청구",
    "병원비 청구",
    "와이파이 속도",
    "생활 정보",
    "우리집 라이브러리",
  ],
  authors: [{ name: SITE.publisherName, url: siteUrl }],
  creator: SITE.publisherName,
  publisher: SITE.publisherName,
  category: "생활 정보",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: `${SITE.name} RSS` }],
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "ko_KR",
    url: siteUrl,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: SITE.defaultCover,
        width: 1200,
        height: 630,
        alt: `${SITE.name} 대표 이미지`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [SITE.defaultCover],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "google-adsense-account": ADSENSE.client,
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfaf6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: siteUrl,
    logo: { "@type": "ImageObject", url: `${siteUrl}${SITE.logo}` },
    description: SITE.description,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: siteUrl,
    inLanguage: "ko-KR",
    description: SITE.description,
    publisher: { "@type": "Organization", name: SITE.name, url: siteUrl },
  };

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&display=swap"
        />
        {/* Google AdSense — 게시자 ID: pub-4234312634957489 */}
        <script async src={ADSENSE.scriptSrc} crossOrigin="anonymous" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          본문으로 바로 가기
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <JsonLd data={[organization, website]} />
      </body>
    </html>
  );
}
