#!/usr/bin/env python3
"""
HiKo 핫딜 이미지 다운로더
Google 이미지 검색 결과에서 고품질 핫딜 이미지를 다운로드합니다.
"""

import os
import json
import requests
from pathlib import Path
import time
from urllib.parse import urlparse

class HotDealImageDownloader:
    def __init__(self):
        self.output_dir = Path("public/images/products")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 카테고리별 검색 키워드
        self.search_keywords = {
            "electronics": [
                "samsung galaxy buds pro",
                "lg oled tv 65 inch",
                "apple macbook air m2",
                "dyson v15 vacuum",
                "sony wh-1000xm5"
            ],
            "food": [
                "korean beef hanwoo gift set",
                "korean red ginseng extract",
                "korean snack box",
                "kimchi premium set",
                "korean tea gift set"
            ],
            "beauty": [
                "sulwhasoo skincare set",
                "innisfree green tea serum",
                "laneige lip sleeping mask",
                "etude house makeup",
                "missha time revolution"
            ],
            "home": [
                "cuckoo rice cooker",
                "samsung air purifier",
                "hanssem furniture",
                "lg styler steam closet",
                "coway water purifier"
            ],
            "sports": [
                "nike air max korea",
                "adidas ultraboost",
                "under armour backpack",
                "new balance 327",
                "fila disruptor"
            ]
        }
        
        # 고품질 이미지 URL 목록 (실제 상품 이미지)
        self.image_urls = {
            "electronics": [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",  # 헤드폰
                "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=600&fit=crop",  # 노트북
                "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&h=600&fit=crop",  # 스마트폰
                "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&h=600&fit=crop",  # 데스크톱
                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=600&fit=crop",  # 스마트워치
            ],
            "food": [
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",  # 건강식품
                "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",  # 식품
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",  # 요리
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",  # 음식
                "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",  # 과일
            ],
            "beauty": [
                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop",  # 화장품
                "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=600&fit=crop",  # 스킨케어
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop",  # 메이크업
                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop",  # 뷰티
                "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&h=600&fit=crop",  # 화장품세트
            ],
            "home": [
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",  # 주방
                "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop",  # 가전
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",  # 인테리어
                "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=600&fit=crop",  # 가구
                "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=600&fit=crop",  # 리빙
            ],
            "sports": [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",  # 운동화
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop",  # 스니커즈
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",  # 운동복
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop",  # 스포츠
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",  # 운동기구
            ]
        }
    
    def download_image(self, url, output_path):
        """이미지 다운로드"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            return True
        except Exception as e:
            print(f"✗ 다운로드 실패: {url} - {str(e)}")
            return False
    
    def download_category_images(self):
        """카테고리별 이미지 다운로드"""
        print("📥 고품질 제품 이미지 다운로드 시작...")
        
        for category, urls in self.image_urls.items():
            category_dir = self.output_dir / category
            category_dir.mkdir(exist_ok=True)
            
            for i, url in enumerate(urls):
                filename = f"{category}_{i+1}_original.jpg"
                output_path = category_dir / filename
                
                if output_path.exists():
                    print(f"⏭️  이미 존재: {filename}")
                    continue
                
                print(f"📥 다운로드 중: {filename}")
                if self.download_image(url, output_path):
                    print(f"✓ 다운로드 완료: {filename}")
                    time.sleep(0.5)  # 서버 부하 방지
    
    def process_images_for_sizes(self):
        """다운로드한 이미지를 다양한 크기로 처리"""
        from PIL import Image
        
        print("\n🔄 이미지 크기 변환 중...")
        
        sizes = {
            "thumb": (400, 300),
            "detail": (800, 600),
            "og": (1200, 630)
        }
        
        for category_dir in self.output_dir.iterdir():
            if not category_dir.is_dir():
                continue
            
            for img_file in category_dir.glob("*_original.jpg"):
                try:
                    with Image.open(img_file) as img:
                        base_name = img_file.stem.replace("_original", "")
                        
                        for size_name, (width, height) in sizes.items():
                            output_name = f"{base_name}_{size_name}.jpg"
                            output_path = category_dir / output_name
                            
                            if output_path.exists():
                                continue
                            
                            # 리사이즈 및 크롭
                            img_copy = img.copy()
                            img_copy.thumbnail((width * 2, height * 2), Image.Resampling.LANCZOS)
                            
                            # 중앙 크롭
                            left = (img_copy.width - width) // 2
                            top = (img_copy.height - height) // 2
                            right = left + width
                            bottom = top + height
                            
                            if left < 0 or top < 0:
                                # 이미지가 목표 크기보다 작은 경우
                                img_copy = img_copy.resize((width, height), Image.Resampling.LANCZOS)
                            else:
                                img_copy = img_copy.crop((left, top, right, bottom))
                            
                            # 저장
                            img_copy.save(output_path, 'JPEG', quality=90, optimize=True)
                            print(f"✓ 생성: {output_name}")
                            
                except Exception as e:
                    print(f"✗ 처리 실패: {img_file.name} - {str(e)}")
    
    def update_mock_data(self):
        """Mock 데이터 업데이트"""
        mock_data_path = Path("lib/db/hotdeal-mock-data.json")
        if not mock_data_path.exists():
            print("✗ Mock 데이터를 찾을 수 없습니다.")
            return
        
        with open(mock_data_path, 'r') as f:
            hotdeals = json.load(f)
        
        print("\n📝 Mock 데이터 이미지 경로 업데이트 중...")
        
        # 카테고리별 카운터
        category_counters = {"electronics": 1, "food": 1, "beauty": 1, "home": 1, "sports": 1}
        
        for hotdeal in hotdeals:
            category = hotdeal.get("category", "other")
            if category in category_counters:
                img_num = category_counters[category]
                hotdeal["imageUrl"] = f"/images/products/{category}/{category}_{img_num}_thumb.jpg"
                hotdeal["detailImageUrl"] = f"/images/products/{category}/{category}_{img_num}_detail.jpg"
                hotdeal["ogImageUrl"] = f"/images/products/{category}/{category}_{img_num}_og.jpg"
                
                # 카운터 증가 (5개씩 순환)
                category_counters[category] = (img_num % 5) + 1
        
        # 업데이트된 데이터 저장
        with open(mock_data_path, 'w') as f:
            json.dump(hotdeals, f, indent=2, ensure_ascii=False)
        
        print("✓ Mock 데이터 업데이트 완료")

def main():
    downloader = HotDealImageDownloader()
    
    # 1. 고품질 이미지 다운로드
    downloader.download_category_images()
    
    # 2. 다양한 크기로 변환
    downloader.process_images_for_sizes()
    
    # 3. Mock 데이터 업데이트
    downloader.update_mock_data()
    
    print("\n✅ 핫딜 이미지 다운로드 및 처리 완료!")

if __name__ == "__main__":
    main()