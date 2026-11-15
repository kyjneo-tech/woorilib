#!/usr/bin/env python3
"""
woorilib.com 커버 이미지 생성기 (Pillow).

- public/images/posts/*.png : 글 커버 (1200x630)
- public/images/og-default.png : 기본 OG 이미지
- public/icon.png, public/apple-icon.png : 파비콘

실행: python3 scripts/generate-covers.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = (251, 250, 246)
INK = (23, 25, 27)
INK_SOFT = (61, 69, 74)
MUTED = (107, 116, 120)
LINE = (228, 224, 214)
ACCENT = (27, 94, 75)
ACCENT_SOFT = (233, 241, 237)
WARM = (168, 73, 38)

FONT_SERIF = "/usr/share/fonts/pickle-hwp/NotoSerifCJKkr-Regular.otf"
FONT_SANS = "/usr/share/fonts/pickle-hwp/NotoSansCJKkr-Regular.otf"
OUT_POSTS = "public/images/posts"


def font(path, size):
    return ImageFont.truetype(path, size)


def text_w(draw, text, f):
    box = draw.textbbox((0, 0), text, font=f)
    return box[2] - box[0]


def cover(
    path,
    category,
    title_lines,
    subtitle,
    badge=None,
    accent=ACCENT,
    accent_soft=ACCENT_SOFT,
):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # 상단 브랜드 라인
    d.rectangle([80, 46, 92, 68], fill=accent)
    f_brand = font(FONT_SERIF, 26)
    d.text((104, 40), "우리집 라이브러리", font=f_brand, fill=INK)

    # 카테고리 칩 (우상단)
    f_cat = font(FONT_SANS, 22)
    cw = text_w(d, category, f_cat)
    chip_x1 = W - 80
    chip_x0 = chip_x1 - cw - 34
    d.rounded_rectangle([chip_x0, 38, chip_x1, 82], radius=22, fill=accent_soft)
    d.text((chip_x0 + 17, 46), category, font=f_cat, fill=accent)

    # 제목 — 아래 요소(배지·부제·푸터)가 겹치지 않도록 시작점을 위에서 고정
    size = 74
    longest = max(len(line) for line in title_lines)
    if longest > 13:
        size = 66
    if longest > 16:
        size = 58
    f_title = font(FONT_SERIF, size)
    line_h = int(size * 1.36)
    start_y = 156
    title_bottom = start_y + line_h * (len(title_lines) - 1) + int(size * 1.02)
    d.rectangle([76, start_y + 6, 82, title_bottom], fill=accent)
    for i, line in enumerate(title_lines):
        d.text((108, start_y + i * line_h), line, font=f_title, fill=INK)

    # 배지(강조 문구)
    y = title_bottom + 26
    if badge:
        f_badge = font(FONT_SANS, 27)
        bw = text_w(d, badge, f_badge)
        d.rounded_rectangle([108, y, 108 + bw + 34, y + 50], radius=10, fill=accent_soft)
        d.text((125, y + 8), badge, font=f_badge, fill=accent)
        y += 68

    # 부제
    if subtitle:
        f_sub = font(FONT_SANS, 26)
        for i, line in enumerate(subtitle):
            d.text((108, y + i * 40), line, font=f_sub, fill=MUTED)
        y += 40 * len(subtitle)

    # 하단 라인 + 푸터
    d.line([80, 552, W - 80, 552], fill=LINE, width=2)
    f_foot = font(FONT_SANS, 23)
    d.text((80, 576), "woorilib.com", font=f_foot, fill=INK_SOFT)
    right = "생활 실용 가이드"
    d.text((W - 80 - text_w(d, right, f_foot), 576), right, font=f_foot, fill=MUTED)

    img.save(path, "PNG", optimize=True)
    return path


def brand_card(path):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 8], fill=ACCENT)
    d.rectangle([80, 92, 96, 122], fill=ACCENT)
    d.text((112, 84), "우리집 라이브러리", font=font(FONT_SERIF, 34), fill=INK)

    d.text((80, 210), "생활 속 돈·보험·테크 문제를", font=font(FONT_SERIF, 66), fill=INK)
    d.text((80, 296), "근거부터 정리합니다", font=font(FONT_SERIF, 66), fill=INK)

    f = font(FONT_SANS, 28)
    d.text((80, 420), "연말정산 · 실손보험 청구 · 집안 인터넷 점검", font=f, fill=MUTED)

    d.line([80, 520, W - 80, 520], fill=LINE, width=2)
    f2 = font(FONT_SANS, 23)
    d.text((80, 546), "woorilib.com", font=f2, fill=INK_SOFT)
    right = "생활 실용 가이드 매거진"
    d.text((W - 80 - text_w(d, right, f2), 546), right, font=f2, fill=MUTED)
    img.save(path, "PNG", optimize=True)
    return path


def icon(path, size):
    img = Image.new("RGB", (size, size), ACCENT)
    d = ImageDraw.Draw(img)
    s = size / 512
    # 책 세 권 실루엣
    bars = [(150, 150, 60, 250), (230, 120, 60, 280), (310, 180, 60, 220)]
    for x, y, w, h in bars:
        d.rounded_rectangle(
            [x * s, y * s, (x + w) * s, (y + h) * s], radius=int(10 * s), fill=(251, 250, 246)
        )
    d.rounded_rectangle(
        [150 * s, 400 * s, 370 * s, 424 * s], radius=int(8 * s), fill=(251, 250, 246)
    )
    img.save(path, "PNG", optimize=True)
    return path


def main():
    os.makedirs(OUT_POSTS, exist_ok=True)
    os.makedirs("public", exist_ok=True)

    cover(
        f"{OUT_POSTS}/card-deduction-2026.png",
        "돈·세금",
        ["2026년 연말정산", "카드 공제 한도"],
        ["총급여 25% 문턱부터 한도까지", "자녀 수에 따라 달라진 기본한도 정리"],
        badge="자녀 1명 350만 · 2명 400만원",
    )
    cover(
        f"{OUT_POSTS}/silson-claim-2026.png",
        "보험·의료비",
        ["실손보험 청구,", "서류 없이 끝내기"],
        ["실손24 전산 청구 절차", "세대별 자기부담률과 특약 확인"],
        badge="병원 서류 없이 앱으로",
    )
    cover(
        f"{OUT_POSTS}/wifi-slow-check.png",
        "생활·테크",
        ["집 와이파이가", "느려졌을 때"],
        ["공유기 위치 · 대역 · 채널 순서로", "돈 안 들이는 점검 8단계"],
        badge="유선과 무선부터 갈라 보기",
    )
    brand_card("public/images/og-default.png")
    icon("public/icon.png", 512)
    icon("public/apple-icon.png", 180)
    print("done")


if __name__ == "__main__":
    main()
