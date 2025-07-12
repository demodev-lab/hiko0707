import { CrawledHotDeal } from './types'

// 가격 파싱 헬퍼 함수
export function parsePrice(priceText: string | undefined): number {
  if (!priceText) return 0;
  
  // "126,330원" 같은 형식에서 숫자만 추출
  const numbers = priceText.match(/[\d,]+/);
  if (!numbers) return 0;
  
  // 쉼표 제거하고 숫자로 변환
  return parseInt(numbers[0].replace(/,/g, ''), 10);
}

// 날짜 파싱 헬퍼 함수 
export function parseDate(dateText: string | undefined): Date {
  if (!dateText) return new Date();
  
  // "25/07/11" 형식
  if (dateText.includes('/')) {
    const parts = dateText.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0]) + 2000; // 25 -> 2025
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      return new Date(year, month - 1, day);
    }
  }
  
  // "07-11" 형식 (오늘 날짜 기준)
  if (dateText.includes('-') && dateText.length <= 5) {
    const today = new Date();
    const parts = dateText.split('-');
    if (parts.length === 2) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      return new Date(today.getFullYear(), month - 1, day);
    }
  }
  
  return new Date();
}

// 쇼핑몰 이름 추출 헬퍼 함수
export function extractSeller(title: string): string {
  // [지마켓], [쿠팡] 등에서 쇼핑몰 이름 추출
  const match = title.match(/\[([^\]]+)\]/);
  return match ? match[1] : '기타';
}

// 제목에서 가격 정보 제거
export function cleanTitle(title: string): string {
  // 쇼핑몰 태그 제거
  let cleaned = title.replace(/\[[^\]]+\]/g, '').trim();
  
  // 가격 정보 제거 (괄호 안의 숫자,원/무료 패턴)
  cleaned = cleaned.replace(/\([0-9,]+원.*?\)/g, '').trim();
  
  // 앞뒤 공백 제거
  return cleaned.trim();
}

// 무료배송 여부 확인
export function checkFreeShipping(title: string): boolean {
  return title.includes('무료') || title.includes('무배');
}

// 뽐뿌 크롤링 스크립트
export const ppomppuCrawlScript = `
// 게시물 목록 크롤링
const rows = document.querySelectorAll('#revolution_main_table tbody tr.baseList');
const deals = [];

rows.forEach((row, index) => {
  try {
    // 썸네일
    const img = row.querySelector('td.baseList-space.title > a > img');
    
    // 제목 (쇼핑몰명, 제목, 가격, 무료배송여부 포함)
    const titleElement = row.querySelector('td.baseList-space.title > div > div > a > span');
    const titleText = titleElement?.textContent?.trim() || '';
    
    // 링크
    const link = row.querySelector('td.baseList-space.title > div > div > a');
    
    // 작성자 ID
    const authorElement = row.querySelector('td:nth-child(3) > div > nobr > a > span');
    
    // 등록일
    const dateElement = row.querySelector('td:nth-child(4) > time') || 
                       row.querySelector('td:nth-child(4)'); // time 태그가 없을 수도 있음
    
    // 조회수
    const viewsElement = row.querySelector('td.baseList-space.baseList-views');
    
    // 추천/비추천
    const recommendElement = row.querySelector('td.baseList-space.baseList-rec');
    
    // 댓글수 (제목 영역에 있음)
    const commentElement = row.querySelector('td.baseList-space.title > div > div > span');
    
    // 카테고리
    const categoryElement = row.querySelector('td.baseList-space.title > div > small');
    
    deals.push({
      imageUrl: img?.src,
      title: titleText,
      link: link?.href,
      author: authorElement?.textContent?.trim(),
      date: dateElement?.textContent?.trim(),
      views: viewsElement?.textContent?.trim(),
      recommend: recommendElement?.textContent?.trim(),
      commentCount: commentElement?.textContent?.trim(),
      category: categoryElement?.textContent?.trim()
    });
  } catch (e) {
    console.error('Error parsing row:', e);
  }
});

deals;
`;

// 상세 페이지 크롤링 스크립트
export const ppomppuDetailScript = `
// 쇼핑 코멘트
const contentElement = document.querySelector('body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td') ||
                      document.querySelector('.board-contents') ||
                      document.querySelector('[class*="content"]');

const productComment = contentElement?.textContent?.trim();

({ productComment });
`;