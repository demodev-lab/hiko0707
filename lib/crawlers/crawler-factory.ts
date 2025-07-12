import { CommunityCrawler } from './community-crawler'
import { PpomppuRealCrawler } from './ppomppu-real-crawler'
import { HotDealSource } from '@/types/hotdeal'

// 크롤러 타입
export type CrawlerType = HotDealSource

// 크롤러 팩토리
export class CrawlerFactory {
  private static crawlers: Map<CrawlerType, CommunityCrawler> = new Map()
  
  // 크롤러 생성
  static createCrawler(type: CrawlerType): CommunityCrawler {
    // 캐시된 크롤러 반환
    const cached = this.crawlers.get(type)
    if (cached) return cached
    
    let crawler: CommunityCrawler
    
    switch (type) {
      case 'ppomppu':
        crawler = new PpomppuRealCrawler()
        break
        
      case 'ruliweb':
        // TODO: RuliwebCrawler 구현
        throw new Error('Ruliweb 크롤러는 아직 구현되지 않았습니다')
        
      case 'clien':
        // TODO: ClienCrawler 구현
        throw new Error('Clien 크롤러는 아직 구현되지 않았습니다')
        
      case 'quasarzone':
        // TODO: QuasarzoneCrawler 구현
        throw new Error('Quasarzone 크롤러는 아직 구현되지 않았습니다')
        
      case 'coolenjoy':
        // TODO: CoolenjoyCrawler 구현
        throw new Error('Coolenjoy 크롤러는 아직 구현되지 않았습니다')
        
      case 'eomisae':
        // TODO: EomisaeCrawler 구현
        throw new Error('어미새 크롤러는 아직 구현되지 않았습니다')
        
      case 'zod':
        // TODO: ZodCrawler 구현
        throw new Error('Zod 크롤러는 아직 구현되지 않았습니다')
        
      case 'algumon':
        // TODO: AlgumonCrawler 구현
        throw new Error('알구몬 크롤러는 아직 구현되지 않았습니다')
        
      default:
        throw new Error(`지원하지 않는 크롤러 타입: ${type}`)
    }
    
    // 캐시에 저장
    this.crawlers.set(type, crawler)
    
    return crawler
  }
  
  // 사용 가능한 크롤러 목록
  static getAvailableCrawlers(): CrawlerType[] {
    return ['ppomppu'] // 현재는 뽐뿌만 구현됨
  }
  
  // 크롤러 상태 정보
  static getCrawlerInfo(type: CrawlerType): {
    name: string
    displayName: string
    status: 'active' | 'development' | 'planned'
    emoji: string
  } {
    const crawlerInfo = {
      ppomppu: {
        name: 'ppomppu',
        displayName: '뽐뿌',
        status: 'active' as const,
        emoji: '🛍️'
      },
      ruliweb: {
        name: 'ruliweb',
        displayName: '루리웹',
        status: 'planned' as const,
        emoji: '🎮'
      },
      clien: {
        name: 'clien',
        displayName: '클리앙',
        status: 'planned' as const,
        emoji: '💻'
      },
      quasarzone: {
        name: 'quasarzone',
        displayName: '퀘이사존',
        status: 'planned' as const,
        emoji: '🖥️'
      },
      coolenjoy: {
        name: 'coolenjoy',
        displayName: '쿨엔조이',
        status: 'planned' as const,
        emoji: '🎯'
      },
      eomisae: {
        name: 'eomisae',
        displayName: '어미새',
        status: 'planned' as const,
        emoji: '🦅'
      },
      zod: {
        name: 'zod',
        displayName: 'ZOD',
        status: 'planned' as const,
        emoji: '⚡'
      },
      algumon: {
        name: 'algumon',
        displayName: '알구몬',
        status: 'planned' as const,
        emoji: '🔍'
      }
    }
    
    return crawlerInfo[type] || {
      name: type,
      displayName: type,
      status: 'planned',
      emoji: '❓'
    }
  }
  
  // 모든 크롤러 정보 가져오기
  static getAllCrawlerInfo() {
    const allTypes: CrawlerType[] = [
      'ppomppu', 'ruliweb', 'clien', 'quasarzone', 
      'coolenjoy', 'eomisae', 'zod', 'algumon'
    ]
    
    return allTypes.map(type => ({
      type,
      ...this.getCrawlerInfo(type)
    }))
  }
}