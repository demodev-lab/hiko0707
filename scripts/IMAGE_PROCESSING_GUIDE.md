# 🖼️ HiKo 이미지 처리 가이드

## 개요
HiKo 프로젝트의 이미지 처리를 위한 Python 스크립트 모음입니다.

## 도구 목록

### 1. image-resizer.py
기본적인 이미지 리사이징 도구입니다.
- 400x300px 표준 크기로 리사이징
- 비율 유지하며 중앙 크롭
- JPEG 최적화

```bash
# 단일 이미지 처리
python scripts/image-resizer.py image.jpg

# 디렉토리 일괄 처리
python scripts/image-resizer.py images_dir/
```

### 2. image-optimizer.py
다양한 크기의 이미지를 생성하는 고급 도구입니다.
- 여러 프리셋 지원 (히어로, 썸네일, 소셜미디어 등)
- 플레이스홀더 이미지 생성
- 배치 처리 지원

```bash
# 사용 가능한 프리셋 확인
python scripts/image-optimizer.py --list

# 샘플 이미지 생성
python scripts/image-optimizer.py --samples

# 특정 프리셋으로 이미지 생성
python scripts/image-optimizer.py input.jpg -p hotdeal-thumb hotdeal-detail
```

### 3. hotdeal-image-processor.py
핫딜 전용 이미지 배치 처리 도구입니다.
- Mock 데이터 이미지 자동 처리
- 중복 처리 방지 (해시 기반)
- 프로그레시브 JPEG 생성
- 처리 통계 제공

```bash
# Mock 데이터의 이미지 처리
python scripts/hotdeal-image-processor.py --mock

# 특정 디렉토리 이미지 처리
python scripts/hotdeal-image-processor.py --input crawled_images/

# 캐시 정리
python scripts/hotdeal-image-processor.py --clean
```

## 이미지 크기 가이드

### 핫딜 이미지
- **리스트 썸네일**: 400x300px (데스크톱), 200x150px (모바일)
- **상세 페이지**: 800x600px (데스크톱), 400x300px (모바일)
- **소셜 공유**: 1200x630px (Open Graph)

### 히어로/배너 이미지
- **히어로 데스크톱**: 1920x1080px
- **히어로 태블릿**: 1024x768px
- **히어로 모바일**: 768x1024px

### 기타
- **카테고리 아이콘**: 120x120px
- **프로필 이미지**: 200x200px (대), 80x80px (소)

## 최적화 팁

1. **원본 이미지 준비**
   - 최소 1200px 이상의 고해상도 원본 사용
   - PNG보다는 JPEG 형식 권장 (사진의 경우)

2. **품질 설정**
   - 썸네일: 80-85%
   - 상세 이미지: 85-90%
   - 히어로 이미지: 90-95%

3. **성능 최적화**
   - 프로그레시브 JPEG 사용
   - 적절한 압축률 적용
   - WebP 형식 고려 (향후 지원 예정)

## 워크플로우

1. **크롤링 후 처리**
   ```bash
   # 1. 크롤링된 이미지를 특정 디렉토리에 저장
   # 2. 배치 처리 실행
   python scripts/hotdeal-image-processor.py --input crawled_images/
   ```

2. **개발 중 테스트**
   ```bash
   # Mock 데이터용 이미지 생성
   python scripts/hotdeal-image-processor.py --mock
   ```

3. **프로덕션 배포**
   - 처리된 이미지는 `public/images/hotdeals/` 디렉토리에 저장됨
   - Next.js Image 컴포넌트에서 자동으로 최적화됨

## 처리 로그

처리된 이미지 정보는 `scripts/processed_images.json`에 기록됩니다:
- 파일 해시 (중복 처리 방지)
- 처리 시간
- 원본 크기
- 핫딜 ID 매핑