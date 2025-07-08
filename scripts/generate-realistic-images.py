#!/usr/bin/env python3
"""
HiKo 리얼한 상품 이미지 생성기
실제 한국 쇼핑몰 스타일의 고품질 상품 이미지를 생성합니다.
"""

import os
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path
import random
import colorsys

class RealisticImageGenerator:
    def __init__(self):
        self.output_dir = Path("public/images/products")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 한국 쇼핑몰 스타일 색상 팔레트
        self.color_schemes = {
            "electronics": {
                "primary": [(41, 128, 185), (52, 152, 219), (142, 68, 173)],
                "accent": [(231, 76, 60), (241, 196, 15), (46, 204, 113)]
            },
            "food": {
                "primary": [(230, 126, 34), (211, 84, 0), (192, 57, 43)],
                "accent": [(39, 174, 96), (241, 196, 15), (243, 156, 18)]
            },
            "beauty": {
                "primary": [(255, 169, 211), (255, 192, 203), (219, 112, 147)],
                "accent": [(155, 89, 182), (142, 68, 173), (192, 57, 43)]
            },
            "home": {
                "primary": [(26, 188, 156), (22, 160, 133), (46, 204, 113)],
                "accent": [(52, 152, 219), (41, 128, 185), (155, 89, 182)]
            },
            "sports": {
                "primary": [(46, 204, 113), (39, 174, 96), (22, 160, 133)],
                "accent": [(241, 196, 15), (243, 156, 18), (230, 126, 34)]
            }
        }
        
        # 한국 쇼핑몰 스타일 텍스트
        self.promotional_texts = {
            "electronics": ["한정특가", "역대최저가", "오늘만특가", "무료배송", "당일배송"],
            "food": ["신선배송", "산지직송", "프리미엄", "할인특가", "인기상품"],
            "beauty": ["베스트셀러", "신상품", "기획특가", "1+1", "증정품"],
            "home": ["리빙특가", "신상품", "베스트", "할인전", "무료배송"],
            "sports": ["아울렛", "시즌오프", "특가전", "브랜드", "기획전"]
        }
    
    def generate_product_image(self, category, product_name, price, discount_rate):
        """한국 쇼핑몰 스타일의 상품 이미지 생성"""
        
        # 캔버스 생성
        width, height = 800, 800
        img = Image.new('RGB', (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # 배경 그라디언트
        colors = self.color_schemes.get(category, self.color_schemes["electronics"])
        primary_color = random.choice(colors["primary"])
        
        # 부드러운 그라디언트 배경
        for y in range(height):
            factor = (y / height) ** 2  # 곡선 그라디언트
            r = int(255 - (255 - primary_color[0]) * factor * 0.3)
            g = int(255 - (255 - primary_color[1]) * factor * 0.3)
            b = int(255 - (255 - primary_color[2]) * factor * 0.3)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
        
        # 제품 영역 (중앙의 큰 영역)
        product_area = Image.new('RGBA', (600, 400), (255, 255, 255, 240))
        product_draw = ImageDraw.Draw(product_area)
        
        # 제품 이미지 플레이스홀더 (원형)
        circle_x, circle_y = 300, 200
        circle_r = 150
        product_draw.ellipse([circle_x-circle_r, circle_y-circle_r, 
                            circle_x+circle_r, circle_y+circle_r], 
                           fill=(*primary_color, 50))
        
        # 제품 아이콘 그리기
        self._draw_product_icon(product_draw, category, circle_x, circle_y, circle_r)
        
        # 블러 효과로 부드럽게
        product_area = product_area.filter(ImageFilter.GaussianBlur(radius=2))
        img.paste(product_area, (100, 150), product_area)
        
        # 상단 프로모션 배너
        self._draw_promotion_banner(draw, category, width)
        
        # 할인율 뱃지
        if discount_rate > 0:
            self._draw_discount_badge(draw, discount_rate, width)
        
        # 제품명
        self._draw_product_title(draw, product_name, width)
        
        # 가격 정보
        self._draw_price_info(draw, price, discount_rate, width)
        
        # 하단 정보
        self._draw_bottom_info(draw, category, width, height)
        
        # 장식 요소
        self._add_decorative_elements(draw, colors["accent"], width, height)
        
        return img
    
    def _draw_product_icon(self, draw, category, x, y, r):
        """카테고리별 아이콘 그리기"""
        icon_color = (255, 255, 255)
        
        if category == "electronics":
            # 스마트폰 아이콘
            phone_w, phone_h = 80, 140
            draw.rounded_rectangle([x-phone_w//2, y-phone_h//2, 
                                  x+phone_w//2, y+phone_h//2], 
                                 radius=10, fill=icon_color)
            draw.ellipse([x-10, y+phone_h//2-20, x+10, y+phone_h//2-10], 
                        fill=(100, 100, 100))
        
        elif category == "food":
            # 박스 아이콘
            box_size = 120
            draw.rectangle([x-box_size//2, y-box_size//2, 
                          x+box_size//2, y+box_size//2], 
                         fill=icon_color)
            draw.line([(x-box_size//2, y), (x+box_size//2, y)], 
                     fill=(200, 200, 200), width=3)
            draw.line([(x, y-box_size//2), (x, y+box_size//2)], 
                     fill=(200, 200, 200), width=3)
        
        elif category == "beauty":
            # 화장품 병 아이콘
            bottle_w, bottle_h = 60, 120
            draw.ellipse([x-bottle_w//2, y-bottle_h//2, 
                         x+bottle_w//2, y-20], 
                        fill=icon_color)
            draw.rectangle([x-20, y-20, x+20, y-bottle_h//2], 
                          fill=icon_color)
            draw.ellipse([x-30, y-bottle_h//2-10, 
                         x+30, y-bottle_h//2+10], 
                        fill=(200, 200, 200))
        
        elif category == "home":
            # 집 아이콘
            house_size = 100
            points = [(x, y-house_size//2), 
                     (x-house_size//2, y), 
                     (x+house_size//2, y)]
            draw.polygon(points, fill=icon_color)
            draw.rectangle([x-house_size//3, y, 
                          x+house_size//3, y+house_size//2], 
                         fill=icon_color)
        
        elif category == "sports":
            # 운동화 아이콘
            shoe_w, shoe_h = 140, 60
            draw.ellipse([x-shoe_w//2, y-shoe_h//2, 
                         x+shoe_w//2, y+shoe_h//2], 
                        fill=icon_color)
            draw.arc([x-shoe_w//2+20, y-shoe_h//2, 
                     x+shoe_w//2-20, y+shoe_h//2+40], 
                    start=180, end=360, fill=(200, 200, 200), width=3)
    
    def _draw_promotion_banner(self, draw, category, width):
        """상단 프로모션 배너"""
        banner_height = 60
        banner_color = (255, 51, 51)
        draw.rectangle([0, 0, width, banner_height], fill=banner_color)
        
        promo_text = random.choice(self.promotional_texts.get(category, ["특가"]))
        try:
            font = ImageFont.load_default()
        except:
            font = None
        
        if font:
            bbox = draw.textbbox((0, 0), promo_text, font=font)
            text_w = bbox[2] - bbox[0]
            draw.text((width//2 - text_w//2, 20), promo_text, 
                     fill='white', font=font)
    
    def _draw_discount_badge(self, draw, discount_rate, width):
        """할인율 뱃지"""
        badge_size = 100
        badge_x = width - badge_size - 30
        badge_y = 80
        
        # 스타버스트 효과
        points = []
        for i in range(16):
            angle = i * 22.5
            if i % 2 == 0:
                r = badge_size // 2
            else:
                r = badge_size // 2 - 10
            x = badge_x + badge_size//2 + r * math.cos(math.radians(angle))
            y = badge_y + badge_size//2 + r * math.sin(math.radians(angle))
            points.append((x, y))
        
        draw.polygon(points, fill=(255, 215, 0))
        
        # 할인율 텍스트
        draw.text((badge_x + 25, badge_y + 35), f"{discount_rate}%", 
                 fill=(255, 0, 0), font=None)
        draw.text((badge_x + 30, badge_y + 55), "OFF", 
                 fill=(255, 0, 0), font=None)
    
    def _draw_product_title(self, draw, product_name, width):
        """제품명"""
        title_y = 580
        draw.text((50, title_y), product_name, 
                 fill=(50, 50, 50), font=None)
    
    def _draw_price_info(self, draw, price, discount_rate, width):
        """가격 정보"""
        price_y = 620
        
        if discount_rate > 0:
            original_price = int(price / (1 - discount_rate / 100))
            # 원가
            draw.text((50, price_y), f"₩{original_price:,}", 
                     fill=(150, 150, 150), font=None)
            draw.line([(50, price_y + 10), (150, price_y + 10)], 
                     fill=(150, 150, 150), width=2)
            # 할인가
            draw.text((50, price_y + 30), f"₩{price:,}", 
                     fill=(255, 51, 51), font=None)
        else:
            draw.text((50, price_y), f"₩{price:,}", 
                     fill=(50, 50, 50), font=None)
    
    def _draw_bottom_info(self, draw, category, width, height):
        """하단 정보"""
        info_y = height - 80
        
        # 배송 정보
        shipping_info = ["무료배송", "오늘출발", "내일도착"]
        info_text = " | ".join(random.sample(shipping_info, 2))
        draw.text((50, info_y), info_text, fill=(100, 100, 100), font=None)
        
        # 평점
        stars = "★★★★☆"
        draw.text((width - 150, info_y), f"{stars} 4.5", 
                 fill=(255, 215, 0), font=None)
    
    def _add_decorative_elements(self, draw, accent_colors, width, height):
        """장식 요소 추가"""
        # 작은 원형 장식
        for _ in range(5):
            x = random.randint(0, width)
            y = random.randint(0, height)
            size = random.randint(20, 40)
            color = random.choice(accent_colors)
            alpha = random.randint(20, 60)
            
            # 반투명 원
            overlay = Image.new('RGBA', (size*2, size*2), (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.ellipse([0, 0, size*2, size*2], 
                               fill=(*color, alpha))
            overlay = overlay.filter(ImageFilter.GaussianBlur(radius=size//4))
    
    def generate_mock_product_images(self):
        """Mock 데이터의 제품 이미지 생성"""
        # Mock 데이터 로드
        mock_data_path = Path("lib/db/hotdeal-mock-data.json")
        if not mock_data_path.exists():
            print("✗ Mock 데이터를 찾을 수 없습니다.")
            return
        
        with open(mock_data_path, 'r') as f:
            hotdeals = json.load(f)
        
        print(f"🎨 리얼한 상품 이미지 생성 중...")
        
        # 상위 20개 제품만 생성 (테스트)
        for hotdeal in hotdeals[:20]:
            category = hotdeal.get("category", "other")
            title = hotdeal.get("title", "상품명")
            price = hotdeal.get("price", 100000)
            discount_rate = hotdeal.get("discountRate", 0)
            
            # 이미지 생성
            img = self.generate_product_image(category, title, price, discount_rate)
            
            # 저장
            output_path = self.output_dir / f"{hotdeal['id']}_product.jpg"
            img.save(output_path, 'JPEG', quality=90, optimize=True)
            print(f"✓ 생성: {output_path.name}")

# math 모듈 import 추가
import math

def main():
    generator = RealisticImageGenerator()
    generator.generate_mock_product_images()
    print("\n✅ 리얼한 상품 이미지 생성 완료!")

if __name__ == "__main__":
    main()