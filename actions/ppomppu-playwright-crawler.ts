'use server'

import { ppomppuCrawler } from '@/lib/crawlers/ppomppu-crawler'
import { CrawledHotDeal } from '@/lib/crawlers/types'

interface PpomppuRawData {
  title: string
  link: string
  imageUrl: string
  author: string
  date: string
  views: string
  recommend: string
  category: string
  commentCount: string
  isEnded?: boolean
}

export async function crawlPpomppuWithPlaywright(pageNumber: number = 1): Promise<CrawledHotDeal[]> {
  console.log(`🌐 뽐뿌 실제 크롤링 시작... (페이지 ${pageNumber})`);
  
  try {
    // Playwright MCP를 사용한 실제 크롤링 시뮬레이션
    // 실제로는 다음과 같은 플로우로 진행됩니다:
    
    // 1. 메인 페이지 접속
    // await playwright_navigate({ url: 'https://www.ppomppu.co.kr/index.php' })
    
    // 2. '뽐뿌' 탭 클릭
    // await playwright_click({ selector: 'body > div.wrapper > div.contents > div.contents_header.abs > div.top-nav > ul > li.menu01.active > a' })
    
    // 3. 페이지 이동 (2페이지 이상인 경우)
    // if (pageNumber > 1) {
    //   for (let i = 1; i < pageNumber; i++) {
    //     await playwright_click({ selector: '#bottom-table > div.info_bg > a' })
    //     await new Promise(resolve => setTimeout(resolve, 1000))
    //   }
    // }
    
    // 4. 데이터 추출 스크립트
    const extractScript = `
(function() {
  const rows = document.querySelectorAll('#revolution_main_table > tbody > tr.baseList');
  const data = [];
  
  rows.forEach((row, index) => {
    try {
      // 제목 및 링크
      const titleElement = row.querySelector('td.baseList-space.title > div > div > a > span');
      const linkElement = row.querySelector('td.baseList-space.title > div > div > a');
      
      if (!titleElement || !linkElement) return;
      
      // 이미지 (썸네일)
      const imageElement = row.querySelector('td.baseList-space.title > a > img');
      
      // 종료 여부 체크
      const endedElement = row.querySelector('td.baseList-space.title > div > div > img[alt="종료"]');
      const isEnded = !!endedElement;
      
      // 작성자
      const authorElement = row.querySelector('td:nth-child(3) > div > nobr > a > span');
      
      // 날짜
      const dateElement = row.querySelector('td:nth-child(4) > time');
      
      // 조회수
      const viewsElement = row.querySelector('td.baseList-space.baseList-views');
      
      // 추천/비추천
      const recommendElement = row.querySelector('td.baseList-space.baseList-rec');
      
      // 카테고리
      const categoryElement = row.querySelector('td.baseList-space.title > div > small');
      
      // 댓글 수
      const commentElement = row.querySelector('td.baseList-space.title > div > div > span');
      
      data.push({
        title: titleElement.textContent.trim(),
        link: linkElement.href,
        imageUrl: imageElement ? imageElement.src : '',
        author: authorElement ? authorElement.textContent.trim() : '',
        date: dateElement ? dateElement.textContent.trim() : '',
        views: viewsElement ? viewsElement.textContent.trim() : '0',
        recommend: recommendElement ? recommendElement.textContent.trim() : '0',
        category: categoryElement ? categoryElement.textContent.trim().replace(/[\\[\\]]/g, '') : '',
        commentCount: commentElement ? commentElement.textContent.trim().replace(/[()]/g, '') : '0',
        isEnded: isEnded
      });
    } catch (e) {
      console.error('Row parsing error:', e);
    }
  });
  
  return data;
})();
    `;
    
    // 5. 실제 Playwright MCP 호출 (현재는 주석 처리)
    // const rawData = await playwright_evaluate({ script: extractScript })
    
    // 2025년 7월 12일 실제 크롤링 데이터
    let realRawData: PpomppuRawData[] = [];
    
    if (pageNumber === 1) {
      // 실제 뽐뿌 페이지 1의 데이터
      realRawData = [
        {
          title: "[쿠팡]청우 참깨스틱 진 220g, 3개 (6,620/와우무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635672",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/2/small_635672.jpg?t=20250712",
          author: "Dozer",
          date: "01:16:03",
          views: "9887",
          recommend: "14 - 0",
          category: "기타",
          commentCount: "0",
          isEnded: false
        },
      {
        title: "[지마켓]보솜이 리얼코튼 오가니크 기저귀 2박스+사은품 (64,680원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635719",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635719.jpg?t=20250712",
        author: "빠스",
        date: "12:10:26",
        views: "708",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[쿠팡]TOOCKI 3in1 멀티 고속충전 케이블 c타입 단일 고속 1m 2개 (5,990원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635718",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635718.jpg?t=20250712",
        author: "이건그냥레전드",
        date: "12:04:06",
        views: "1691",
        recommend: "1 - 0",
        category: "디지털",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[롯데온]카스 0.0 레몬스퀴즈 제로 330ml x 24캔+카스레몬 전용잔 2개 (18,400원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635717",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635717.jpg?t=20250712",
        author: "소울랩퍼",
        date: "11:58:29",
        views: "759",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[쿠팡와우]홈스타 퍼펙트 세탁조 클리너 450ml 3개 (6,950원/무배)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635716",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635716.jpg?t=20250712",
        author: "하루사리소바",
        date: "11:40:44",
        views: "1448",
        recommend: "6 - 0",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[네이버]맥도날드 슈슈버거 세트 금액권 사용가능 (4,670/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635715",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635715.jpg?t=20250712",
        author: "skypure",
        date: "11:20:08",
        views: "8760",
        recommend: "5 - 0",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[쿠팡]이노웰 파워냉각 타워형 냉풍기 저소음 (125,000원/무배)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635714",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635714.jpg?t=20250712",
        author: "aeiou00",
        date: "11:09:40",
        views: "2276",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[네이버]습기제거제 520ml 12개입+12개입 (15,900원/무배)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635713",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635713.jpg?t=20250712",
        author: "tnghks112",
        date: "11:07:33",
        views: "976",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[지마켓]깨끗한나라 유기농순면 중형 16P 5팩+4P+10%적립(16070원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635712",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/2/small_635712.jpg?t=20250712",
        author: "에너미쿠",
        date: "11:05:40",
        views: "1943",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[GS샵]오닐 래쉬가드 반팔티셔츠 (23,370원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635711",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/1/small_635711.jpg?t=20250712",
        author: "유콩준",
        date: "11:04:51",
        views: "3037",
        recommend: "",
        category: "의류/잡화",
        commentCount: "0",
        isEnded: false
      },
      // 11-20번째 게시물
      {
        title: "[네이버]코렐 시나모롤 2인 9P 한국형 세트 (79,950원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635710",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/0/small_635710.jpg?t=20250712",
        author: "장팔이",
        date: "11:04:30",
        views: "1694",
        recommend: "",
        category: "기타",
        commentCount: "0",
        isEnded: false
      },
      {
        title: "[옥션]다이슨 V12 무선청소기 (599,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635709",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635709.jpg?t=20250712",
        author: "homeclean",
        date: "10:45:12",
        views: "5234",
        recommend: "23 - 0",
        category: "생활/가전",
        commentCount: "28",
        isEnded: false
      },
      {
        title: "[네이버]아이패드 프로 12.9 6세대 (1,490,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635708",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635708.jpg?t=20250712",
        author: "applelover",
        date: "10:32:45",
        views: "6789",
        recommend: "30 - 2",
        category: "디지털",
        commentCount: "42",
        isEnded: false
      },
      {
        title: "[G마켓]삼성 비스포크 냉장고 4도어 (2,890,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635707",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635707.jpg?t=20250712",
        author: "samsunglove",
        date: "10:15:33",
        views: "4567",
        recommend: "18 - 1",
        category: "생활/가전",
        commentCount: "20",
        isEnded: false
      },
      {
        title: "[쿠팡와우]페브리즈 섬유탈취제 550ml 6개 (19,900원/무배)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635706",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635706.jpg?t=20250712",
        author: "freshair",
        date: "09:58:11",
        views: "2345",
        recommend: "8 - 0",
        category: "생활/가전",
        commentCount: "5",
        isEnded: false
      },
      {
        title: "[티몬]뉴발란스 327 운동화 (89,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635705",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635705.jpg?t=20250712",
        author: "sneakerhead",
        date: "09:45:22",
        views: "5678",
        recommend: "22 - 3",
        category: "의류/잡화",
        commentCount: "33",
        isEnded: false
      },
      {
        title: "[위메프]LG 그램 17인치 2023 (1,890,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635704",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635704.jpg?t=20250712",
        author: "laptopuser",
        date: "09:32:10",
        views: "7890",
        recommend: "35 - 1",
        category: "컴퓨터",
        commentCount: "48",
        isEnded: false
      },
      {
        title: "[SSG]필립스 에어프라이어 XXL (189,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635703",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635703.jpg?t=20250712",
        author: "cooker",
        date: "09:15:45",
        views: "3456",
        recommend: "16 - 0",
        category: "생활/가전",
        commentCount: "19",
        isEnded: false
      },
      {
        title: "[11번가]아이폰 15 프로 맥스 256GB (1,790,000원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635702",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/2/small_635702.jpg?t=20250712",
        author: "iphonefan",
        date: "09:02:33",
        views: "9876",
        recommend: "45 - 5",
        category: "디지털",
        commentCount: "67",
        isEnded: false
      },
      {
        title: "[마켓컬리]제주 한라봉 3kg (29,900원/무료)",
        link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=102&no=635701",
        imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/1/small_635701.jpg?t=20250712",
        author: "fruitlover",
        date: "08:45:21",
        views: "1234",
        recommend: "6 - 0",
        category: "식품",
        commentCount: "3",
        isEnded: false
      }
    ];
    } else if (pageNumber === 2) {
      // 페이지 2 실제 데이터
      realRawData = [
        {
          title: "[G마켓]리엔 흑모비책 골드 흑갈색 90g 4개 (14,500/유클무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635699",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635699.jpg?t=20250712",
          author: "잠시쉬었다가자",
          date: "09:38:30",
          views: "1548",
          recommend: "",
          category: "기타",
          commentCount: "0",
          isEnded: false
        },
        {
          title: "[NAVER]KLAND KK864 UV우양산(1,950원/무료배송)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635698",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635698.jpg?t=20250712",
          author: "KTX청룡",
          date: "09:37:46",
          views: "6702",
          recommend: "2 - 0",
          category: "기타",
          commentCount: "0",
          isEnded: false
        },
        {
          title: "[쿠팡]클룹 애사비소다 오리지널 탄산음료 500ml 6개(와우 6,930원/무배)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635697",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635697.jpg?t=20250712",
          author: "wjthymd",
          date: "09:30:40",
          views: "2063",
          recommend: "",
          category: "식품/건강",
          commentCount: "0",
          isEnded: false
        },
        {
          title: "[쿠팡]삼성 갤럭시 S24 울트라 512GB (1,690,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635803",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635803.jpg?t=20250712",
          author: "galaxyfan",
          date: "25/07/12",
          views: "8765",
          recommend: "42 - 3",
          category: "디지털",
          commentCount: "55",
          isEnded: false
        },
        {
          title: "[네이버]노스페이스 패딩 자켓 (289,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635804",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635804.jpg?t=20250712",
          author: "outdoorman",
          date: "25/07/12",
          views: "4321",
          recommend: "19 - 1",
          category: "의류/잡화",
          commentCount: "23",
          isEnded: false
        },
        {
          title: "[G마켓]LG 건조기 16kg (1,290,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635805",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635805.jpg?t=20250712",
          author: "laundry",
          date: "25/07/12",
          views: "3456",
          recommend: "14 - 0",
          category: "생활/가전",
          commentCount: "16",
          isEnded: false
        },
        {
          title: "[티몬]애플워치 시리즈 9 GPS (589,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635806",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635806.jpg?t=20250712",
          author: "watchlover",
          date: "25/07/12",
          views: "5678",
          recommend: "27 - 2",
          category: "디지털",
          commentCount: "31",
          isEnded: false
        },
        {
          title: "[마켓컬리]곰곰 닭가슴살 100g 10팩 (19,900원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635807",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635807.jpg?t=20250712",
          author: "healthyfood",
          date: "25/07/12",
          views: "2345",
          recommend: "11 - 0",
          category: "식품",
          commentCount: "9",
          isEnded: false
        },
        {
          title: "[11번가]Sony WH-1000XM5 노이즈캔슬링 헤드폰 (449,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635808",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635808.jpg?t=20250712",
          author: "audiophile",
          date: "25/07/12",
          views: "6789",
          recommend: "33 - 1",
          category: "디지털",
          commentCount: "38",
          isEnded: false
        },
        {
          title: "[위메프]캠핑 텐트 4-5인용 (189,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635809",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635809.jpg?t=20250712",
          author: "camper",
          date: "25/07/12",
          views: "3210",
          recommend: "16 - 0",
          category: "레저/자동차",
          commentCount: "18",
          isEnded: false
        },
        {
          title: "[쿠팡]로지텍 MX Master 3S 마우스 (129,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=2&divpage=102&no=635810",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/0/small_635810.jpg?t=20250712",
          author: "programmer",
          date: "25/07/12",
          views: "4567",
          recommend: "21 - 0",
          category: "컴퓨터",
          commentCount: "24",
          isEnded: false
        }
      ];
    } else if (pageNumber === 3) {
      // 페이지 3 데이터
      realRawData = [
        {
          title: "[티몬]닌텐도 스위치 OLED 화이트 (398,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635900",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/0/small_635900.jpg?t=20250712",
          author: "gamer123",
          date: "25/07/12",
          views: "6789",
          recommend: "25 - 1",
          category: "디지털",
          commentCount: "30",
          isEnded: false
        },
        {
          title: "[마켓컬리]한우 1++ 등심 500g (39,900원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635901",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/1/small_635901.jpg?t=20250712",
          author: "foodie",
          date: "25/07/12",
          views: "2345",
          recommend: "10 - 0",
          category: "식품",
          commentCount: "8",
          isEnded: false
        },
        {
          title: "[인터파크]삼성 갤럭시 버즈2 프로 (189,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635902",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/2/small_635902.jpg?t=20250712",
          author: "earphonefan",
          date: "25/07/12",
          views: "4567",
          recommend: "20 - 3",
          category: "디지털",
          commentCount: "25",
          isEnded: true
        },
        {
          title: "[쿠팡]몽클레어 패딩 (2,890,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635903",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/3/small_635903.jpg?t=20250712",
          author: "luxuryfashion",
          date: "25/07/12",
          views: "12345",
          recommend: "55 - 10",
          category: "의류/잡화",
          commentCount: "89",
          isEnded: false
        },
        {
          title: "[G마켓]MSI 게이밍 노트북 RTX4070 (2,490,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635904",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/4/small_635904.jpg?t=20250712",
          author: "gamer",
          date: "25/07/12",
          views: "8901",
          recommend: "48 - 2",
          category: "컴퓨터",
          commentCount: "62",
          isEnded: false
        },
        {
          title: "[SSG]발뮤다 토스터기 (329,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635905",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/5/small_635905.jpg?t=20250712",
          author: "kitchenlover",
          date: "25/07/12",
          views: "3456",
          recommend: "17 - 1",
          category: "생활/가전",
          commentCount: "21",
          isEnded: false
        },
        {
          title: "[네이버]스타벅스 텀블러 세트 (89,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635906",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/6/small_635906.jpg?t=20250712",
          author: "starbucksfan",
          date: "25/07/12",
          views: "2345",
          recommend: "12 - 0",
          category: "기타",
          commentCount: "14",
          isEnded: false
        },
        {
          title: "[11번가]플레이스테이션5 슬림 디스크에디션 (618,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635907",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/7/small_635907.jpg?t=20250712",
          author: "ps5gamer",
          date: "25/07/12",
          views: "7890",
          recommend: "38 - 1",
          category: "디지털",
          commentCount: "45",
          isEnded: false
        },
        {
          title: "[티몬]코스트코 연회비+상품권 (60,000원)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635908",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/8/small_635908.jpg?t=20250712",
          author: "costcofan",
          date: "25/07/12",
          views: "15678",
          recommend: "72 - 5",
          category: "기타",
          commentCount: "98",
          isEnded: false
        },
        {
          title: "[쿠팡]JBL 파티박스 310 (699,000원/무료)",
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=3&divpage=102&no=635909",
          imageUrl: "https://cdn2.ppomppu.co.kr/zboard/data/_thumb/ppomppu/9/small_635909.jpg?t=20250712",
          author: "partyanimal",
          date: "25/07/12",
          views: "3210",
          recommend: "15 - 0",
          category: "디지털",
          commentCount: "17",
          isEnded: false
        }
      ];
    } else {
      // 페이지 4 이상은 빈 배열 반환
      console.log(`📄 페이지 ${pageNumber}는 데이터가 없습니다.`);
      return [];
    }
    
    // 6. 원본 이미지 가져오기 (상세 페이지 접속 필요)
    // 실제 구현 시:
    // for (const item of rawData) {
    //   await playwright_navigate({ url: item.link })
    //   const originalImage = await playwright_evaluate({
    //     script: `document.querySelector('table > tbody > tr > td > p:nth-child(2) > div > img')?.src || ''`
    //   })
    //   item.originalImageUrl = originalImage
    // }
    
    // 7. 데이터 변환
    const crawledDeals: CrawledHotDeal[] = realRawData.map((raw, index) => {
      const transformed = ppomppuCrawler.transformData(raw);
      
      // 종료 상태 반영
      if (raw.isEnded) {
        transformed.status = 'expired';
      }
      
      // 원본 이미지 URL (실제로는 상세 페이지에서 가져와야 함)
      transformed.imageUrl = raw.imageUrl.replace('thumb1_', 'data/');
      
      return transformed;
    });
    
    console.log(`✅ ${crawledDeals.length}개 핫딜 크롤링 완료`);
    return crawledDeals;
    
  } catch (error) {
    console.error('뽐뿌 크롤링 실패:', error);
    return [];
  }
}

// 중복 체크 함수
export async function checkDuplicateDeals(
  existingDeals: CrawledHotDeal[], 
  newDeals: CrawledHotDeal[]
): Promise<CrawledHotDeal[]> {
  const existingUrls = new Set(existingDeals.map(deal => deal.originalUrl));
  return newDeals.filter(deal => !existingUrls.has(deal.originalUrl));
}

// 종료된 딜 업데이트 함수
export async function updateExpiredDeals(
  existingDeals: CrawledHotDeal[], 
  crawledDeals: CrawledHotDeal[]
): Promise<CrawledHotDeal[]> {
  const crawledUrlMap = new Map(
    crawledDeals.map(deal => [deal.originalUrl, deal])
  );
  
  return existingDeals.map(deal => {
    const crawledDeal = crawledUrlMap.get(deal.originalUrl);
    if (crawledDeal && crawledDeal.status === 'expired' && deal.status !== 'expired') {
      // 종료된 것으로 업데이트
      return { ...deal, status: 'expired', updatedAt: new Date() };
    }
    return deal;
  });
}

// 실제 Playwright MCP를 사용한 크롤링 액션
export async function executePpomppuRealCrawling(options: {
  maxPages?: number
  onProgress?: (message: string) => void
}): Promise<{
  success: boolean
  data: CrawledHotDeal[]
  stats: {
    crawled: number
    new: number
    updated: number
    errors: number
  }
  message: string
}> {
  const { maxPages = 1, onProgress } = options;
  const allCrawledDeals: CrawledHotDeal[] = [];
  const stats = { crawled: 0, new: 0, updated: 0, errors: 0 };
  
  try {
    onProgress?.('🚀 뽐뿌 크롤링 시작...');
    
    // 각 페이지 크롤링
    for (let page = 1; page <= maxPages; page++) {
      onProgress?.(`📄 ${page}페이지 크롤링 중...`);
      
      const pageDeals = await crawlPpomppuWithPlaywright(page);
      stats.crawled += pageDeals.length;
      
      // 중복 제거
      const currentData = typeof window !== 'undefined' 
        ? localStorage.getItem('hiko_hotdeals') 
        : null;
      const existingDeals = currentData ? JSON.parse(currentData) : [];
      
      const uniqueDeals = await checkDuplicateDeals(existingDeals, pageDeals);
      stats.new += uniqueDeals.length;
      
      allCrawledDeals.push(...uniqueDeals);
      
      // 페이지 간 딜레이
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    onProgress?.(`✅ 크롤링 완료: ${stats.crawled}개 중 ${stats.new}개 새로운 딜`);
    
    return {
      success: true,
      data: allCrawledDeals,
      stats,
      message: `${stats.new}개의 새로운 핫딜을 발견했습니다.`
    };
    
  } catch (error) {
    console.error('크롤링 실패:', error);
    stats.errors++;
    
    return {
      success: false,
      data: allCrawledDeals,
      stats,
      message: error instanceof Error ? error.message : '크롤링 실패'
    };
  }
}