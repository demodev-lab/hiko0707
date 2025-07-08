#!/usr/bin/env python3
"""
HiKo 샘플 이미지 다운로더
Unsplash API를 사용하여 고품질 샘플 이미지를 다운로드합니다.
"""

import os
import json
import requests
from pathlib import Path
import time

class SampleImageDownloader:
    def __init__(self):
        self.output_dir = Path("public/images/samples")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Unsplash 검색 키워드 (카테고리별)
        self.search_terms = {
            "electronics": ["laptop computer", "smartphone", "headphones", "tablet", "smartwatch"],
            "food": ["korean food", "food box", "fresh fruit", "grocery", "meal kit"],
            "beauty": ["cosmetics", "skincare", "makeup", "perfume", "beauty products"],
            "home": ["home appliance", "furniture", "kitchen", "bedroom", "living room"],
            "sports": ["running shoes", "sports wear", "fitness", "yoga", "outdoor gear"]
        }
        
        # Picsum Photos를 사용한 카테고리별 이미지 ID
        self.picsum_ids = {
            "electronics": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            "food": [292, 312, 326, 429, 488, 493, 494, 835, 836, 837],
            "beauty": [64, 65, 103, 104, 157, 177, 178, 180, 219, 220],
            "home": [164, 165, 166, 168, 169, 271, 272, 293, 294, 295],
            "sports": [336, 338, 348, 349, 357, 358, 362, 385, 386, 387]
        }
    
    def download_picsum_images(self):
        """Picsum Photos에서 카테고리별 이미지 다운로드"""
        print("📥 Picsum Photos에서 샘플 이미지 다운로드 중...")
        
        for category, image_ids in self.picsum_ids.items():
            category_dir = self.output_dir / category
            category_dir.mkdir(exist_ok=True)
            
            for i, img_id in enumerate(image_ids[:5]):  # 카테고리당 5개씩
                # 다양한 크기로 다운로드
                sizes = [
                    ("thumb", 400, 300),
                    ("detail", 800, 600),
                    ("og", 1200, 630)
                ]
                
                for size_name, width, height in sizes:
                    url = f"https://picsum.photos/id/{img_id}/{width}/{height}"
                    output_file = category_dir / f"{category}_{i+1}_{size_name}.jpg"
                    
                    if output_file.exists():
                        print(f"⏭️  이미 존재: {output_file.name}")
                        continue
                    
                    try:
                        response = requests.get(url, timeout=10)
                        response.raise_for_status()
                        
                        with open(output_file, 'wb') as f:
                            f.write(response.content)
                        
                        print(f"✓ 다운로드: {output_file.name}")
                        time.sleep(0.5)  # API 제한 방지
                        
                    except Exception as e:
                        print(f"✗ 에러: {output_file.name} - {str(e)}")
    
    def update_mock_data_with_real_images(self):
        """Mock 데이터를 실제 이미지 경로로 업데이트"""
        mock_data_path = Path("lib/db/hotdeal-mock-data.json")
        if not mock_data_path.exists():
            print("✗ Mock 데이터를 찾을 수 없습니다.")
            return
        
        with open(mock_data_path, 'r') as f:
            hotdeals = json.load(f)
        
        print("\n📝 Mock 데이터 이미지 URL 업데이트 중...")
        
        # 카테고리별 카운터
        category_counters = {cat: 1 for cat in self.picsum_ids.keys()}
        
        for hotdeal in hotdeals:
            category = hotdeal.get("category", "other")
            if category in category_counters:
                # 실제 다운로드한 이미지 경로로 변경
                img_num = category_counters[category]
                hotdeal["imageUrl"] = f"/images/samples/{category}/{category}_{img_num}_thumb.jpg"
                hotdeal["detailImageUrl"] = f"/images/samples/{category}/{category}_{img_num}_detail.jpg"
                hotdeal["ogImageUrl"] = f"/images/samples/{category}/{category}_{img_num}_og.jpg"
                
                # 카운터 증가 (5개씩 순환)
                category_counters[category] = (img_num % 5) + 1
        
        # 업데이트된 데이터 저장
        updated_path = Path("lib/db/hotdeal-mock-data-updated.json")
        with open(updated_path, 'w') as f:
            json.dump(hotdeals, f, indent=2, ensure_ascii=False)
        
        print(f"✓ 업데이트된 Mock 데이터 저장: {updated_path}")
    
    def create_image_info(self):
        """다운로드한 이미지 정보 파일 생성"""
        info = {
            "source": "Picsum Photos",
            "license": "Creative Commons CC0",
            "categories": {},
            "total_images": 0
        }
        
        for category in self.picsum_ids.keys():
            category_dir = self.output_dir / category
            if category_dir.exists():
                images = list(category_dir.glob("*.jpg"))
                info["categories"][category] = len(images)
                info["total_images"] += len(images)
        
        info_path = self.output_dir / "image_info.json"
        with open(info_path, 'w') as f:
            json.dump(info, f, indent=2)
        
        print(f"\n📊 이미지 정보:")
        print(f"  - 총 이미지: {info['total_images']}개")
        for cat, count in info["categories"].items():
            print(f"  - {cat}: {count}개")

def main():
    downloader = SampleImageDownloader()
    
    # 1. Picsum Photos에서 이미지 다운로드
    downloader.download_picsum_images()
    
    # 2. Mock 데이터 업데이트
    downloader.update_mock_data_with_real_images()
    
    # 3. 이미지 정보 생성
    downloader.create_image_info()
    
    print("\n✅ 샘플 이미지 다운로드 및 설정 완료!")

if __name__ == "__main__":
    main()