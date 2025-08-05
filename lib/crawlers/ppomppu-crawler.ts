import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface PpomppuPost {
  postNumber: string
  title: string
  url: string
  author: string
  category?: string
  isPopular: boolean
  isHot?: boolean
  thumbnailUrl?: string
  views: number
  recommendCount: number
  postDate: Date
}

export class PpomppuCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    postRow: '#revolution_main_table > tbody > tr.baseList',
    postNumber: 'td.baseList-space.baseList-numb',
    titleLink: 'a[href*="no="]',
    category: 'td.baseList-space.title > div > small',
    hotTag: 'td.baseList-space.title > div > div > img[src="/images/menu/pop_icon2.jpg"]',
    hotLabelTag: 'td.baseList-space.title > div > div > img[src*="icon_hot"]', // HOT 라벨 추가
    recommendCount: 'td.baseList-space.baseList-rec',
    // 여러 가능한 콘텐츠 영역 셀렉터
    contentAreas: [
      '.board-contents',  // 새로운 뽐뿌 구조
      '.han_contents',    // 한글 콘텐츠
      '.view_contents',   // 뷰 콘텐츠
      'table.board_table td.han',  // 테이블 구조
      'div.board_view div.board_content',  // div 구조
      'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td'  // 기존 셀렉터
    ],
    contentImages: '.board-contents img, .han_contents img, .view_contents img, .contents img, .board_content img'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('뽐뿌 크롤링 시작...').start()
    
    try {
      await this.init()
      
      // 시간 기준 필터링을 위한 설정
      const timeFilterHours = this.options.timeFilterHours
      const timeFilterEnabled = timeFilterHours && timeFilterHours > 0
      const cutoffTime = timeFilterEnabled ? new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000)) : null
      
      // 동적 진행도 관리
      let shouldStopCrawling = false
      let totalProcessed = 0
      let totalEstimated = timeFilterEnabled ? 0 : this.options.maxPages * 20 // 페이지 기준일 경우 추정값
      
      // 초기 진행도 설정
      if (timeFilterEnabled) {
        this.options.onProgress?.(0, 100, `시간 기준 크롤링 시작 (${timeFilterHours}시간 내)`)
      } else {
        this.options.onProgress?.(0, totalEstimated, `페이지 기준 크롤링 시작 (${this.options.maxPages}페이지)`)
      }
      
      for (let pageNum = 1; pageNum <= this.options.maxPages && !shouldStopCrawling; pageNum++) {
        spinner.text = `뽐뿌 페이지 ${pageNum}/${this.options.maxPages} 크롤링 중...`
        
        const posts = await this.crawlPage(pageNum)
        
        if (posts.length === 0) {
          continue
        }
        
        console.log(chalk.gray(`페이지 ${pageNum}: ${posts.length}개 게시물 발견`))
        
        // 시간 필터링을 상세페이지 기준으로 수행
        let oldPostsInRowCount = 0
        
        for (let i = 0; i < posts.length; i++) {
          const currentProgress = totalProcessed + 1
          
          // 동적 진행도 표시 계산
          let progressMessage: string
          if (timeFilterEnabled) {
            progressMessage = `시간 기준 크롤링 - 페이지 ${pageNum}, 게시글 ${i + 1}/${posts.length}`
          } else {
            progressMessage = `[${currentProgress}/${totalEstimated}] 페이지 ${pageNum} - 게시글 ${i + 1}/${posts.length}`
          }
          
          spinner.text = progressMessage
          
          try {
            const detail = await this.getPostDetail(posts[i])
            
            // 시간 기준 필터링 (상세페이지 시간 기준)
            if (timeFilterEnabled && cutoffTime && detail.postDate) {
              if (detail.postDate < cutoffTime) {
                oldPostsInRowCount++
                console.log(chalk.gray(`⏰ 시간 범위 초과: ${posts[i].title} (${detail.postDate})`))
                
                // 연속으로 5개 이상의 오래된 게시물을 만나면 크롤링 중단
                if (oldPostsInRowCount >= 5) {
                  console.log(chalk.yellow(`연속 ${oldPostsInRowCount}개 오래된 게시물 발견, 크롤링 중단`))
                  shouldStopCrawling = true
                  break
                }
                continue
              } else {
                oldPostsInRowCount = 0 // 최신 게시물을 만나면 카운터 리셋
                console.log(chalk.green(`✓ 시간 범위 내: ${posts[i].title} (${detail.postDate})`))
              }
            }
            
            const hotdeal = this.convertToHotDeal(posts[i], detail)
            
            // 콘텐츠가 비어있는 경우 경고
            if (!hotdeal.description || hotdeal.description.length < 10) {
              console.warn(chalk.yellow(`⚠️  콘텐츠가 비어있거나 너무 짧음: ${posts[i].title}`))
              console.warn(chalk.gray(`   URL: ${posts[i].url}`))
              console.warn(chalk.gray(`   콘텐츠 길이: ${hotdeal.description?.length || 0}자`))
            }
            
            this.results.push(hotdeal)
            totalProcessed++
            
            // 정확한 진행도 콜백 호출
            if (timeFilterEnabled) {
              // 시간 기준: 동적으로 총 예상 개수 계산
              const remainingPages = this.options.maxPages - pageNum
              const currentPageProcessed = i + 1
              const currentPageTotal = posts.length
              const estimatedTotal = totalProcessed + (remainingPages * 20) + (currentPageTotal - currentPageProcessed)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] 시간 기준: ${posts[i].title}`)
            } else {
              // 페이지 기준: 실제 처리된 게시물 수로 총 추정값 조정
              const currentPageRemaining = posts.length - (i + 1)
              const remainingPages = this.options.maxPages - pageNum
              const estimatedTotal = totalProcessed + currentPageRemaining + (remainingPages * 20)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] ${posts[i].title}`)
            }
            
          } catch (error) {
            console.error(chalk.yellow(`상세 정보 수집 실패: ${posts[i].url}`))
            const hotdeal = this.convertToHotDeal(posts[i])
            this.results.push(hotdeal)
            totalProcessed++
            oldPostsInRowCount = 0 // 에러 시에도 카운터 리셋
            
            // 정확한 진행도 콜백 호출 (에러 시에도)
            if (timeFilterEnabled) {
              // 시간 기준: 동적으로 총 예상 개수 계산
              const remainingPages = this.options.maxPages - pageNum
              const currentPageProcessed = i + 1
              const currentPageTotal = posts.length
              const estimatedTotal = totalProcessed + (remainingPages * 20) + (currentPageTotal - currentPageProcessed)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] 오류: ${posts[i].title}`)
            } else {
              // 페이지 기준: 실제 처리된 게시물 수로 총 추정값 조정
              const currentPageRemaining = posts.length - (i + 1)
              const remainingPages = this.options.maxPages - pageNum
              const estimatedTotal = totalProcessed + currentPageRemaining + (remainingPages * 20)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] 오류: ${posts[i].title}`)
            }
          }
          
          // 각 상세 페이지 사이에 추가 딜레이
          if (i < posts.length - 1) {
            await this.delay(500)
          }
        }
        
        // No remaining posts since we process all of them now
        
        if (pageNum < this.options.maxPages && !shouldStopCrawling) {
          await this.delay()
        }
      }
      
      const completionMessage = timeFilterEnabled && cutoffTime
        ? `뽐뿌 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내)`
        : `뽐뿌 크롤링 완료: ${this.results.length}개 딜 수집`
      
      // 최종 진행도 100% 완료 설정
      this.options.onProgress?.(totalProcessed, totalProcessed, completionMessage)
      
      spinner.succeed(chalk.green(completionMessage))
      
      // Supabase에 직접 저장
      const saveStartTime = Date.now()
      const saveResult = await this.saveToSupabase(this.results)
      const saveDuration = Date.now() - saveStartTime
      
      const stats = this.generateStatistics()
      this.printStatistics(stats, timeFilterEnabled ? timeFilterHours : undefined)
      
      console.log(chalk.cyan('\n💾 Supabase 저장 결과:'))
      console.log(chalk.gray(`- 신규 추가: ${saveResult.newDeals}개`))
      console.log(chalk.gray(`- 업데이트: ${saveResult.updatedDeals}개`))
      console.log(chalk.gray(`- 오류: ${saveResult.errors}개`))
      console.log(chalk.gray(`- 저장 시간: ${saveDuration}ms`))
      
      return {
        totalCrawled: this.results.length,
        newDeals: saveResult.newDeals,
        updatedDeals: saveResult.updatedDeals,
        errors: saveResult.errors,
        duration: saveDuration,
        hotdeals: this.results
      }
      
    } catch (error) {
      spinner.fail(chalk.red('뽐뿌 크롤링 실패'))
      throw error
    } finally {
      await this.cleanup()
    }
  }

  private async crawlPage(pageNum: number): Promise<PpomppuPost[]> {
    if (!this.page) throw new Error('Page not initialized')
    
    const url = `${this.baseUrl}&page=${pageNum}`
    
    // 더 관대한 네트워킹 설정으로 접속 시도
    try {
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
    } catch (error) {
      // 첫 번째 시도가 실패하면 더 짧은 타임아웃으로 재시도
      console.log(`페이지 ${pageNum} 첫 번째 시도 실패, 재시도 중...`)
      await this.page.goto(url, { 
        waitUntil: 'load',
        timeout: 20000
      })
    }
    
    // 페이지 로딩 완료까지 잠시 대기
    await this.delay(1000)
    
    // 썸네일 이미지 수집 (호버 이미지 대신)
    console.log(`페이지 ${pageNum} - 썸네일 이미지 수집 중...`)
    const hoverImageMap: Record<string, string> = {} // 빈 맵으로 유지 (기존 코드 호환성)
    
    const posts = await this.page.evaluate(({ selectors, hoverImageMap }) => {
      const rows = document.querySelectorAll(selectors.postRow)
      const results: any[] = []
      
      rows.forEach(row => {
        const postNumEl = row.querySelector(selectors.postNumber)
        if (!postNumEl || !postNumEl.textContent?.trim()) return
        
        const postNumber = postNumEl.textContent.trim()
        
        // Find title link
        const titleLinks = row.querySelectorAll(selectors.titleLink)
        let titleLink: Element | null = null
        let title = ''
        
        titleLinks.forEach(link => {
          const text = link.textContent?.trim() || ''
          if (text.length > 5 && !text.toLowerCase().includes('ppomppu')) {
            titleLink = link
            title = text
          }
        })
        
        if (!titleLink || !title) return
        
        // Extract category
        const categoryEl = row.querySelector(selectors.category)
        let category = categoryEl?.textContent?.trim()
        if (!category) {
          const categoryMatch = title.match(/\[(.*?)\]/)
          category = categoryMatch ? `[${categoryMatch[1]}]` : undefined
        }
        
        // Check if popular
        const hotTag = row.querySelector(selectors.hotTag)
        const isPopular = !!hotTag
        
        // Check if hot (HOT 라벨 체크)
        const hotLabelTag = row.querySelector(selectors.hotLabelTag)
        const isHot = !!hotLabelTag
        
        // Extract recommend count
        const recommendCountEl = row.querySelector(selectors.recommendCount)
        let recommendCount = 0
        if (recommendCountEl) {
          const recommendText = recommendCountEl.textContent?.trim() || ''
          // Extract first number before "-" (format: "5 - 1")
          const recommendMatch = recommendText.split('-')[0]?.trim()
          if (recommendMatch) {
            recommendCount = parseInt(recommendMatch.replace(/[^\d]/g, '')) || 0
          }
        }
        
        // Extract views from last column (fallback)
        const statsText = row.querySelector('td:last-child')?.textContent || ''
        const [viewsStr] = statsText.split(' - ')
        const views = parseInt(viewsStr?.replace(/[^\d]/g, '') || '0')
        
        // Extract thumbnail and hover image
        const thumbnail = row.querySelector('img[src*="_thumb"]')
        const thumbnailUrl = thumbnail ? (thumbnail as HTMLImageElement).src : undefined
        
        // 썸네일 이미지만 수집 (호버 이미지는 상세페이지에서 매칭)
        
        // Extract author - 3번째 td에서 a > span 찾기
        const authorCell = row.querySelector('td:nth-child(3)')
        const authorEl = authorCell?.querySelector('nobr > a > span')
        const author = authorEl?.textContent?.trim() || ''
        
        // Extract date - 4번째 td
        const dateCell = row.querySelector('td:nth-child(4)')
        const dateStr = dateCell?.textContent?.trim() || ''
        
        // Construct URL
        const href = (titleLink as HTMLAnchorElement).href
        
        results.push({
          postNumber,
          title,
          url: href,
          author,
          category,
          isPopular,
          isHot,
          thumbnailUrl,
          views,
          recommendCount,
          dateStr
        })
      })
      
      return results
    }, { selectors: this.selectors, hoverImageMap })
    
    // Parse dates outside evaluate
    return posts.map(post => ({
      ...post,
      postDate: this.parseDate(post.dateStr)
    }))
  }

  private async getPostDetail(post: PpomppuPost): Promise<{ content: string; images: string[]; matchedImage?: string; postDate?: Date }> {
    if (!this.page) throw new Error('Page not initialized')
    
    // 상세 페이지 접근 - 더 빠르고 안정적인 로딩 전략
    try {
      await this.page.goto(post.url, { 
        waitUntil: 'domcontentloaded',  // DOM 로딩만 기다림 (더 빠름)
        timeout: 15000  // 타임아웃 단축
      })
    } catch (error) {
      console.log(`상세 페이지 접근 실패, 건너뛰기: ${post.url}`)
      return { content: '', images: [] }
    }
    
    // 실제 콘텐츠 영역이 로드될 때까지 대기
    try {
      await this.page.waitForSelector('.board-contents, body > div.wrapper > div.contents > div.container', {
        timeout: 8000
      })
    } catch (e) {
      console.log(`콘텐츠 영역 로딩 실패: ${post.url}`)
      // 그래도 시도해보기 위해 계속 진행
    }
    
    // 콘텐츠 로딩을 위한 추가 대기 (단축)
    await this.delay(1500)
    
    const detail = await this.page.evaluate(({ selectors }) => {
      // 상세페이지의 정확한 시간 정보 추출
      let postDateStr = ''
      try {
        const dateElement = document.querySelector("#topTitle > div > ul > li:nth-child(2)")
        if (dateElement) {
          postDateStr = dateElement.textContent?.trim() || ''
          console.log(`상세페이지 시간 정보: ${postDateStr}`)
        }
      } catch (e) {
        console.log('시간 정보 추출 실패')
      }
      
      // 실제 분석 결과를 바탕으로 한 정확한 셀렉터 순서
      const prioritySelectors = [
        '.board-contents',  // 가장 정확한 셀렉터 (분석 결과)
        'body > div.wrapper > div.contents > div.container > div > table:nth-child(14) > tbody > tr:nth-child(1) > td > table > tbody > tr > td', // 두 번째 정확한 셀렉터
        ...selectors.contentAreas  // 기존 셀렉터들 (fallback)
      ]
      
      let contentEl: Element | null = null
      let content = ''
      let foundSelector = ''
      
      // 우선순위에 따라 셀렉터 시도
      for (const selector of prioritySelectors) {
        try {
          contentEl = document.querySelector(selector)
          if (contentEl) {
            const text = contentEl.textContent?.trim() || ''
            // 실제 콘텐츠인지 확인 (최소 20자 이상, UI 요소 제외)
            if (text.length > 20 && 
                !text.includes('로그인') && 
                !text.includes('회원가입') &&
                !text.includes('검색') &&
                !text.includes('카테고리') &&
                !text.includes('출석체크') &&
                !text.includes('googletag') &&
                !text.includes('광고') &&
                !text.includes('banner')) {
              foundSelector = selector
              console.log(`콘텐츠 발견: ${selector} (${text.length}자)`)
              break
            }
          }
        } catch (e) {
          // 셀렉터 오류 시 다음 셀렉터로 계속
          continue
        }
      }
      
      // 아직 찾지 못했다면 더 넓게 검색
      if (!contentEl || !foundSelector) {
        console.log('기본 셀렉터로 콘텐츠를 찾지 못함, 넓은 검색 시도')
        const possibleContents = document.querySelectorAll('td, div[class*="content"], div[class*="board"], p')
        
        for (const el of possibleContents) {
          const text = el.textContent?.trim() || ''
          // 충분한 길이의 실제 콘텐츠인지 확인
          if (text.length > 50 && 
              !text.includes('로그인') && 
              !text.includes('회원가입') &&
              !text.includes('검색') &&
              !text.includes('카테고리') &&
              !text.includes('출석체크') &&
              !text.includes('googletag') &&
              !text.includes('script') &&
              !text.includes('배너') &&
              !text.includes('광고')) {
            contentEl = el
            foundSelector = 'fallback-search'
            console.log(`fallback으로 콘텐츠 발견: ${text.length}자`)
            break
          }
        }
      }
      
      // 콘텐츠 추출 - 간단하고 효율적인 방법
      if (contentEl) {
        // 먼저 textContent로 간단히 추출
        content = contentEl.textContent?.trim() || ''
        
        // 너무 짧다면 innerHTML에서 텍스트만 추출
        if (content.length < 20) {
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = contentEl.innerHTML
          // Remove script, style, and other non-content elements
          tempDiv.querySelectorAll('script, style, noscript, iframe, object, embed').forEach(el => el.remove())
          content = tempDiv.textContent?.trim() || ''
        }
        
        // 텍스트 정리
        content = content
          .replace(/\s+/g, ' ')  // 여러 공백을 하나로
          .replace(/\n\s*\n/g, '\n')  // 여러 줄바꿈을 하나로
          .trim()
        
        console.log(`최종 콘텐츠 길이: ${content.length}자`)
      }
      
      // 여전히 콘텐츠가 없다면 마지막 시도
      if (!content || content.length < 20) {
        console.log('마지막 fallback 시도')
        // 페이지에서 가장 긴 텍스트 블록 찾기
        const allElements = document.querySelectorAll('*')
        let longestContent = ''
        
        for (const el of allElements) {
          const text = el.textContent?.trim() || ''
          if (text.length > longestContent.length && 
              text.length > 50 &&
              !text.includes('로그인') && 
              !text.includes('회원가입') &&
              !text.includes('googletag') &&
              !text.includes('script') &&
              el.children.length < 10) { // 자식 요소가 적은 것 (실제 콘텐츠일 가능성)
            longestContent = text
          }
        }
        
        if (longestContent.length > content.length) {
          content = longestContent
          console.log(`fallback으로 더 긴 콘텐츠 발견: ${content.length}자`)
        }
      }
      
      // Extract images - 콘텐츠 영역 내의 이미지만 수집
      const images: string[] = []
      
      if (contentEl) {
        const imageEls = contentEl.querySelectorAll('img')
        imageEls.forEach(img => {
          const src = (img as HTMLImageElement).src
          if (src && src.startsWith('http')) {
            const isValidFormat = /\.(jpg|jpeg|png|webp|gif)/i.test(src)
            const isIcon = /icon|emoticon|menu|logo|share|smilie|thumb/i.test(src)
            
            if (isValidFormat && !isIcon) {
              images.push(src)
            }
          }
        })
      }
      
      console.log(`수집된 이미지: ${images.length}개`)
      
      return { content, images, postDateStr }
    }, { selectors: this.selectors })
    
    // 썸네일과 매칭되는 고해상도 이미지 찾기
    let matchedImage: string | undefined = undefined
    
    if (post.thumbnailUrl && detail.images.length > 0) {
      matchedImage = this.findMatchingImage(post.thumbnailUrl, detail.images)
    }
    
    // 상세페이지 시간 정보 파싱
    let detailPostDate: Date | undefined = undefined
    if (detail.postDateStr) {
      detailPostDate = this.parseDetailPageDate(detail.postDateStr)
      console.log(`파싱된 상세페이지 시간: ${detailPostDate}`)
    }
    
    return {
      ...detail,
      matchedImage,
      postDate: detailPostDate
    }
  }

  private parseDetailPageDate(dateStr: string): Date {
    const now = new Date()
    
    // 다양한 날짜 형식 처리
    console.log(`상세페이지 날짜 파싱 시도: "${dateStr}"`)
    
    // "2025-07-12 16:56:24" 또는 "2025/07/12 16:56:24" 형식
    const fullDateMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (fullDateMatch) {
      const [, year, month, day, hours, minutes, seconds = '0'] = fullDateMatch
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))
      console.log(`전체 날짜 형식으로 파싱: ${date}`)
      return date
    }
    
    // "25/07/12 16:56" 또는 "25-07-12 16:56" 형식 (2자리 년도)
    const shortYearMatch = dateStr.match(/(\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (shortYearMatch) {
      const [, yearShort, month, day, hours, minutes, seconds = '0'] = shortYearMatch
      const year = 2000 + parseInt(yearShort)
      const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))
      console.log(`짧은 년도 형식으로 파싱: ${date}`)
      return date
    }
    
    // "07-12 16:56" 형식 (월-일만 있는 경우, 현재 년도 사용)
    const monthDayMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (monthDayMatch) {
      const [, month, day, hours, minutes, seconds = '0'] = monthDayMatch
      const date = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))
      console.log(`월-일 형식으로 파싱: ${date}`)
      return date
    }
    
    // "16:56:24" 형식 (시간만 있는 경우, 오늘 날짜 사용)
    const timeOnlyMatch = dateStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (timeOnlyMatch) {
      const [, hours, minutes, seconds = '0'] = timeOnlyMatch
      const date = new Date(now)
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0)
      console.log(`시간만 파싱: ${date}`)
      return date
    }
    
    // 파싱 실패 시 현재 시간 반환
    console.log(`날짜 파싱 실패, 현재 시간 사용: ${now}`)
    return now
  }

  private findMatchingImage(thumbnailUrl: string, detailImages: string[]): string | undefined {
    if (!detailImages.length) return undefined
    
    console.log(`썸네일 매칭 시도: ${thumbnailUrl}`)
    console.log(`상세페이지 이미지 ${detailImages.length}개 중에서 매칭 검색`)
    
    // 썸네일 URL에서 게시물 번호 추출 (예: small_635827.jpg → 635827)
    const thumbnailNumberMatch = thumbnailUrl.match(/small_(\d+)\.jpg/)
    const postNumber = thumbnailNumberMatch ? thumbnailNumberMatch[1] : null
    
    if (postNumber) {
      console.log(`게시물 번호: ${postNumber}`)
      
      // 1. 게시물 번호와 매칭되는 이미지 찾기
      for (const img of detailImages) {
        if (img.includes(postNumber)) {
          console.log(`✓ 번호 매칭 이미지 발견: ${img}`)
          return img
        }
      }
    }
    
    // 2. 썸네일과 유사한 시간대의 이미지 찾기 (날짜 기반)
    const dateMatch = thumbnailUrl.match(/t=(\d{8})/)
    if (dateMatch) {
      const date = dateMatch[1]
      const targetDate = `${date.substring(0,4)}/${date.substring(4,6)}/${date.substring(6,8)}`
      
      for (const img of detailImages) {
        if (img.includes(targetDate.replace(/\//g, ''))) {
          console.log(`✓ 날짜 매칭 이미지 발견: ${img}`)
          return img
        }
      }
    }
    
    // 3. 가장 적합해 보이는 이미지 찾기 (크기가 클 것으로 예상되는 이미지)
    const preferredImages = detailImages.filter(img => {
      // data3, data4, data5 경로의 이미지 우선 (호버 이미지 경로)
      return img.includes('/data3/') || img.includes('/data4/') || img.includes('/data5/')
    })
    
    if (preferredImages.length > 0) {
      console.log(`✓ 우선순위 이미지 발견: ${preferredImages[0]}`)
      return preferredImages[0]
    }
    
    // 4. 첫 번째 이미지 사용 (fallback)
    if (detailImages.length > 0) {
      console.log(`✓ Fallback 이미지 사용: ${detailImages[0]}`)
      return detailImages[0]
    }
    
    console.log(`✗ 매칭 이미지를 찾을 수 없음`)
    return undefined
  }

  private convertToHotDeal(post: PpomppuPost, detail?: { content: string; images: string[]; matchedImage?: string }): HotDeal {
    const priceNum = this.parsePrice(post.title)
    const storeName = this.parseStore(post.title)
    const category = post.category || this.inferCategory(post.title)
    const isFreeShipping = this.isFreeShipping(post.title)
    
    // 이미지 우선순위: 매칭된 이미지 > 썸네일 이미지 > null
    const finalImageUrl = detail?.matchedImage || post.thumbnailUrl || null
    
    // URL 정규화 (//로 시작하는 경우 https: 추가)
    const normalizedImageUrl = finalImageUrl && finalImageUrl.startsWith('//') 
      ? `https:${finalImageUrl}` 
      : finalImageUrl
    
    console.log(`최종 이미지 URL: ${normalizedImageUrl}`)
    
    return {
      id: this.generateId('ppomppu', post.postNumber),
      title: post.title,
      sale_price: priceNum,  // 문자열 또는 null
      seller: storeName || '알 수 없음',
      category,
      // 매칭된 고해상도 이미지 또는 썸네일 사용
      original_url: post.url, // 실제 상품 페이지 URL
      image_url: normalizedImageUrl || '',
      thumbnail_url: post.thumbnailUrl ? (post.thumbnailUrl.startsWith('//') ? `https:${post.thumbnailUrl}` : post.thumbnailUrl) : '',
      source: 'ppomppu' as any,
      source_id: post.postNumber, // 뽐뿌 게시글 번호를 중복 체크용 ID로 사용
      created_at: post.postDate.toISOString(),
      author_name: post.author,
      comment_count: 0, // 커뮤니티 댓글수는 수집하지 않음
      like_count: post.recommendCount || 0,
      description: detail?.content || '',
      status: 'active' as const,
      views: post.views || 0,
      // 스키마에 필요한 추가 필드들
      original_price: priceNum > 0 ? priceNum : 0,
      discount_rate: 0,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      shopping_comment: '',
      is_free_shipping: isFreeShipping,
      updated_at: new Date().toISOString(),
      deleted_at: null
      // createdAt and updatedAt not part of HotDeal interface
    }
  }

  private printStatistics(stats: any, timeFilterHours?: number): void {
    console.log(chalk.cyan('\n📊 통계:'))
    if (timeFilterHours) {
      console.log(chalk.gray(`- 시간 필터: 최근 ${timeFilterHours}시간 내 게시물만`))
    }
    console.log(chalk.gray(`- 총 딜 수: ${stats.totalDeals}개`))
    console.log(chalk.gray(`- 무료배송: ${stats.freeShippingCount}개`))
    console.log(chalk.gray(`- 인기 게시글: ${stats.popularCount}개`))
    console.log(chalk.gray(`- 이미지 있음: ${stats.imagesCount}개`))
    console.log(chalk.gray(`- 본문 텍스트 있음: ${stats.contentCount}개`))
    console.log(chalk.gray(`- 카테고리: ${Object.keys(stats.categoryCounts).length}개`))
    console.log(chalk.gray(`- 쇼핑몰: ${Object.keys(stats.storeCounts).length}개`))
  }

  protected getSourceName(): string {
    return 'ppomppu'
  }

  private async saveToSupabase(hotdeals: HotDeal[]): Promise<{
    newDeals: number
    updatedDeals: number
    errors: number
  }> {
    let newDeals = 0
    let updatedDeals = 0
    let errors = 0

    for (const hotdeal of hotdeals) {
      try {
        // 중복 체크 (source + source_id로 unique 체크)
        const existing = await this.supabaseRepository.findBySourceAndPostId(
          hotdeal.source,
          hotdeal.source_id
        )
        
        if (existing) {
          // 기존 핫딜 업데이트
          await this.supabaseRepository.update(existing.id, hotdeal)
          updatedDeals++
          console.log(chalk.gray(`✓ 업데이트: ${hotdeal.title}`))
        } else {
          // 새로운 핫딜 추가
          await this.supabaseRepository.create(hotdeal)
          newDeals++
          console.log(chalk.green(`✓ 신규 추가: ${hotdeal.title}`))
        }
      } catch (error) {
        errors++
        console.error(chalk.red(`✗ 저장 실패: ${hotdeal.title}`), error)
      }
    }

    return { newDeals, updatedDeals, errors }
  }

  // DEPRECATED: 부정확한 사전 계산으로 인해 제거됨
  /*
  private async calculateTotalPosts(timeFilterEnabled: boolean, cutoffTime: Date | null): Promise<number> {
    if (!this.page) throw new Error('Page not initialized')
    
    let totalCount = 0
    let shouldStop = false
    
    if (timeFilterEnabled && cutoffTime) {
      console.log(chalk.gray('시간 기준 크롤링: 빠른 스캔으로 대상 게시물 수 파악 중...'))
      
      // 시간 기준: 각 페이지를 빠르게 스캔해서 시간 범위 내 게시물 수 계산
      for (let pageNum = 1; pageNum <= this.options.maxPages && !shouldStop; pageNum++) {
        try {
          const posts = await this.fastScanPage(pageNum)
          let validPostsInPage = 0
          let oldPostsInRowCount = 0
          
          // 빠른 시간 체크 (목록페이지 시간 기준으로 대략 판단)
          for (const post of posts) {
            // 상세페이지 접근 없이 목록페이지 시간으로 대략 판단
            if (post.postDate && post.postDate >= cutoffTime) {
              validPostsInPage++
              oldPostsInRowCount = 0
            } else {
              oldPostsInRowCount++
              // 연속으로 10개 이상 오래된 게시물이면 이 페이지에서 중단
              if (oldPostsInRowCount >= 10) {
                break
              }
            }
          }
          
          totalCount += validPostsInPage
          console.log(chalk.gray(`페이지 ${pageNum}: ${validPostsInPage}개 게시물 (예상)`))
          
          // 페이지 전체가 오래된 게시물이면 중단
          if (validPostsInPage === 0 && oldPostsInRowCount >= 5) {
            console.log(chalk.gray(`페이지 ${pageNum}: 시간 범위 초과로 스캔 중단`))
            shouldStop = true
          }
          
          await this.delay(200) // 빠른 스캔을 위한 짧은 딜레이
        } catch (error) {
          console.warn(chalk.yellow(`페이지 ${pageNum} 스캔 실패, 건너뛰기`))
        }
      }
    } else {
      console.log(chalk.gray('페이지 기준 크롤링: 지정된 페이지의 모든 게시물 수 계산 중...'))
      
      // 페이지 기준: 지정된 페이지 수의 모든 게시물 수 계산
      for (let pageNum = 1; pageNum <= this.options.maxPages; pageNum++) {
        try {
          const posts = await this.fastScanPage(pageNum)
          totalCount += posts.length
          console.log(chalk.gray(`페이지 ${pageNum}: ${posts.length}개 게시물`))
          
          await this.delay(200) // 빠른 스캔을 위한 짧은 딜레이
        } catch (error) {
          console.warn(chalk.yellow(`페이지 ${pageNum} 스캔 실패, 건너뛰기`))
        }
      }
    }
    
    return totalCount
  }

  private async fastScanPage(pageNum: number): Promise<PpomppuPost[]> {
    if (!this.page) throw new Error('Page not initialized')
    
    const url = `${this.baseUrl}&page=${pageNum}`
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded', // DOM만 로딩 (빠른 스캔)
        timeout: 10000 // 더 짧은 타임아웃
      })
      
      // 빠른 스캔을 위한 최소한의 대기
      await this.delay(500)
      
      // 게시물 목록만 빠르게 추출 (상세 정보 없이)
      const posts = await this.page.evaluate(({ selectors }) => {
        const rows = document.querySelectorAll(selectors.postRow)
        const results: any[] = []
        
        rows.forEach(row => {
          const postNumEl = row.querySelector(selectors.postNumber)
          if (!postNumEl || !postNumEl.textContent?.trim()) return
          
          const postNumber = postNumEl.textContent.trim()
          
          // Find title link
          const titleLinks = row.querySelectorAll(selectors.titleLink)
          let titleLink: Element | null = null
          let title = ''
          
          titleLinks.forEach(link => {
            const text = link.textContent?.trim() || ''
            if (text.length > 5 && !text.toLowerCase().includes('ppomppu')) {
              titleLink = link
              title = text
            }
          })
          
          if (!titleLink || !title) return
          
          // Extract date - 4번째 td
          const dateCell = row.querySelector('td:nth-child(4)')
          const dateStr = dateCell?.textContent?.trim() || ''
          
          results.push({
            postNumber,
            title,
            dateStr
          })
        })
        
        return results
      }, { selectors: this.selectors })
      
      // Parse dates outside evaluate
      return posts.map(post => ({
        ...post,
        postDate: this.parseDate(post.dateStr),
        url: '',
        author: '',
        isPopular: false,
        views: 0,
        recommendCount: 0
      }))
      
    } catch (error) {
      console.warn(`빠른 스캔 실패: 페이지 ${pageNum}`)
      return []
    }
  }
  */
}