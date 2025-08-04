import type { HotDeal } from '@/types/hotdeal'

export interface ClassificationRule {
  category: string
  keywords: string[]
  patterns: RegExp[]
  priority: number
  confidence: number
}

export interface ClassificationResult {
  category: string
  confidence: number
  matchedKeywords: string[]
  reason: string
}

/**
 * 핫딜 자동 분류 서비스
 * 제목과 설명을 기반으로 상품을 적절한 카테고리로 자동 분류
 */
export class HotDealClassificationService {
  private static readonly CLASSIFICATION_RULES: ClassificationRule[] = [
    // 가전/디지털 카테고리 (우선순위 높음)
    {
      category: '가전/디지털',
      keywords: [
        '가전', '전자', '디지털', '컴퓨터', '노트북', '데스크탑', 'PC',
        '스마트폰', '갤럭시', '아이폰', 'iPhone', '갤탭', '아이패드', 'iPad',
        '모니터', '키보드', '마우스', '헤드셋', '이어폰', '스피커',
        '프린터', '스캐너', '웹캠', 'USB', 'SSD', 'HDD',
        '냉장고', '세탁기', '건조기', '에어컨', '공기청정기', '가습기', '제습기',
        '전자레인지', '오븐', '에어프라이어', '인덕션', '밥솥', '정수기',
        '드라이기', '고데기', '면도기', '칫솔', '블루투스', 'Bluetooth',
        '충전기', '보조배터리', '파워뱅크', '무선충전', 'TV', '티비',
        '로봇청소기', '청소기', '다리미', '커피머신', '믹서기', '주스기'
      ],
      patterns: [
        /갤럭시|galaxy/i,
        /아이폰|iphone/i,
        /맥북|macbook/i,
        /에어팟|airpods/i,
        /LG|삼성|애플|Apple|소니|Sony|필립스|Philips/i
      ],
      priority: 9,
      confidence: 0.9
    },
    
    // 화장품/미용 카테고리
    {
      category: '화장품/미용',
      keywords: [
        '화장품', '미용', '스킨케어', '메이크업', '향수', '퍼퓸', '헤어',
        '샴푸', '컨디셔너', '트리트먼트', '염색', '펌', '스타일링',
        '토너', '에센스', '세럼', '크림', '로션', '선크림', '자외선차단제',
        '파운데이션', '컨실러', '비비크림', '쿠션', '립스틱', '립글로스',
        '아이섀도', '마스카라', '아이라이너', '블러셔', '브론저',
        '클렌징', '필링', '마스크팩', '패치', '아이크림', '넥크림',
        '바디로션', '바디워시', '보디크림', '핸드크림', '풋크림',
        '네일', '매니큐어', '페디큐어', '젤네일', '네일아트',
        '퍼퓸', '향수', '바디미스트', '섬유유연제', '방향제'
      ],
      patterns: [
        /로더베르|페르니|존슨즈|Johnson|로레알|L'Oreal|메이블린|Maybelline/i,
        /스킨\s*케어|skin\s*care/i,
        /헤어\s*케어|hair\s*care/i,
        /바디\s*워시|body\s*wash/i
      ],
      priority: 8,
      confidence: 0.85
    },
    
    // 생활용품/주방 카테고리
    {
      category: '생활용품/주방',
      keywords: [
        '생활용품', '주방', '생활', '가구', '인테리어', '욕실', '청소', '수납',
        '냄비', '팬', '프라이팬', '웍', '찜기', '압력솥', '그릇', '접시',
        '컵', '텀블러', '물병', '도시락', '밀폐용기', '보관용기', '글라스락',
        '젓가락', '숟가락', '포크', '나이프', '칼', '도마', '키친타올',
        '랩', '호일', '지퍼백', '비닐봉지', '쓰레기봉투',
        '화장지', '휴지', '티슈', '물티슈', '키친타올', '크리넥스',
        '세제', '세탁세제', '주방세제', '표백제', '섬유유향제',
        '청소용품', '걸레', '수세미', '스폰지', '브러시', '빗자루',
        '침구', '이불', '베개', '매트리스', '시트', '커튼', '블라인드',
        '수건', '타월', '목욕용품', '샤워용품', '비누', '치약', '칫솔',
        '테팔', 'Tefal', '쿠진아트', '락앤락', 'Lock&Lock'
      ],
      patterns: [
        /테팔|tefal/i,
        /글라스락|glasslock/i,
        /락앤락|lock.*lock/i,
        /크리넥스|kleenex/i,
        /깨끗한나라/i
      ],
      priority: 7,
      confidence: 0.8
    },
    
    // 의류/잡화 카테고리
    {
      category: '의류/잡화',
      keywords: [
        '의류', '옷', '상의', '하의', '원피스', '셔츠', '블라우스', '티셔츠',
        '바지', '청바지', '반바지', '치마', '스커트', '레깅스', '스타킹',
        '속옷', '언더웨어', '브래지어', '팬티', '런닝', '내의',
        '외투', '자켓', '점퍼', '코트', '패딩', '야상', '후드',
        '신발', '운동화', '구두', '부츠', '샌들', '슬리퍼', '스니커즈',
        '가방', '백팩', '숄더백', '토트백', '크로스백', '지갑', '파우치',
        '악세서리', '목걸이', '팔찌', '귀걸이', '반지', '시계', '모자',
        '벨트', '스카프', '머플러', '장갑', '양말', '스타킹',
        '나이키', 'Nike', '아디다스', 'Adidas', '퓨마', 'Puma',
        '유니클로', 'Uniqlo', 'GU', '자라', 'Zara', 'H&M',
        '반팔', '긴팔', '민소매', '브이넥', '라운드넥', '카라',
        '여름', '겨울', '봄', '가을', '시즌', '신상', '기본템'
      ],
      patterns: [
        /나이키|nike/i,
        /아디다스|adidas/i,
        /유니클로|uniqlo/i,
        /반팔|긴팔|민소매/i,
        /상하복|세트/i
      ],
      priority: 8,
      confidence: 0.85
    },
    
    // 식품/건강 카테고리
    {
      category: '식품/건강',
      keywords: [
        '식품', '음식', '먹거리', '간식', '과자', '사탕', '초콜릿', '젤리',
        '라면', '면', '파스타', '우동', '냉면', '쌀', '밥', '죽',
        '고기', '소고기', '돼지고기', '닭고기', '생선', '해산물', '새우',
        '야채', '채소', '과일', '사과', '바나나', '오렌지', '포도',
        '우유', '치즈', '요거트', '버터', '계란', '달걀',
        '커피', '차', '음료수', '주스', '생수', '이온음료',
        '건강', '비타민', '영양제', '홍삼', '건강식품', '프로틴', '유산균',
        '다이어트', '단백질', '칼슘', '철분', '오메가3', 'DHA',
        '감기약', '두통약', '소화제', '변비약', '파스', '밴드',
        '마스크', '손소독제', '체온계', '혈압계', '혈당계'
      ],
      patterns: [
        /비타민|vitamin/i,
        /프로틴|protein/i,
        /오메가3|omega/i,
        /홍삼|인삼/i,
        /건강식품/i
      ],
      priority: 6,
      confidence: 0.75
    },
    
    // 유아/육아용품 카테고리
    {
      category: '유아/육아용품',
      keywords: [
        '유아', '아기', '베이비', '신생아', '영유아', '어린이', '키즈',
        '기저귀', '물티슈', '분유', '이유식', '젖병', '젖꼭지', '빨대컵',
        '유모차', '카시트', '아기띠', '보행기', '높은의자', '아기침대',
        '아기옷', '로맨', '바디슈트', '우주복', '수유복', '임부복',
        '장난감', '블록', '퍼즐', '인형', '자동차', '놀이매트',
        '목욕용품', '샴푸', '로션', '오일', '파우더', '세제',
        '몰리멜리', '보솜', '하기스', 'Huggies', '팸퍼스', 'Pampers',
        '앱솔루트', '아토팜', '존슨즈베이비'
      ],
      patterns: [
        /몰리멜리/i,
        /베이비|baby/i,
        /키즈|kids/i,
        /유아|영유아/i
      ],
      priority: 9,
      confidence: 0.9
    },
    
    // 스포츠/레저 카테고리
    {
      category: '스포츠/레저',
      keywords: [
        '스포츠', '운동', '헬스', '피트니스', '요가', '필라테스',
        '런닝', '조깅', '마라톤', '등산', '캠핑', '낚시', '골프',
        '축구', '야구', '농구', '배구', '테니스', '배드민턴', '탁구',
        '수영', '다이빙', '서핑', '스키', '스노보드', '스케이트',
        '자전거', '킥보드', '인라인', '스케이트보드', '롱보드',
        '운동복', '스포츠웨어', '운동화', '등산화', '축구화',
        '헬스기구', '덤벨', '바벨', '아령', '매트', '밴드',
        '텐트', '침낭', '백팩', '등산용품', '캠핑용품', '낚시용품',
        '골프용품', '골프클럽', '골프공', '골프백', '골프웨어'
      ],
      patterns: [
        /스포츠|sports/i,
        /헬스|fitness/i,
        /캠핑|camping/i,
        /골프|golf/i
      ],
      priority: 7,
      confidence: 0.8
    },
    
    // 도서/문구 카테고리
    {
      category: '도서/문구',
      keywords: [
        '도서', '책', '소설', '에세이', '자기계발', '요리책', '육아서',
        '문구', '필기구', '볼펜', '연필', '샤프', '지우개', '형광펜',
        '노트', '다이어리', '수첩', '메모지', '포스트잇',
        '파일', '바인더', '클리어파일', '가위', '자', '계산기',
        '스테이플러', '펀치', '라벨지', '테이프', '풀', '딱풀'
      ],
      patterns: [
        /도서|책/i,
        /문구/i,
        /노트|다이어리/i
      ],
      priority: 6,
      confidence: 0.75
    },
    
    // 반려동물용품 카테고리
    {
      category: '반려동물용품',
      keywords: [
        '반려동물', '펫', '강아지', '개', '고양이', '냥이', '멍멍이',
        '사료', '간식', '우유', '영양제', '치약', '샴푸', '목욕',
        '장난감', '공', '로프', '쿠션', '방석', '하우스', '케이지',
        '목줄', '하네스', '리드줄', '산책', '배변패드', '모래',
        '캐리어', '이동장', '급식기', '급수기', '정수기'
      ],
      patterns: [
        /반려동물|펫|pet/i,
        /강아지|개|멍멍이/i,
        /고양이|냥이/i,
        /사료/i
      ],
      priority: 8,
      confidence: 0.85
    }
  ]

  /**
   * 핫딜을 자동으로 분류합니다
   */
  static classifyHotDeal(hotdeal: HotDeal): ClassificationResult {
    const text = `${hotdeal.title} ${hotdeal.productComment || ''}`.toLowerCase()
    
    let bestMatch: ClassificationResult = {
      category: '기타',
      confidence: 0,
      matchedKeywords: [],
      reason: '매칭되는 카테고리를 찾을 수 없음'
    }

    for (const rule of this.CLASSIFICATION_RULES) {
      const result = this.evaluateRule(text, rule)
      
      if (result.confidence > bestMatch.confidence) {
        bestMatch = result
      }
    }

    return bestMatch
  }

  /**
   * 제목만으로 빠른 분류 (크롤러에서 사용)
   */
  static classifyByTitle(title: string): string {
    const result = this.classifyText(title)
    return result.category
  }

  /**
   * 텍스트를 분석하여 분류 결과를 반환합니다
   */
  static classifyText(text: string): ClassificationResult {
    const normalizedText = text.toLowerCase()
    
    let bestMatch: ClassificationResult = {
      category: '기타',
      confidence: 0,
      matchedKeywords: [],
      reason: '매칭되는 카테고리를 찾을 수 없음'
    }

    for (const rule of this.CLASSIFICATION_RULES) {
      const result = this.evaluateRule(normalizedText, rule)
      
      if (result.confidence > bestMatch.confidence) {
        bestMatch = result
      }
    }

    return bestMatch
  }

  /**
   * 규칙을 평가하여 분류 결과를 반환합니다
   */
  private static evaluateRule(text: string, rule: ClassificationRule): ClassificationResult {
    let score = 0
    const matchedKeywords: string[] = []
    const reasons: string[] = []

    // 키워드 매칭
    for (const keyword of rule.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1
        matchedKeywords.push(keyword)
      }
    }

    // 패턴 매칭 (가중치 높음)
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        score += 2
        reasons.push(`패턴 매칭: ${pattern.source}`)
      }
    }

    // 키워드 밀도 보너스 (여러 키워드가 매칭될수록 높은 점수)
    if (matchedKeywords.length > 1) {
      score += matchedKeywords.length * 0.5
    }

    // 우선순위 적용
    const finalScore = score * (rule.priority / 10)
    
    // 신뢰도 계산 (0~1 사이)
    const confidence = Math.min(finalScore / 10, 1) * rule.confidence

    const reason = matchedKeywords.length > 0 
      ? `키워드 매칭: ${matchedKeywords.slice(0, 3).join(', ')}`
      : reasons.join(', ') || '매칭 없음'

    return {
      category: rule.category,
      confidence,
      matchedKeywords,
      reason
    }
  }

  /**
   * 기존 핫딜의 카테고리를 재분류합니다
   */
  static reclassifyHotDeal(hotdeal: HotDeal): string {
    // 기존 카테고리가 정확한지 확인
    const result = this.classifyHotDeal(hotdeal)
    
    // 신뢰도가 높고 기존 카테고리와 다를 경우 새 카테고리 제안
    if (result.confidence > 0.7 && result.category !== hotdeal.category) {
      return result.category
    }
    
    // 기존 카테고리가 "기타"이고 더 나은 분류가 있는 경우
    if ((hotdeal.category === '기타' || hotdeal.category === '[기타]') && result.confidence > 0.5) {
      return result.category
    }
    
    return hotdeal.category || '기타'
  }

  /**
   * 전체 카테고리 목록을 반환합니다
   */
  static getAvailableCategories(): string[] {
    const categories = this.CLASSIFICATION_RULES.map(rule => rule.category)
    categories.push('기타') // 기본 카테고리 추가
    return [...new Set(categories)].sort()
  }

  /**
   * 분류 통계를 반환합니다
   */
  static getClassificationStats(hotdeals: HotDeal[]): Record<string, number> {
    const stats: Record<string, number> = {}
    
    for (const hotdeal of hotdeals) {
      const category = hotdeal.category || '기타'
      stats[category] = (stats[category] || 0) + 1
    }
    
    return stats
  }

  /**
   * 카테고리 정규화 (대괄호 제거 등)
   */
  static normalizeCategory(category: string): string {
    if (!category) return '기타'
    
    // 대괄호 제거
    const normalized = category.replace(/^\[|\]$/g, '')
    
    // 빈 문자열이면 기타로 처리
    if (!normalized.trim()) return '기타'
    
    return normalized
  }
}