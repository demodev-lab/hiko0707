import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface CoolenjoyPost {
  postNumber: string
  title: string
  url: string
  author: string
  category?: string
  views: number
  likeCount: number
  commentCount: number
  postDate: Date
  isSoldOut: boolean
  priceInfo?: string
  thumbnailUrl?: string
  isPopular?: boolean
}

export class CoolenjoyCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://coolenjoy.net/bbs/jirum'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    // 메인 선택자 (실제 HTML 구조 기반)
    postItem: 'li.d-md-table-row',
    titleLink: 'a.na-subject',
    author: 'a.sv_member', 
    category: 'div#abcd',
    likeCount: 'span.rank-icon_vote',
    commentCount: 'span.count-plus',
    price: 'font[color="#f89e00"]',
    
    // 폴백 선택자
    altPostItem: 'li[class*="d-md-table-row"]',
    altTitleLink: 'a[href*="/jirum/"]',
    altAuthor: '.sv_member',
    altCategory: '[id="abcd"]',
    
    // 구조적 선택자 (조회수, 날짜용)
    viewsContainer: '.d-md-table-cell',
    dateContainer: '.d-md-table-cell',
    
    // 추가 폴백 선택자 (기존 패턴 유지)
    genericPostItem: 'tr[class*="list"], div.list-row, li.list-body-item',
    genericTitleLink: 'a[href*="/jirum/"], .subject a, .title a',
    genericAuthor: '.member, .nickname, .author, .writer',
    genericViewCount: '.hit, .view-count, .views',
    genericTimestamp: '.date, .datetime, time'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('쿨엔조이 크롤링 시작...').start()
    const startTime = Date.now()
    let totalProcessed = 0
    let newDeals = 0
    let updatedDeals = 0
    let errors = 0

    try {
      await this.init()
      
      // 시간 기준 필터링을 위한 설정
      const timeFilterHours = this.options.timeFilterHours
      const timeFilterEnabled = timeFilterHours && timeFilterHours > 0
      const cutoffTime = timeFilterEnabled ? new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000)) : null
      
      // 동적 진행도 관리
      let shouldStopCrawling = false
      let oldPostsInRowCount = 0
      let totalEstimated = timeFilterEnabled ? 0 : this.options.maxPages * 20 // 페이지 기준일 경우 추정값
      
      console.log(chalk.cyan(`🔍 쿨엔조이 크롤링 시작 (최대 ${this.options.maxPages}페이지)`))
      if (timeFilterEnabled) {
        console.log(chalk.yellow(`⏰ 시간 필터링: 최근 ${timeFilterHours}시간 이내 게시물만 수집`))
        this.options.onProgress?.(0, 100, `시간 기준 크롤링 시작 (${timeFilterHours}시간 내)`)
      } else {
        this.options.onProgress?.(0, totalEstimated, `페이지 기준 크롤링 시작 (${this.options.maxPages}페이지)`)
      }

      for (let pageNum = 1; pageNum <= this.options.maxPages && !shouldStopCrawling; pageNum++) {
        spinner.text = `쿨엔조이 ${pageNum}/${this.options.maxPages} 페이지 크롤링 중...`
        
        const posts = await this.crawlPage(pageNum)
        if (posts.length === 0) {
          console.log(chalk.yellow(`쿨엔조이 ${pageNum}페이지: 게시물 없음`))
          break
        }

        console.log(chalk.gray(`쿨엔조이 ${pageNum}페이지: ${posts.length}개 게시물 발견`))

        for (let i = 0; i < posts.length; i++) {
          const currentPost = posts[i]
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
            // 필수 데이터 검증
            if (!currentPost.title || !currentPost.postNumber || !currentPost.url) {
              console.log(chalk.yellow(`⚠️  필수 데이터 누락, 건너뜀: ${currentPost.title || 'No Title'}`))
              continue
            }
            
            // 시간 기준 필터링
            if (timeFilterEnabled && cutoffTime && currentPost.postDate) {
              if (currentPost.postDate < cutoffTime) {
                oldPostsInRowCount++
                console.log(chalk.gray(`⏰ 시간 범위 초과: ${currentPost.title} (${currentPost.postDate.toLocaleString('ko-KR')})`))
                
                if (oldPostsInRowCount >= 5) {
                  console.log(chalk.yellow(`연속 ${oldPostsInRowCount}개 오래된 게시물 발견, 크롤링 중단`))
                  shouldStopCrawling = true
                  break
                }
                continue
              } else {
                oldPostsInRowCount = 0
                console.log(chalk.green(`✓ 시간 범위 내: ${currentPost.title} (${currentPost.postDate.toLocaleString('ko-KR')})`))
              }
            }

            // 상세페이지 정보 수집 (뽐뿌 크롤러 패턴 적용)
            const detail = await this.getPostDetail(currentPost)
            
            // HotDeal 객체 변환 (상세 정보 포함)
            const hotdeal = this.convertToHotDeal(currentPost, detail)
            
            // 변환된 데이터 검증
            if (!hotdeal.title || !hotdeal.source_id) {
              console.log(chalk.yellow(`⚠️  변환 실패, 건너뜀: ${currentPost.title}`))
              continue
            }
            
            // 콘텐츠가 비어있는 경우 경고 (뽐뿌 크롤러 패턴)
            if (!hotdeal.description || hotdeal.description.length < 10) {
              console.warn(chalk.yellow(`⚠️  콘텐츠가 비어있거나 너무 짧음: ${currentPost.title}`))
              console.warn(chalk.gray(`   URL: ${currentPost.url}`))
              console.warn(chalk.gray(`   콘텐츠 길이: ${hotdeal.description?.length || 0}자`))
            }
            
            // Supabase에 저장 시도
            try {
              const existing = await this.supabaseRepository.findBySourceAndPostId('coolenjoy', hotdeal.source_id)
              
              if (!existing) {
                const saved = await this.supabaseRepository.create(hotdeal)
                if (saved) {
                  newDeals++
                  console.log(chalk.green(`✅ 신규 저장: ${hotdeal.title}`))
                } else {
                  console.log(chalk.red(`❌ 저장 실패: ${hotdeal.title}`))
                  errors++
                }
              } else {
                // 기존 데이터 업데이트 (필요시)
                updatedDeals++
                console.log(chalk.blue(`♻️  기존 항목: ${hotdeal.title}`))
              }
            } catch (dbError) {
              console.error(chalk.red(`❌ DB 오류: ${hotdeal.title}`), dbError)
              errors++
            }
            
            this.results.push(hotdeal)
            totalProcessed++
            
            // 진행도 콜백
            const estimatedTotal = totalProcessed + (posts.length - i - 1) + ((this.options.maxPages - pageNum) * 30)
            this.options.onProgress?.(totalProcessed, estimatedTotal, `쿨엔조이: ${currentPost.title}`)
            
          } catch (error) {
            console.error(chalk.red(`❌ 처리 실패: ${currentPost?.title || 'Unknown'}`), error)
            errors++
            oldPostsInRowCount = 0
          }
          
          // 각 상세 페이지 사이에 추가 딜레이 (뽐뿌 크롤러 패턴)
          if (i < posts.length - 1) {
            await this.delay(500)
          }
        }
        
        if (pageNum < this.options.maxPages && !shouldStopCrawling) {
          await this.delay()
        }
      }
      
      const completionMessage = timeFilterEnabled
        ? `쿨엔조이 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내) - 신규: ${newDeals}, 기존: ${updatedDeals}, 오류: ${errors}`
        : `쿨엔조이 크롤링 완료: ${this.results.length}개 딜 수집 - 신규: ${newDeals}, 기존: ${updatedDeals}, 오류: ${errors}`
      
      this.options.onProgress?.(totalProcessed, totalProcessed, completionMessage)
      spinner.succeed(chalk.green(completionMessage))
      
      // 뽐뿌 크롤러 스타일의 상세 통계 출력
      const stats = this.generateCoolenjoyStatistics()
      this.printCoolenjoyStatistics(stats, timeFilterEnabled ? timeFilterHours : undefined)
      
      console.log(chalk.cyan('\n💾 Supabase 저장 결과:'))
      console.log(chalk.gray(`- 신규 추가: ${newDeals}개`))
      console.log(chalk.gray(`- 업데이트: ${updatedDeals}개`))
      console.log(chalk.gray(`- 오류: ${errors}개`))
      console.log(chalk.gray(`- 저장 시간: ${((Date.now() - startTime) / 1000).toFixed(1)}초`))
      
    } catch (error) {
      spinner.fail(chalk.red('쿨엔조이 크롤링 실패'))
      console.error(error)
      throw error
    } finally {
      await this.cleanup()
    }

    return {
      totalCrawled: totalProcessed,
      newDeals,
      updatedDeals,
      errors,
      duration: Date.now() - startTime,
      hotdeals: this.results
    }
  }

  private async crawlPage(pageNum: number): Promise<CoolenjoyPost[]> {
    const url = pageNum === 1 
      ? this.baseUrl 
      : `${this.baseUrl}?page=${pageNum}`
    
    // 뽐뿌 크롤러의 안정적인 재시도 로직 적용
    try {
      await this.page!.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
    } catch (error) {
      // 첫 번째 시도가 실패하면 더 짧은 타임아웃으로 재시도
      console.log(`페이지 ${pageNum} 첫 번째 시도 실패, 재시도 중...`)
      await this.page!.goto(url, { 
        waitUntil: 'load',
        timeout: 20000
      })
    }
    
    // 페이지가 완전히 로드될 때까지 잠시 대기
    await this.delay(1000)
    
    // 게시물 목록이 로드될 때까지 대기 - 다중 폴백 시스템
    let selector = ''
    const selectorOptions = [
      this.selectors.postItem,
      this.selectors.altPostItem,
      this.selectors.genericPostItem
    ]
    
    for (const sel of selectorOptions) {
      try {
        await this.page!.waitForSelector(sel, { timeout: 5000 })
        selector = sel
        console.log(chalk.blue(`선택자 매칭 성공: ${sel}`))
        break
      } catch (error) {
        console.log(chalk.yellow(`선택자 시도 실패: ${sel}`))
      }
    }
    
    if (!selector) {
      console.log(chalk.red('모든 선택자 실패, 빈 페이지이거나 구조 변경됨'))
      return []
    }

    const posts = await this.page!.evaluate(({ selectors, finalSelector }) => {
      const items = document.querySelectorAll(finalSelector)
      const postList: any[] = []
      
      console.log(`선택자 ${finalSelector}로 ${items.length}개 항목 발견`)
      
      items.forEach((item, index) => {
        try {
          // Skip notice/header rows
          if (item.classList.contains('notice') || item.classList.contains('list_header')) {
            console.log(`항목 ${index} 건너뜀: 공지사항`)
            return
          }
          
          // 1. 제목 링크 찾기 (다중 폴백)
          let titleLink = item.querySelector(selectors.titleLink)
          if (!titleLink) titleLink = item.querySelector(selectors.altTitleLink)
          if (!titleLink) titleLink = item.querySelector(selectors.genericTitleLink)
          if (!titleLink) titleLink = item.querySelector('a[href*="/jirum/"]')
          
          if (!titleLink) {
            console.log(`항목 ${index} 건너뜀: 제목 링크 없음`)
            return
          }
          
          const title = titleLink.textContent?.trim() || ''
          const url = (titleLink as HTMLAnchorElement).href || ''
          
          if (!title || !url) {
            console.log(`항목 ${index} 건너뜀: 제목 또는 URL 없음`)
            return
          }
          
          // 2. 게시물 번호 추출
          const postMatch = url.match(/\/jirum\/(\d+)/) || url.match(/[?&]wr_id=(\d+)/) || url.match(/\/(\d+)$/)
          const postNumber = postMatch?.[1] || ''
          
          if (!postNumber) {
            console.log(`항목 ${index} 건너뜀: 게시물 번호 추출 실패 - ${url}`)
            return
          }
          
          // 3. 작성자 추출 (다중 폴백)
          let authorEl = item.querySelector(selectors.author)
          if (!authorEl) authorEl = item.querySelector(selectors.altAuthor)
          if (!authorEl) authorEl = item.querySelector(selectors.genericAuthor)
          const author = authorEl?.textContent?.trim() || 'Unknown'
          
          // 4. 카테고리 추출
          let categoryEl = item.querySelector(selectors.category)
          if (!categoryEl) categoryEl = item.querySelector(selectors.altCategory)
          const category = categoryEl?.textContent?.trim()
          
          // 5. 추천수 추출
          const likeEl = item.querySelector(selectors.likeCount)
          let likeCount = 0
          if (likeEl) {
            const likeText = likeEl.textContent?.trim() || '0'
            likeCount = parseInt(likeText.replace(/[^0-9]/g, '')) || 0
          }
          
          // 6. 댓글수 추출 (span.count-plus 내부의 [숫자] 패턴)
          const commentEl = item.querySelector(selectors.commentCount)
          let commentCount = 0
          if (commentEl) {
            const commentText = commentEl.textContent?.trim() || ''
            const commentMatch = commentText.match(/\[(\d+)\]/)
            commentCount = commentMatch ? parseInt(commentMatch[1]) : 0
          }
          
          // 7. 조회수 추출 (구조적 접근 - 5번째 .d-md-table-cell)
          const tableCells = item.querySelectorAll(selectors.viewsContainer)
          let views = 0
          if (tableCells.length >= 5) {
            const viewText = tableCells[4]?.textContent?.trim() || '0'
            views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
          } else {
            // 폴백: 일반적인 조회수 선택자 시도
            const viewEl = item.querySelector(selectors.genericViewCount)
            if (viewEl) {
              const viewText = viewEl.textContent?.trim() || '0'
              views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
            }
          }
          
          // 8. 날짜 추출 (구조적 접근 - 4번째 .d-md-table-cell)
          let dateText = ''
          if (tableCells.length >= 4) {
            dateText = tableCells[3]?.textContent?.trim() || ''
          } else {
            // 폴백: 일반적인 날짜 선택자 시도
            const dateEl = item.querySelector(selectors.genericTimestamp)
            dateText = dateEl?.textContent?.trim() || ''
          }
          
          // 9. 품절 상태 확인
          const isSoldOut = title.includes('[품절]') || 
                           title.includes('[종료]') || 
                           title.includes('[마감]') ||
                           title.includes('[완료]') ||
                           item.classList.contains('sold_out') ||
                           item.querySelector('.sold_out')
          
          // 10. 가격 정보 추출 (title과 price 선택자에서)
          let priceInfo = ''
          const priceEl = item.querySelector(selectors.price)
          if (priceEl) {
            priceInfo = priceEl.textContent?.trim() || ''
          }
          
          console.log(`항목 ${index} 처리 성공: ${title} (게시물번호: ${postNumber})`)
          
          postList.push({
            postNumber,
            title,
            url,
            author,
            category,
            views,
            likeCount,
            commentCount,
            dateText,
            isSoldOut,
            priceInfo
          })
          
        } catch (error) {
          console.error(`항목 ${index} 처리 중 오류:`, error)
        }
      })
      
      console.log(`최종 추출된 게시물: ${postList.length}개`)
      return postList
    }, { selectors: this.selectors, finalSelector: selector })

    // Parse dates outside evaluate
    const postsWithDates = posts.map(post => ({
      ...post,
      postDate: this.parseCoolenjoyDate(post.dateText)
    }))

    return postsWithDates
  }

  private parseCoolenjoyDate(dateText: string): Date {
    const now = new Date()
    
    // Check various date formats
    // Format 1: "01-05" (MM-DD)
    if (dateText.match(/^\d{2}-\d{2}$/)) {
      const [month, day] = dateText.split('-').map(Number)
      const date = new Date(now.getFullYear(), month - 1, day)
      // If date is in the future, it's from last year
      if (date > now) {
        date.setFullYear(date.getFullYear() - 1)
      }
      return date
    }
    
    // Format 2: "2025-01-05" (YYYY-MM-DD)
    if (dateText.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateText)
    }
    
    // Format 3: Time only "15:30"
    if (dateText.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = dateText.split(':').map(Number)
      const date = new Date(now)
      date.setHours(hours, minutes, 0, 0)
      return date
    }
    
    // Format 4: "방금", "1분전", "1시간전" etc
    if (dateText.includes('방금')) {
      return new Date()
    }
    if (dateText.includes('분전') || dateText.includes('분 전')) {
      const minutes = parseInt(dateText.match(/\d+/)?.[0] || '1')
      return new Date(Date.now() - minutes * 60 * 1000)
    }
    if (dateText.includes('시간전') || dateText.includes('시간 전')) {
      const hours = parseInt(dateText.match(/\d+/)?.[0] || '1')
      return new Date(Date.now() - hours * 60 * 60 * 1000)
    }
    if (dateText.includes('일전') || dateText.includes('일 전')) {
      const days = parseInt(dateText.match(/\d+/)?.[0] || '1')
      return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    }
    
    // Default to current time
    return now
  }

  private async getPostDetail(post: CoolenjoyPost): Promise<{ content: string; images: string[]; postDate?: Date }> {
    if (!this.page) throw new Error('Page not initialized')
    
    // 상세 페이지 접근 - 뽐뿌 크롤러의 안정적인 로딩 전략 적용
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
      await this.page.waitForSelector('div.view_content, div.board_view, .content-body', {
        timeout: 8000
      })
    } catch (e) {
      console.log(`콘텐츠 영역 로딩 실패: ${post.url}`)
      // 그래도 시도해보기 위해 계속 진행
    }
    
    // 콘텐츠 로딩을 위한 추가 대기
    await this.delay(1500)
    
    const detail = await this.page.evaluate(() => {
      // 쿨앤조이 특화 콘텐츠 셀렉터 (우선순위 기반)
      const prioritySelectors = [
        'div.view_content',           // 주요 콘텐츠 영역
        'div.board_view',             // 게시판 뷰
        '.content-body',              // 일반적인 콘텐츠 바디
        '.view-content',              // 뷰 콘텐츠
        'div[id*="content"]',         // ID에 content가 포함된 div
        'div.post-content',           // 포스트 콘텐츠
        'td.han',                     // 한글 콘텐츠 (테이블 구조)
        '.article-content'            // 아티클 콘텐츠
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
                !text.includes('광고') &&
                !text.includes('배너')) {
              foundSelector = selector
              console.log(`콘텐츠 발견: ${selector} (${text.length}자)`)
              break
            }
          }
        } catch (e) {
          continue
        }
      }
      
      // 아직 찾지 못했다면 더 넓게 검색
      if (!contentEl || !foundSelector) {
        console.log('기본 셀렉터로 콘텐츠를 찾지 못함, 넓은 검색 시도')
        const possibleContents = document.querySelectorAll('td, div[class*="content"], div[class*="view"], p')
        
        for (const el of possibleContents) {
          const text = el.textContent?.trim() || ''
          if (text.length > 50 && 
              !text.includes('로그인') && 
              !text.includes('회원가입') &&
              !text.includes('검색') &&
              !text.includes('광고') &&
              !text.includes('script')) {
            contentEl = el
            foundSelector = 'fallback-search'
            console.log(`fallback으로 콘텐츠 발견: ${text.length}자`)
            break
          }
        }
      }
      
      // 콘텐츠 추출
      if (contentEl) {
        content = contentEl.textContent?.trim() || ''
        
        // 너무 짧다면 innerHTML에서 텍스트만 추출
        if (content.length < 20) {
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = contentEl.innerHTML
          tempDiv.querySelectorAll('script, style, noscript, iframe').forEach(el => el.remove())
          content = tempDiv.textContent?.trim() || ''
        }
        
        // 텍스트 정리
        content = content
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim()
        
        console.log(`최종 콘텐츠 길이: ${content.length}자`)
      }
      
      // 여전히 콘텐츠가 없다면 마지막 시도
      if (!content || content.length < 20) {
        console.log('마지막 fallback 시도')
        const allElements = document.querySelectorAll('*')
        let longestContent = ''
        
        for (const el of allElements) {
          const text = el.textContent?.trim() || ''
          if (text.length > longestContent.length && 
              text.length > 50 &&
              !text.includes('로그인') && 
              !text.includes('script') &&
              el.children.length < 10) {
            longestContent = text
          }
        }
        
        if (longestContent.length > content.length) {
          content = longestContent
          console.log(`fallback으로 더 긴 콘텐츠 발견: ${content.length}자`)
        }
      }
      
      // 이미지 추출
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
      
      return { content, images }
    })
    
    return detail
  }

  private convertToHotDeal(post: CoolenjoyPost, detail?: { content: string; images: string[] }): HotDeal {
    // Extract price from title and priceInfo
    let priceNum = this.parsePrice(post.title)
    
    // priceInfo가 있다면 더 정확한 가격 정보 시도
    if (post.priceInfo && !priceNum) {
      priceNum = this.parsePrice(post.priceInfo)
    }
    
    // Extract store from title or use default
    const storeName = this.parseStore(post.title) || '쿨엔조이'
    
    // Determine category - Coolenjoy is PC hardware focused
    const category = post.category || this.inferCategory(post.title)
    
    // Check free shipping
    const isFreeShipping = this.isFreeShipping(post.title)
    
    // Determine status
    const status = post.isSoldOut ? 'expired' : 'active'
    
    // 이미지 우선순위: 상세페이지 이미지 > 없음
    const finalImageUrl = detail?.images?.[0] || null
    
    // URL 정규화 (//로 시작하는 경우 https: 추가)
    const normalizedImageUrl = finalImageUrl && finalImageUrl.startsWith('//') 
      ? `https:${finalImageUrl}` 
      : finalImageUrl
    
    // 디버깅을 위한 로그 추가
    if (post.priceInfo) {
      console.log(chalk.gray(`가격 정보 발견: ${post.priceInfo} -> ${priceNum}원`))
    }
    
    if (detail?.content) {
      console.log(chalk.gray(`상세 콘텐츠 수집 완료: ${detail.content.length}자`))
    }
    
    return {
      id: this.generateId('coolenjoy', post.postNumber),
      source: 'coolenjoy',
      source_id: post.postNumber,
      category,
      title: post.title,
      description: detail?.content || (post.priceInfo ? `가격: ${post.priceInfo}` : ''),
      original_price: priceNum || 0,
      sale_price: priceNum || 0,
      discount_rate: 0,
      seller: storeName,
      original_url: post.url.startsWith('http') ? post.url : `https://coolenjoy.net${post.url}`,
      thumbnail_url: '',
      image_url: normalizedImageUrl || '',
      is_free_shipping: isFreeShipping,
      status,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: post.views,
      comment_count: post.commentCount,
      like_count: post.likeCount,
      author_name: post.author,
      shopping_comment: '',
      created_at: post.postDate.toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
  }

  protected inferCategory(title: string): string {
    const titleLower = title.toLowerCase()
    
    // PC Hardware categories - Coolenjoy specialization
    if (titleLower.includes('cpu') || titleLower.includes('프로세서') || titleLower.includes('라이젠') || titleLower.includes('인텔')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('그래픽') || titleLower.includes('gpu') || titleLower.includes('rtx') || titleLower.includes('gtx') || titleLower.includes('radeon')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('ram') || titleLower.includes('메모리') || titleLower.includes('ddr')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('ssd') || titleLower.includes('nvme') || titleLower.includes('하드') || titleLower.includes('저장장치')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('메인보드') || titleLower.includes('마더보드') || titleLower.includes('mainboard')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('파워') || titleLower.includes('psu') || titleLower.includes('전원')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('케이스') || titleLower.includes('쿨러') || titleLower.includes('쿨링')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('모니터') || titleLower.includes('디스플레이')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('키보드') || titleLower.includes('마우스') || titleLower.includes('헤드셋')) {
      return '컴퓨터/부품'
    }
    if (titleLower.includes('노트북') || titleLower.includes('laptop')) {
      return '컴퓨터/부품'
    }
    
    // Use parent class method for other categories
    return super.inferCategory(title)
  }

  protected getSourceName(): string {
    return '쿨엔조이'
  }

  private generateCoolenjoyStatistics() {
    return {
      totalDeals: this.results.length,
      freeShippingCount: this.results.filter(d => d.is_free_shipping).length,
      imagesCount: this.results.filter(d => d.image_url && d.image_url.length > 0).length,
      contentCount: this.results.filter(d => d.description && d.description.length > 20).length,
      categoryCounts: this.results.reduce((acc: Record<string, number>, deal) => {
        const category = deal.category || 'Unknown'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}),
      storeCounts: this.results.reduce((acc: Record<string, number>, deal) => {
        const seller = deal.seller || 'Unknown'
        acc[seller] = (acc[seller] || 0) + 1
        return acc
      }, {}),
      soldOutCount: this.results.filter(d => d.status === 'expired').length
    }
  }

  private printCoolenjoyStatistics(stats: any, timeFilterHours?: number): void {
    console.log(chalk.cyan('\n📊 통계:'))
    if (timeFilterHours) {
      console.log(chalk.gray(`- 시간 필터: 최근 ${timeFilterHours}시간 내 게시물만`))
    }
    console.log(chalk.gray(`- 총 딜 수: ${stats.totalDeals}개`))
    console.log(chalk.gray(`- 무료배송: ${stats.freeShippingCount}개`))
    console.log(chalk.gray(`- 품절/종료: ${stats.soldOutCount}개`))
    console.log(chalk.gray(`- 이미지 있음: ${stats.imagesCount}개`))
    console.log(chalk.gray(`- 본문 텍스트 있음: ${stats.contentCount}개`))
    console.log(chalk.gray(`- 카테고리: ${Object.keys(stats.categoryCounts).length}개`))
    console.log(chalk.gray(`- 쇼핑몰: ${Object.keys(stats.storeCounts).length}개`))
  }

  protected async delay(ms?: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms || this.options.delay))
  }
}