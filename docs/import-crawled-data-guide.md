# 크롤링 데이터 가져오기 가이드

## 문제 해결 완료

Storage 시스템이 브라우저 환경에서만 작동하는 문제를 해결했습니다.

## 크롤링된 데이터 가져오기 방법

### 방법 1: 웹 인터페이스 사용 (권장)

1. 브라우저에서 `http://localhost:3000/import-hotdeals.html` 접속
2. "JSON 파일 선택" 버튼을 클릭
3. `exports` 폴더에서 크롤링된 JSON 파일 선택 (예: `hotdeal-ppomppu-2025-07-12T11-08-55-696Z.json`)
4. 자동으로 데이터가 가져와지고 핫딜 페이지로 이동 옵션 제공

### 방법 2: 관리자 페이지 사용

1. `http://localhost:3000/admin/import-data` 접속
2. 현재 데이터 상태 확인
3. "모든 핫딜 삭제" 버튼으로 기존 데이터 삭제 (선택사항)
4. "JSON 파일 선택"으로 크롤링된 파일 업로드

## 크롤링 워크플로우

1. **크롤링 실행**
   ```bash
   # CLI 사용
   pnpm crawl-hotdeals -s ppomppu -p 5 --save-json
   
   # 또는 웹 인터페이스
   http://localhost:3000/admin/crawler
   ```

2. **JSON 파일 확인**
   - 크롤링된 데이터는 `./exports` 폴더에 저장됨
   - 파일명 형식: `hotdeal-ppomppu-YYYY-MM-DDTHH-mm-ss-sssZ.json`

3. **데이터 가져오기**
   - 위의 방법 중 하나를 사용하여 JSON 파일 가져오기

4. **확인**
   - `http://localhost:3000/hotdeals` 에서 새로운 핫딜 확인

## 주의사항

- localStorage 기반 시스템이므로 브라우저에서 직접 가져오기 필요
- 서버 컴포넌트에서는 직접 접근 불가
- 크롤링된 데이터는 기존 데이터를 완전히 대체함