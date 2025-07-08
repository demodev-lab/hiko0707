#!/usr/bin/env python3
"""
HiKo 핫딜 이미지 배치 처리 도구
크롤링된 핫딜 이미지를 일괄적으로 최적화하고 다양한 크기로 생성
"""

import os
import sys
import json
import shutil
from PIL import Image
from pathlib import Path
import argparse
from datetime import datetime
import hashlib

# 핫딜 이미지 사이즈 설정
HOTDEAL_IMAGE_SIZES = {
    "thumb": {"size": (400, 300), "quality": 85, "desc": "리스트 썸네일"},
    "thumb_mobile": {"size": (200, 150), "quality": 80, "desc": "모바일 썸네일"},
    "detail": {"size": (800, 600), "quality": 88, "desc": "상세 페이지"},
    "detail_mobile": {"size": (400, 300), "quality": 85, "desc": "모바일 상세"},
    "og": {"size": (1200, 630), "quality": 90, "desc": "소셜 미디어 공유"},
}

# 이미지 캐시 디렉토리
CACHE_DIR = Path("public/images/hotdeals")
PROCESSED_LOG = Path("scripts/processed_images.json")

class HotDealImageProcessor:
    def __init__(self):
        self.processed_images = self.load_processed_log()
        self.stats = {
            "processed": 0,
            "skipped": 0,
            "errors": 0,
            "total_size_before": 0,
            "total_size_after": 0
        }
    
    def load_processed_log(self):
        """처리된 이미지 로그 로드"""
        if PROCESSED_LOG.exists():
            with open(PROCESSED_LOG, 'r') as f:
                return json.load(f)
        return {}
    
    def save_processed_log(self):
        """처리된 이미지 로그 저장"""
        PROCESSED_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(PROCESSED_LOG, 'w') as f:
            json.dump(self.processed_images, f, indent=2)
    
    def get_file_hash(self, filepath):
        """파일 해시 생성"""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def should_process_image(self, filepath):
        """이미지 처리 필요 여부 확인"""
        file_hash = self.get_file_hash(filepath)
        filename = str(filepath)
        
        if filename in self.processed_images:
            if self.processed_images[filename]["hash"] == file_hash:
                return False
        
        return True
    
    def process_image(self, input_path, hotdeal_id):
        """단일 이미지 처리"""
        input_file = Path(input_path)
        
        if not input_file.exists():
            print(f"✗ 파일을 찾을 수 없음: {input_path}")
            self.stats["errors"] += 1
            return
        
        # 처리 필요 여부 확인
        if not self.should_process_image(input_file):
            print(f"⏭️  이미 처리됨: {input_file.name}")
            self.stats["skipped"] += 1
            return
        
        # 원본 파일 크기
        original_size = input_file.stat().st_size
        self.stats["total_size_before"] += original_size
        
        # 출력 디렉토리 생성
        output_dir = CACHE_DIR / hotdeal_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
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
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 각 사이즈별로 이미지 생성
                for size_name, config in HOTDEAL_IMAGE_SIZES.items():
                    output_file = output_dir / f"{hotdeal_id}_{size_name}.jpg"
                    self.create_resized_image(img, output_file, config)
                    self.stats["total_size_after"] += output_file.stat().st_size
            
            # 처리 완료 기록
            self.processed_images[str(input_file)] = {
                "hash": self.get_file_hash(input_file),
                "processed_at": datetime.now().isoformat(),
                "hotdeal_id": hotdeal_id,
                "original_size": original_size
            }
            
            self.stats["processed"] += 1
            print(f"✓ 처리 완료: {input_file.name} → {hotdeal_id}")
            
        except Exception as e:
            print(f"✗ 에러 발생: {input_file.name} - {str(e)}")
            self.stats["errors"] += 1
    
    def create_resized_image(self, img, output_path, config):
        """이미지 리사이즈 및 최적화"""
        size = config["size"]
        quality = config["quality"]
        
        # 원본 비율 계산
        img_ratio = img.width / img.height
        target_ratio = size[0] / size[1]
        
        # 스마트 크롭
        if img_ratio > target_ratio:
            # 이미지가 더 넓음 - 높이 기준으로 리사이즈
            new_height = size[1]
            new_width = int(new_height * img_ratio)
        else:
            # 이미지가 더 높음 - 너비 기준으로 리사이즈
            new_width = size[0]
            new_height = int(new_width / img_ratio)
        
        # 리사이즈
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # 중앙 크롭
        left = (resized.width - size[0]) // 2
        top = (resized.height - size[1]) // 2
        right = left + size[0]
        bottom = top + size[1]
        
        cropped = resized.crop((left, top, right, bottom))
        
        # 저장 (프로그레시브 JPEG)
        cropped.save(
            output_path, 
            'JPEG', 
            quality=quality, 
            optimize=True,
            progressive=True
        )
    
    def process_mock_data_images(self):
        """Mock 데이터의 이미지 URL을 실제 로컬 이미지로 처리"""
        # Mock 데이터 로드
        mock_data_path = Path("lib/db/hotdeal-mock-data.json")
        if not mock_data_path.exists():
            print("✗ Mock 데이터 파일을 찾을 수 없습니다.")
            return
        
        with open(mock_data_path, 'r') as f:
            hotdeals = json.load(f)
        
        print(f"📸 {len(hotdeals)}개 핫딜 이미지 처리 시작...")
        
        # 샘플 이미지 디렉토리 (실제 환경에서는 크롤링된 이미지 경로)
        sample_images_dir = Path("scripts/sample_images")
        sample_images_dir.mkdir(exist_ok=True)
        
        # 테스트용 샘플 이미지 생성
        if not any(sample_images_dir.iterdir()):
            self.create_sample_images(sample_images_dir)
        
        # 각 핫딜에 대해 이미지 처리
        for i, hotdeal in enumerate(hotdeals[:10]):  # 테스트로 10개만
            # 샘플 이미지 선택 (실제로는 크롤링된 이미지 경로)
            category = hotdeal.get("category", "other")
            sample_image = sample_images_dir / f"sample_{category}.jpg"
            
            if not sample_image.exists():
                sample_image = sample_images_dir / "sample_other.jpg"
            
            if sample_image.exists():
                self.process_image(sample_image, hotdeal["id"])
        
        # 처리 로그 저장
        self.save_processed_log()
        
        # 통계 출력
        self.print_stats()
    
    def create_sample_images(self, output_dir):
        """테스트용 고품질 샘플 이미지 생성"""
        from PIL import ImageDraw, ImageFont, ImageFilter
        import random
        
        categories = {
            "electronics": {
                "colors": [(25, 42, 86), (31, 64, 104), (58, 90, 178)],
                "products": ["노트북", "스마트폰", "헤드폰", "태블릿", "스마트워치"]
            },
            "food": {
                "colors": [(255, 87, 51), (255, 139, 96), (255, 195, 160)],
                "products": ["한우세트", "과일박스", "건강식품", "간편식", "음료세트"]
            },
            "beauty": {
                "colors": [(255, 192, 203), (255, 182, 193), (255, 105, 180)],
                "products": ["스킨케어", "메이크업", "향수", "헤어케어", "바디케어"]
            },
            "home": {
                "colors": [(64, 224, 208), (72, 209, 204), (0, 206, 209)],
                "products": ["가전제품", "주방용품", "인테리어", "침구류", "청소용품"]
            },
            "sports": {
                "colors": [(50, 205, 50), (124, 252, 0), (173, 255, 47)],
                "products": ["운동화", "운동복", "헬스기구", "요가용품", "캠핑장비"]
            },
            "other": {
                "colors": [(147, 112, 219), (138, 43, 226), (186, 85, 211)],
                "products": ["문구류", "완구", "도서", "디지털", "기타상품"]
            }
        }
        
        for category, config in categories.items():
            # 고품질 이미지 생성 (더 큰 크기로 시작)
            img = Image.new('RGB', (1600, 1200), (245, 245, 245))
            draw = ImageDraw.Draw(img)
            
            # 그라디언트 배경
            base_color = config["colors"][0]
            for y in range(1200):
                # 부드러운 그라디언트
                factor = y / 1200
                r = int(base_color[0] + (255 - base_color[0]) * factor * 0.7)
                g = int(base_color[1] + (255 - base_color[1]) * factor * 0.7)
                b = int(base_color[2] + (255 - base_color[2]) * factor * 0.7)
                draw.line([(0, y), (1600, y)], fill=(r, g, b))
            
            # 장식적 요소 추가
            # 원형 패턴
            for _ in range(15):
                x = random.randint(0, 1600)
                y = random.randint(0, 1200)
                size = random.randint(50, 200)
                opacity = random.randint(10, 30)
                color = (*config["colors"][random.randint(0, len(config["colors"])-1)], opacity)
                draw.ellipse([x-size, y-size, x+size, y+size], fill=color)
            
            # 제품 카드 효과
            card_x, card_y = 400, 300
            card_w, card_h = 800, 600
            
            # 카드 그림자
            shadow = Image.new('RGBA', (card_w + 40, card_h + 40), (0, 0, 0, 0))
            shadow_draw = ImageDraw.Draw(shadow)
            shadow_draw.rounded_rectangle([20, 20, card_w + 20, card_h + 20], 
                                        radius=20, fill=(0, 0, 0, 80))
            shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
            img.paste(shadow, (card_x - 20, card_y - 20), shadow)
            
            # 메인 카드
            draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], 
                                 radius=20, fill=(255, 255, 255))
            
            # 카테고리 헤더
            header_color = config["colors"][0]
            draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 100], 
                                 radius=20, fill=header_color)
            draw.rectangle([card_x, card_y + 80, card_x + card_w, card_y + 100], 
                         fill=header_color)
            
            # 텍스트 추가
            try:
                # 큰 폰트가 없으면 기본 폰트 사용
                title_font = ImageFont.load_default()
                price_font = ImageFont.load_default()
                desc_font = ImageFont.load_default()
            except:
                title_font = price_font = desc_font = None
            
            # 카테고리 이름
            category_text = category.upper()
            if title_font:
                bbox = draw.textbbox((0, 0), category_text, font=title_font)
                text_w = bbox[2] - bbox[0]
                draw.text((card_x + (card_w - text_w) // 2, card_y + 40), 
                         category_text, fill='white', font=title_font)
            
            # 제품명
            product = random.choice(config["products"])
            product_text = f"프리미엄 {product} 특가"
            draw.text((card_x + 50, card_y + 150), product_text, 
                     fill=(50, 50, 50), font=title_font)
            
            # 가격 정보
            original_price = random.randint(50000, 500000)
            discount = random.randint(30, 70)
            sale_price = int(original_price * (100 - discount) / 100)
            
            # 할인율 뱃지
            badge_x, badge_y = card_x + card_w - 150, card_y + 130
            draw.ellipse([badge_x, badge_y, badge_x + 100, badge_y + 100], 
                        fill=(255, 51, 51))
            draw.text((badge_x + 30, badge_y + 40), f"{discount}%", 
                     fill='white', font=price_font)
            
            # 가격
            draw.text((card_x + 50, card_y + 250), f"₩{original_price:,}", 
                     fill=(150, 150, 150), font=price_font)
            draw.line([(card_x + 50, card_y + 270), (card_x + 150, card_y + 270)], 
                     fill=(150, 150, 150), width=2)
            draw.text((card_x + 50, card_y + 300), f"₩{sale_price:,}", 
                     fill=(255, 51, 51), font=price_font)
            
            # 추가 정보
            features = ["무료배송", "당일발송", "카드할인", "쿠폰적용가"]
            y_offset = 400
            for feature in random.sample(features, 3):
                draw.text((card_x + 50, card_y + y_offset), f"✓ {feature}", 
                         fill=(100, 100, 100), font=desc_font)
                y_offset += 40
            
            # 하단 CTA
            cta_y = card_y + card_h - 80
            draw.rounded_rectangle([card_x + 50, cta_y, card_x + card_w - 50, cta_y + 50], 
                                 radius=25, fill=header_color)
            cta_text = "지금 구매하기"
            if desc_font:
                bbox = draw.textbbox((0, 0), cta_text, font=desc_font)
                text_w = bbox[2] - bbox[0]
                draw.text((card_x + (card_w - text_w) // 2, cta_y + 20), 
                         cta_text, fill='white', font=desc_font)
            
            # 고품질로 저장 (리사이즈하여 최종 크기로)
            img = img.resize((800, 600), Image.Resampling.LANCZOS)
            output_path = output_dir / f"sample_{category}.jpg"
            img.save(output_path, 'JPEG', quality=95, optimize=True)
            print(f"✓ 고품질 샘플 이미지 생성: {output_path}")
    
    def print_stats(self):
        """처리 통계 출력"""
        print("\n📊 이미지 처리 통계:")
        print(f"  - 처리됨: {self.stats['processed']}개")
        print(f"  - 건너뜀: {self.stats['skipped']}개")
        print(f"  - 에러: {self.stats['errors']}개")
        
        if self.stats['total_size_before'] > 0:
            reduction = (1 - self.stats['total_size_after'] / self.stats['total_size_before']) * 100
            print(f"\n💾 용량 최적화:")
            print(f"  - 원본: {self.stats['total_size_before'] / 1024 / 1024:.2f}MB")
            print(f"  - 최적화: {self.stats['total_size_after'] / 1024 / 1024:.2f}MB")
            print(f"  - 절감률: {reduction:.1f}%")

def main():
    parser = argparse.ArgumentParser(description="HiKo 핫딜 이미지 배치 처리")
    parser.add_argument("--mock", action="store_true", help="Mock 데이터 이미지 처리")
    parser.add_argument("--input", help="입력 이미지 디렉토리")
    parser.add_argument("--clean", action="store_true", help="캐시 디렉토리 정리")
    
    args = parser.parse_args()
    
    processor = HotDealImageProcessor()
    
    if args.clean:
        if CACHE_DIR.exists():
            shutil.rmtree(CACHE_DIR)
            print("✓ 캐시 디렉토리 정리 완료")
        if PROCESSED_LOG.exists():
            PROCESSED_LOG.unlink()
            print("✓ 처리 로그 초기화 완료")
        return
    
    if args.mock:
        processor.process_mock_data_images()
    elif args.input:
        # 디렉토리 내 모든 이미지 처리
        input_dir = Path(args.input)
        if not input_dir.exists():
            print(f"✗ 디렉토리를 찾을 수 없음: {input_dir}")
            return
        
        image_files = []
        for ext in ['.jpg', '.jpeg', '.png', '.webp']:
            image_files.extend(input_dir.glob(f'*{ext}'))
            image_files.extend(input_dir.glob(f'*{ext.upper()}'))
        
        print(f"📸 {len(image_files)}개 이미지 발견")
        
        for i, img_file in enumerate(image_files):
            # 파일명을 ID로 사용 (실제로는 핫딜 ID 매핑 필요)
            hotdeal_id = img_file.stem
            processor.process_image(img_file, hotdeal_id)
        
        processor.save_processed_log()
        processor.print_stats()
    else:
        print("사용법:")
        print("  Mock 데이터 처리: python hotdeal-image-processor.py --mock")
        print("  디렉토리 처리: python hotdeal-image-processor.py --input <디렉토리>")
        print("  캐시 정리: python hotdeal-image-processor.py --clean")

if __name__ == "__main__":
    main()