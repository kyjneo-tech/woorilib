# PWA 아이콘 생성 가이드

## 필요한 아이콘 크기
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## 생성 방법

### 방법 1: 온라인 도구 사용 (권장)
1. https://realfavicongenerator.net/ 방문
2. `icon.svg` 파일 업로드
3. 생성된 아이콘들 다운로드 후 이 폴더에 복사

### 방법 2: PWA Builder 사용
1. https://www.pwabuilder.com/imageGenerator 방문
2. `icon.svg` 업로드
3. 필요한 크기 선택 후 다운로드

### 방법 3: 로컬 도구 사용
```bash
# ImageMagick 설치 후
brew install imagemagick

# 스크립트 실행
./scripts/generate-icons.sh
```

## 색상 정보
- 주 색상 (Primary): #2E7D32
- 배경색 (Background): #FFFEF5
- 강조색 (Accent): #4CAF50

## Apple Touch Icon
iOS 홈 화면용으로 `apple-touch-icon.png` (180x180)도 생성하세요.
