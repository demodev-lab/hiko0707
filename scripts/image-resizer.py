#!/usr/bin/env python3
"""
HiKo 이미지 리사이저
핫딜 썸네일을 400x300px로 표준화하는 스크립트
"""

import os
import sys
from PIL import Image
from pathlib import Path

def resize_image(input_path, output_path, size=(400, 300)):
    """
    이미지를 지정된 크기로 리사이즈
    비율을 유지하면서 크롭
    """
    try:
        with Image.open(input_path) as img:
            # RGBA를 RGB로 변환 (JPEG 저장을 위해)
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            
            # 비율 유지하면서 리사이즈
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # 정확한 크기로 크롭
            if img.size != size:
                # 중앙 크롭
                left = (img.width - size[0]) / 2
                top = (img.height - size[1]) / 2
                right = left + size[0]
                bottom = top + size[1]
                img = img.crop((left, top, right, bottom))
            
            # 저장
            img.save(output_path, 'JPEG', quality=85, optimize=True)
            print(f"✓ 리사이즈 완료: {output_path}")
            
    except Exception as e:
        print(f"✗ 에러 발생: {input_path} - {str(e)}")

def process_directory(input_dir, output_dir):
    """
    디렉토리 내 모든 이미지 처리
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # 출력 디렉토리 생성
    output_path.mkdir(parents=True, exist_ok=True)
    
    # 이미지 파일 찾기
    image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    images = []
    
    for ext in image_extensions:
        images.extend(input_path.glob(f'*{ext}'))
        images.extend(input_path.glob(f'*{ext.upper()}'))
    
    print(f"총 {len(images)}개 이미지 발견")
    
    # 각 이미지 처리
    for img_path in images:
        output_file = output_path / f"{img_path.stem}_thumb.jpg"
        resize_image(img_path, output_file)

def main():
    if len(sys.argv) < 2:
        print("사용법: python image-resizer.py <input_path> [output_path]")
        print("  - input_path: 이미지 파일 또는 디렉토리")
        print("  - output_path: 출력 경로 (기본값: input_path_thumbs)")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    if os.path.isfile(input_path):
        # 단일 파일 처리
        output_path = sys.argv[2] if len(sys.argv) > 2 else f"{os.path.splitext(input_path)[0]}_thumb.jpg"
        resize_image(input_path, output_path)
    elif os.path.isdir(input_path):
        # 디렉토리 처리
        output_path = sys.argv[2] if len(sys.argv) > 2 else f"{input_path}_thumbs"
        process_directory(input_path, output_path)
    else:
        print(f"에러: {input_path}를 찾을 수 없습니다.")
        sys.exit(1)

if __name__ == "__main__":
    main()