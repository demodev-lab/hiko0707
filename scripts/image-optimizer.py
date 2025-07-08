#!/usr/bin/env python3
"""
HiKo 이미지 최적화 도구
웹앱의 다양한 섹션에 필요한 이미지를 자동으로 최적화하고 리사이즈
"""

import os
import sys
import json
from PIL import Image
from pathlib import Path
import argparse

# 이미지 사이즈 프리셋
IMAGE_PRESETS = {
    # 히어로 섹션
    "hero-desktop": {"size": (1920, 1080), "quality": 90, "desc": "히어로 섹션 데스크톱"},
    "hero-tablet": {"size": (1024, 768), "quality": 85, "desc": "히어로 섹션 태블릿"},
    "hero-mobile": {"size": (768, 1024), "quality": 85, "desc": "히어로 섹션 모바일"},
    
    # 랜딩 페이지 배너
    "landing-banner": {"size": (1440, 600), "quality": 88, "desc": "랜딩 페이지 배너"},
    "landing-feature": {"size": (600, 400), "quality": 85, "desc": "기능 소개 이미지"},
    
    # 핫딜 카드
    "hotdeal-thumb": {"size": (400, 300), "quality": 85, "desc": "핫딜 썸네일"},
    "hotdeal-detail": {"size": (800, 600), "quality": 88, "desc": "핫딜 상세 이미지"},
    
    # 카테고리 아이콘
    "category-icon": {"size": (120, 120), "quality": 90, "desc": "카테고리 아이콘"},
    "category-banner": {"size": (360, 200), "quality": 85, "desc": "카테고리 배너"},
    
    # 사용자 프로필
    "avatar-large": {"size": (200, 200), "quality": 90, "desc": "프로필 이미지 대"},
    "avatar-small": {"size": (80, 80), "quality": 85, "desc": "프로필 이미지 소"},
    
    # 소셜 미디어
    "og-image": {"size": (1200, 630), "quality": 90, "desc": "Open Graph 이미지"},
    "twitter-card": {"size": (1200, 675), "quality": 90, "desc": "트위터 카드 이미지"},
    
    # 프로모션
    "promo-banner": {"size": (728, 90), "quality": 85, "desc": "프로모션 배너"},
    "popup-image": {"size": (600, 800), "quality": 88, "desc": "팝업 이미지"},
}

def create_placeholder_image(size, text, output_path):
    """
    플레이스홀더 이미지 생성
    """
    from PIL import ImageDraw, ImageFont
    
    # 그라디언트 배경 생성
    img = Image.new('RGB', size, '#FF6B00')
    draw = ImageDraw.Draw(img)
    
    # 그라디언트 효과
    for i in range(size[1]):
        color_value = int(255 * (1 - i / size[1] * 0.3))
        color = (255, 107 + int((color_value - 107) * 0.3), color_value)
        draw.line([(0, i), (size[0], i)], fill=color)
    
    # 텍스트 추가
    try:
        font_size = min(size[0], size[1]) // 10
        # 기본 폰트 사용
        font = ImageFont.load_default()
    except:
        font = None
    
    # 중앙에 텍스트 배치
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # 텍스트 그림자
    draw.text((x+2, y+2), text, fill=(0, 0, 0, 128), font=font)
    draw.text((x, y), text, fill='white', font=font)
    
    # 크기 정보 추가
    size_text = f"{size[0]}x{size[1]}"
    size_bbox = draw.textbbox((0, 0), size_text, font=font)
    size_width = size_bbox[2] - size_bbox[0]
    
    draw.text((size[0] - size_width - 20, size[1] - 40), size_text, fill='white', font=font)
    
    img.save(output_path, 'JPEG', quality=90, optimize=True)
    print(f"✓ 플레이스홀더 생성: {output_path}")

def optimize_image(input_path, output_path, preset):
    """
    이미지 최적화 및 리사이즈
    """
    size = preset["size"]
    quality = preset["quality"]
    
    try:
        with Image.open(input_path) as img:
            # RGBA를 RGB로 변환
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img, mask=img.split()[1])
                img = background
            
            # 비율 계산
            img_ratio = img.width / img.height
            target_ratio = size[0] / size[1]
            
            if img_ratio > target_ratio:
                # 이미지가 더 넓음 - 높이 기준으로 리사이즈
                new_height = size[1]
                new_width = int(new_height * img_ratio)
            else:
                # 이미지가 더 높음 - 너비 기준으로 리사이즈
                new_width = size[0]
                new_height = int(new_width / img_ratio)
            
            # 리사이즈
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 중앙 크롭
            left = (img.width - size[0]) // 2
            top = (img.height - size[1]) // 2
            right = left + size[0]
            bottom = top + size[1]
            
            img = img.crop((left, top, right, bottom))
            
            # 저장
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
            print(f"✓ 최적화 완료: {output_path} ({preset['desc']})")
            
    except Exception as e:
        print(f"✗ 에러: {input_path} - {str(e)}")

def generate_image_set(input_path, output_dir, preset_names=None):
    """
    하나의 이미지로부터 여러 버전 생성
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # 사용할 프리셋 결정
    if preset_names:
        presets = {k: v for k, v in IMAGE_PRESETS.items() if k in preset_names}
    else:
        presets = IMAGE_PRESETS
    
    # 입력 파일명
    input_file = Path(input_path)
    base_name = input_file.stem
    
    # 각 프리셋별로 이미지 생성
    for preset_name, preset in presets.items():
        output_file = output_path / f"{base_name}_{preset_name}.jpg"
        
        if input_file.exists():
            optimize_image(input_path, output_file, preset)
        else:
            # 플레이스홀더 생성
            create_placeholder_image(
                preset["size"], 
                preset["desc"], 
                output_file
            )

def generate_sample_images(output_dir):
    """
    샘플 이미지 세트 생성
    """
    print("📸 HiKo 샘플 이미지 생성 중...")
    
    samples = {
        "hero": ["hero-desktop", "hero-tablet", "hero-mobile"],
        "landing": ["landing-banner", "landing-feature"],
        "hotdeal": ["hotdeal-thumb", "hotdeal-detail"],
        "category": ["category-icon", "category-banner"],
        "social": ["og-image", "twitter-card"],
    }
    
    for category, presets in samples.items():
        category_dir = Path(output_dir) / category
        category_dir.mkdir(parents=True, exist_ok=True)
        
        for preset_name in presets:
            preset = IMAGE_PRESETS[preset_name]
            output_file = category_dir / f"sample_{preset_name}.jpg"
            create_placeholder_image(
                preset["size"],
                f"HiKo {preset['desc']}",
                output_file
            )

def main():
    parser = argparse.ArgumentParser(description="HiKo 이미지 최적화 도구")
    parser.add_argument("input", nargs="?", help="입력 이미지 경로")
    parser.add_argument("-o", "--output", help="출력 디렉토리", default="optimized_images")
    parser.add_argument("-p", "--presets", nargs="+", help="사용할 프리셋 (기본: 전체)")
    parser.add_argument("--samples", action="store_true", help="샘플 이미지 생성")
    parser.add_argument("--list", action="store_true", help="사용 가능한 프리셋 목록")
    
    args = parser.parse_args()
    
    if args.list:
        print("📋 사용 가능한 이미지 프리셋:")
        print("-" * 60)
        for name, preset in IMAGE_PRESETS.items():
            print(f"{name:20} {preset['size'][0]:4}x{preset['size'][1]:4} - {preset['desc']}")
        return
    
    if args.samples:
        generate_sample_images(args.output)
        print(f"\n✅ 샘플 이미지가 {args.output} 디렉토리에 생성되었습니다.")
        return
    
    if not args.input:
        print("사용법: python image-optimizer.py <이미지경로> [옵션]")
        print("샘플 생성: python image-optimizer.py --samples")
        print("프리셋 목록: python image-optimizer.py --list")
        return
    
    generate_image_set(args.input, args.output, args.presets)
    print(f"\n✅ 이미지 최적화가 완료되었습니다: {args.output}")

if __name__ == "__main__":
    main()