import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우리아이도서관 - 아이 책, 현명하게 골라 합리적으로',
  description: '0-8세 자녀를 위한 책 추천 및 도서관/중고/새책 획득 가이드. 나이에 맞는 책을 추천받고, 가장 합리적인 방법으로 구해보세요.',
  keywords: ['아이 책 추천', '유아 도서', '어린이 도서관', '중고책', '그림책 추천', '동화책'],
  authors: [{ name: '우리아이도서관' }],
  creator: '우리아이도서관',
  publisher: '우리아이도서관',
  
  // Open Graph (카카오톡, 페이스북 공유)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://woorilib.com',
    siteName: '우리아이도서관',
    title: '우리아이도서관 - 아이 책, 현명하게 골라 합리적으로',
    description: '0-8세 자녀를 위한 책 추천 및 도서관/중고/새책 획득 가이드',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '우리아이도서관',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '우리아이도서관',
    description: '0-8세 자녀를 위한 책 추천 및 획득 가이드',
    images: ['/og-image.png'],
  },
  
  // App 관련
  applicationName: '우리아이도서관',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '우리아이도서관',
  },
  
  // 아이콘
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-96x96.png',
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  
  // 기타
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2E7D32',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        {/* PWA 관련 메타 태그 */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="우리아이도서관" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Kakao Map SDK */}
        {kakaoMapKey && (
          <script
            type="text/javascript"
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&libraries=services&autoload=false`}
            async
          />
        )}
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
