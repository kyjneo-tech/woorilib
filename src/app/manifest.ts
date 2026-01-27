import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '우리아이도서관',
    short_name: '우리아이도서관',
    description: '우리 아이 책, 현명하게 골라 합리적으로 구해요. 도서관, 중고서점에서 책을 찾고 독서 기록을 남겨보세요.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFEF5',
    theme_color: '#2E7D32',
    orientation: 'portrait',
    categories: ['education', 'books', 'kids'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: '홈 화면',
      },
      {
        src: '/screenshots/search.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: '책 검색',
      },
    ],
  };
}
