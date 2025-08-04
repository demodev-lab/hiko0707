import { CommunitySelectors } from './community-crawler'
import { HotDealSource } from '@/types/hotdeal'

// 커뮤니티별 설정 타입
export interface CommunityConfig {
  name: HotDealSource
  displayName: string
  baseUrl: string
  boardUrl: string
  selectors: CommunitySelectors
  parseRules?: {
    dateFormat?: string
    pricePatterns?: RegExp[]
    sellerPatterns?: RegExp[]
  }
}

// 커뮤니티별 설정
export const COMMUNITY_CONFIGS: Record<HotDealSource, CommunityConfig> = {
  ppomppu: {
    name: 'ppomppu',
    displayName: '뽐뿌',
    baseUrl: 'https://www.ppomppu.co.kr',
    boardUrl: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu',
    selectors: {
      // 목록 페이지
      listRows: '#revolution_main_table > tbody > tr.baseList',
      nextPageButton: '#bottom-table > div.info_bg > a',
      
      // 목록 항목
      titleLink: 'td.baseList-space.title > div > div > a',
      titleText: 'td.baseList-space.title > div > div > a > span',
      imageThumb: 'td.baseList-space.title > a > img',
      category: 'td.baseList-space.title > div > small',
      author: 'td:nth-child(3) > div > nobr > a > span',
      date: 'td:nth-child(4) > time, td:nth-child(4)',
      views: 'td.baseList-space.baseList-views',
      recommend: 'td.baseList-space.baseList-rec',
      commentCount: 'td.baseList-space.title > div > div > span',
      endedMark: 'td.baseList-space.title > div > div > img[alt="종료"]',
      
      // 상세 페이지
      detailImage: [
        '.board-contents img',
        'td.board-contents img',
        '[class*="content"] img'
      ],
      detailContent: [
        'td.board-contents',
        'div.board-contents',
        'table.board-contents'
      ]
    },
    parseRules: {
      dateFormat: 'YY/MM/DD',
      pricePatterns: [
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/,
        /₩\s*(\d{1,3}(?:,\d{3})*)/,
        /(\d{1,3}(?:,\d{3})*)\s*~/,
        /\((\d{1,3}(?:,\d{3})*)[원)]/
      ]
    }
  },
  
  ruliweb: {
    name: 'ruliweb',
    displayName: '루리웹',
    baseUrl: 'https://bbs.ruliweb.com',
    boardUrl: 'https://bbs.ruliweb.com/ps/board/1020',
    selectors: {
      // 목록 페이지 - 루리웹 특화
      listRows: '.board_list_table tbody tr:not(.notice)',
      nextPageButton: '.pagination .next',
      
      // 목록 항목
      titleLink: '.subject .deco a',
      titleText: '.subject .deco a',
      imageThumb: '.subject img.thumb',
      category: '.subject .category',
      author: '.writer a',
      date: '.time',
      views: '.hit',
      recommend: '.recomd',
      commentCount: '.subject .num_reply',
      endedMark: '.subject .end_icon',
      
      // 상세 페이지
      detailImage: [
        '.board_main_view img',
        '.view_content img'
      ],
      detailContent: [
        '.board_main_view',
        '.view_content'
      ]
    }
  },
  
  clien: {
    name: 'clien',
    displayName: '클리앙',
    baseUrl: 'https://www.clien.net',
    boardUrl: 'https://www.clien.net/service/board/jirum',
    selectors: {
      // 목록 페이지 - 클리앙 특화
      listRows: '.list_content > .contents_jirum > div.list_item',
      nextPageButton: '.board-nav-prev-next .next',
      
      // 목록 항목
      titleLink: '.list_title a.list_subject',
      titleText: '.list_title a.list_subject span[data-role="list-title-text"]',
      imageThumb: '.list_title img.thumb',
      category: '.list_title .category',
      author: '.list_author .nickname',
      date: '.list_time .timestamp',
      views: '.list_hit',
      recommend: '.list_symph',
      commentCount: '.list_reply .rSymph07',
      endedMark: '.list_title .end_mark',
      
      // 상세 페이지
      detailImage: [
        '.post_content img',
        '.post_article img'
      ],
      detailContent: [
        '.post_content',
        '.post_article'
      ]
    }
  },
  
  quasarzone: {
    name: 'quasarzone',
    displayName: '퀘이사존',
    baseUrl: 'https://quasarzone.com',
    boardUrl: 'https://quasarzone.com/bbs/qb_saleinfo',
    selectors: {
      // 목록 페이지 - 퀘이사존 특화
      listRows: '.market-type-list > table > tbody > tr',
      nextPageButton: '.page-nav .next',
      
      // 목록 항목
      titleLink: '.subject-link',
      titleText: '.subject-link',
      imageThumb: '.subject-link img',
      category: '.category',
      author: '.nick',
      date: '.date',
      views: '.count',
      recommend: '.recommend',
      commentCount: '.comment-count',
      endedMark: '.end-mark',
      
      // 상세 페이지
      detailImage: [
        '.view-content img',
        '#view_content img'
      ],
      detailContent: [
        '.view-content',
        '#view_content'
      ]
    }
  },
  
  coolenjoy: {
    name: 'coolenjoy',
    displayName: '쿨엔조이',
    baseUrl: 'https://coolenjoy.net',
    boardUrl: 'https://coolenjoy.net/bbs/jirum',
    selectors: {
      // 목록 페이지 - 쿨엔조이 특화
      listRows: '.board-list tbody tr',
      nextPageButton: '.pagination .next',
      
      // 목록 항목
      titleLink: '.td_subject a',
      titleText: '.td_subject a',
      imageThumb: '.td_subject img',
      category: '.td_category',
      author: '.td_name a',
      date: '.td_date',
      views: '.td_hit',
      recommend: '.td_recommend',
      commentCount: '.td_subject .comment',
      endedMark: '.td_subject .end',
      
      // 상세 페이지
      detailImage: [
        '.board_view img',
        '.view_content img'
      ],
      detailContent: [
        '.board_view',
        '.view_content'
      ]
    }
  },
  
  eomisae: {
    name: 'eomisae',
    displayName: '어미새',
    baseUrl: 'https://eomisae.co.kr',
    boardUrl: 'https://eomisae.co.kr/index.php?mid=sale',
    selectors: {
      // 목록 페이지 - 어미새 특화
      listRows: '.board_list tbody tr',
      nextPageButton: '.pagination .direction.next',
      
      // 목록 항목
      titleLink: '.title a',
      titleText: '.title a',
      imageThumb: '.thumbnail img',
      category: '.category',
      author: '.author a',
      date: '.date',
      views: '.readNum',
      recommend: '.voteNum',
      commentCount: '.replyNum',
      endedMark: '.title .end_icon',
      
      // 상세 페이지
      detailImage: [
        '.xe_content img',
        '.document_content img'
      ],
      detailContent: [
        '.xe_content',
        '.document_content'
      ]
    }
  },
  
  zod: {
    name: 'zod',
    displayName: 'ZOD',
    baseUrl: 'https://zod.kr',
    boardUrl: 'https://zod.kr/board/hotdeal',
    selectors: {
      // 목록 페이지 - ZOD 특화
      listRows: '.board-table tbody tr',
      nextPageButton: '.pagination-next',
      
      // 목록 항목
      titleLink: '.title-cell a',
      titleText: '.title-cell a .title-text',
      imageThumb: '.title-cell .thumb',
      category: '.category-badge',
      author: '.author-cell',
      date: '.date-cell',
      views: '.view-count',
      recommend: '.recommend-count',
      commentCount: '.comment-count',
      endedMark: '.end-badge',
      
      // 상세 페이지
      detailImage: [
        '.post-content img',
        '.content-body img'
      ],
      detailContent: [
        '.post-content',
        '.content-body'
      ]
    }
  },
  
  algumon: {
    name: 'algumon',
    displayName: '알구몬',
    baseUrl: 'https://www.algumon.com',
    boardUrl: 'https://www.algumon.com/board/deal',
    selectors: {
      // 목록 페이지 - 알구몬 특화
      listRows: '.deal-list .deal-item',
      nextPageButton: '.pagination-wrap .next-btn',
      
      // 목록 항목
      titleLink: '.deal-title a',
      titleText: '.deal-title a',
      imageThumb: '.deal-thumb img',
      category: '.deal-category',
      author: '.deal-author',
      date: '.deal-date',
      views: '.deal-views',
      recommend: '.deal-recommend',
      commentCount: '.deal-comments',
      endedMark: '.deal-ended',
      
      // 상세 페이지
      detailImage: [
        '.deal-detail img',
        '.detail-content img'
      ],
      detailContent: [
        '.deal-detail',
        '.detail-content'
      ]
    }
  },
  
  itcm: {
    name: 'itcm',
    displayName: 'ITCM',
    baseUrl: 'https://www.itcm.co.kr',
    boardUrl: 'https://www.itcm.co.kr/board/sale',
    selectors: {
      // 목록 페이지 - ITCM 특화
      listRows: '.board-list tbody tr',
      nextPageButton: '.pagination .next',
      
      // 목록 항목
      titleLink: '.subject a',
      titleText: '.subject a',
      imageThumb: '.subject img.thumb',
      category: '.category',
      author: '.writer',
      date: '.date',
      views: '.hit',
      recommend: '.recommend',
      commentCount: '.comment',
      endedMark: '.end-icon',
      
      // 상세 페이지
      detailImage: [
        '.board-view img',
        '.content-view img'
      ],
      detailContent: [
        '.board-view',
        '.content-view'
      ]
    }
  }
}

// 카테고리 정규화 맵
export const CATEGORY_NORMALIZATION_MAP: Record<string, string> = {
  // 전자/디지털
  '컴퓨터': '전자',
  '디지털': '전자',
  'PC/하드웨어': '전자',
  '모바일/태블릿': '전자',
  '가전': '전자',
  
  // 생활/가전
  '가전/가구': '생활/가전',
  '생활/주방': '생활/가전',
  '인테리어': '생활/가전',
  '생활용품': '생활/가전',
  
  // 패션
  '의류/잡화': '패션',
  '의류': '패션',
  '패션/잡화': '패션',
  '신발': '패션',
  
  // 뷰티
  '화장품': '뷰티',
  '뷰티/헬스': '뷰티',
  '향수/화장품': '뷰티',
  
  // 식품
  '식품/건강': '식품',
  '식품': '식품',
  '먹거리': '식품',
  
  // 유아
  '육아': '유아',
  '유아/완구': '유아',
  '출산/육아': '유아',
  
  // 스포츠
  '레저/자동차': '스포츠',
  '스포츠/레저': '스포츠',
  '운동': '스포츠',
  
  // 문화
  '도서/음반': '문화',
  '게임': '문화',
  '문구/완구': '문화',
  
  // 기타
  '기타': '기타',
  '': '기타'
}

// 판매처 추출 패턴
export const SELLER_PATTERNS = [
  // [쿠팡], (G마켓) 등의 패턴
  /[\[(]([^\])]+)[\])]/,
  // 쿠팡 : , G마켓 : 등의 패턴
  /^([^:]+)\s*:/,
  // 제목 끝에 - 쿠팡, - G마켓 등
  /-\s*([^\-]+)$/
]

// 알려진 판매처 목록
export const KNOWN_SELLERS = [
  '쿠팡', 'Coupang',
  'G마켓', 'Gmarket', '지마켓',
  '11번가', '11st',
  '옥션', 'Auction',
  '위메프', 'Wemakeprice',
  '티몬', 'TMON', 'Tmon',
  'SSG', 'ssg', '신세계',
  '네이버', 'Naver', '네이버쇼핑',
  '인터파크', 'Interpark',
  'GS샵', 'GS SHOP',
  '롯데온', 'LotteOn', '롯데몰',
  '마켓컬리', 'Kurly', '컬리',
  '무신사', 'Musinsa',
  '알리익스프레스', 'AliExpress', '알리',
  '아마존', 'Amazon',
  '이베이', 'eBay',
  '다나와', 'Danawa',
  '에누리', 'Enuri'
]

// 무료배송 키워드
export const FREE_SHIPPING_KEYWORDS = [
  '무료', '무배', '무료배송', '배송비무료', '무료배송',
  '배송비 무료', '배송료 무료', '택배비 무료',
  'free shipping', 'free delivery'
]