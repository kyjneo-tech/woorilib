#!/bin/bash

# PWA 아이콘 생성 스크립트
# 사용법: ./scripts/generate-icons.sh
# 필요 도구: sharp-cli 또는 ImageMagick

# SVG 소스 파일
SVG_SOURCE="public/icons/icon.svg"
OUTPUT_DIR="public/icons"

# 생성할 아이콘 크기들
SIZES="72 96 128 144 152 192 384 512"

echo "PWA 아이콘 생성 중..."

# sharp-cli 사용 시 (npm install -g sharp-cli)
if command -v sharp &> /dev/null; then
    for size in $SIZES; do
        echo "  생성 중: icon-${size}x${size}.png"
        sharp -i "$SVG_SOURCE" -o "$OUTPUT_DIR/icon-${size}x${size}.png" resize $size $size
    done
    echo "완료! sharp-cli 사용"
    exit 0
fi

# ImageMagick 사용 시
if command -v convert &> /dev/null; then
    for size in $SIZES; do
        echo "  생성 중: icon-${size}x${size}.png"
        convert -background none -resize ${size}x${size} "$SVG_SOURCE" "$OUTPUT_DIR/icon-${size}x${size}.png"
    done
    echo "완료! ImageMagick 사용"
    exit 0
fi

# rsvg-convert 사용 시
if command -v rsvg-convert &> /dev/null; then
    for size in $SIZES; do
        echo "  생성 중: icon-${size}x${size}.png"
        rsvg-convert -w $size -h $size "$SVG_SOURCE" -o "$OUTPUT_DIR/icon-${size}x${size}.png"
    done
    echo "완료! rsvg-convert 사용"
    exit 0
fi

echo "오류: 아이콘 변환 도구를 찾을 수 없습니다."
echo ""
echo "다음 중 하나를 설치해주세요:"
echo "  1. sharp-cli: npm install -g sharp-cli"
echo "  2. ImageMagick: brew install imagemagick"
echo "  3. librsvg: brew install librsvg"
echo ""
echo "또는 온라인 도구를 사용하세요:"
echo "  - https://realfavicongenerator.net/"
echo "  - https://www.pwabuilder.com/imageGenerator"

exit 1
