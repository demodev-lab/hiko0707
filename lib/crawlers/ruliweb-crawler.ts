import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface RuliwebPost {
  postNumber: string
  title: string
  url: string
  author: string
  category?: string
  views: number
  recommendCount: number
  commentCount: number
  postDate: Date
}

export class RuliwebCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://bbs.ruliweb.com/market/board/1020'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    postRow: 'tbody tr.table_body:not(.notice):not(.best)',  // 공지사항과 베스트 게시글 제외
    postId: 'td.id',
    category: 'td.divsn a strong',
    titleLink: 'td.subject a.subject_link',
    commentCount: 'td.subject a.num_reply',
    author: 'td.writer a',
    recommendCount: 'td.recomd',
    viewCount: 'td.hit',
    postDate: 'td.time',
    // 상세페이지 콘텐츠 셀렉터들
    contentAreas: [
      '.board_content',  // 루리웹 게시판 콘텐츠
      '.view_content',   // 뷰 콘텐츠
      '.article_content', // 아티클 콘텐츠
      '.post-content',   // 포스트 콘텐츠
      'div[class*="content"]'  // 콘텐츠 관련 div들
    ],
    contentImages: '.board_content img, .view_content img, .article_content img, .post-content img'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('루리웹 크롤링 시작...').start()
    
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
        spinner.text = `루리웹 페이지 ${pageNum}/${this.options.maxPages} 크롤링 중...`
        
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
            
            // 시간 기준 필터링
            if (timeFilterEnabled && cutoffTime && posts[i].postDate) {
              if (posts[i].postDate < cutoffTime) {
                oldPostsInRowCount++
                console.log(chalk.gray(`⏰ 시간 범위 초과: ${posts[i].title} (${posts[i].postDate})`))
                
                // 연속으로 5개 이상의 오래된 게시물을 만나면 크롤링 중단
                if (oldPostsInRowCount >= 5) {
                  console.log(chalk.yellow(`연속 ${oldPostsInRowCount}개 오래된 게시물 발견, 크롤링 중단`))
                  shouldStopCrawling = true
                  break
                }
                continue
              } else {
                oldPostsInRowCount = 0 // 최신 게시물을 만나면 카운터 리셋
                console.log(chalk.green(`✓ 시간 범위 내: ${posts[i].title} (${posts[i].postDate})`))
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
              const remainingPages = this.options.maxPages - pageNum
              const currentPageProcessed = i + 1
              const currentPageTotal = posts.length
              const estimatedTotal = totalProcessed + (remainingPages * 20) + (currentPageTotal - currentPageProcessed)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] 시간 기준: ${posts[i].title}`)
            } else {
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
              const remainingPages = this.options.maxPages - pageNum
              const currentPageProcessed = i + 1
              const currentPageTotal = posts.length
              const estimatedTotal = totalProcessed + (remainingPages * 20) + (currentPageTotal - currentPageProcessed)
              
              this.options.onProgress?.(totalProcessed, estimatedTotal, `[${totalProcessed}/${estimatedTotal}] 오류: ${posts[i].title}`)
            } else {
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
        
        if (pageNum < this.options.maxPages && !shouldStopCrawling) {
          await this.delay()
        }
      }
      
      const completionMessage = timeFilterEnabled && cutoffTime
        ? `루리웹 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내)`
        : `루리웹 크롤링 완료: ${this.results.length}개 딜 수집`
      
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
      spinner.fail(chalk.red('루리웹 크롤링 실패'))
      throw error
    } finally {
      await this.cleanup()
    }
  }

  private async crawlPage(pageNum: number): Promise<RuliwebPost[]> {
    if (!this.page) throw new Error('Page not initialized')
    
    const url = pageNum === 1 ? this.baseUrl : `${this.baseUrl}?page=${pageNum}`
    
    // 루리웹 접속 시도
    try {
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
    } catch (error) {
      console.log(`페이지 ${pageNum} 첫 번째 시도 실패, 재시도 중...`)
      await this.page.goto(url, { 
        waitUntil: 'load',
        timeout: 20000
      })
    }
    
    // 페이지 로딩 완료까지 대기
    await this.delay(1000)
    
    console.log(`페이지 ${pageNum} - 게시글 목록 수집 중...`)
    
    const posts = await this.page.evaluate(({ selectors }) => {
      const rows = document.querySelectorAll(selectors.postRow)
      const results: any[] = []
      
      rows.forEach(row => {
        // 게시물 ID 추출
        const postIdEl = row.querySelector(selectors.postId)
        const postNumber = postIdEl?.textContent?.trim() || ''
        if (!postNumber) return
        
        // 제목과 URL 추출
        const titleLinkEl = row.querySelector(selectors.titleLink) as HTMLAnchorElement
        if (!titleLinkEl) return
        
        const title = titleLinkEl.textContent?.trim() || ''
        const url = titleLinkEl.href
        if (!title || !url) return
        
        // 카테고리 추출
        const categoryEl = row.querySelector(selectors.category)
        const category = categoryEl?.textContent?.trim() || ''
        
        // 작성자 추출
        const authorEl = row.querySelector(selectors.author)
        const author = authorEl?.textContent?.trim() || ''
        
        // 추천수 추출
        const recommendEl = row.querySelector(selectors.recommendCount)
        const recommendCount = parseInt(recommendEl?.textContent?.trim() || '0') || 0
        
        // 조회수 추출
        const viewEl = row.querySelector(selectors.viewCount)
        const views = parseInt(viewEl?.textContent?.trim().replace(/,/g, '') || '0') || 0
        
        // 댓글수 추출 (형태: " (13)")
        const commentEl = row.querySelector(selectors.commentCount)
        let commentCount = 0
        if (commentEl) {
          const commentText = commentEl.textContent?.trim() || ''
          const commentMatch = commentText.match(/\((\d+)\)/)
          commentCount = commentMatch ? parseInt(commentMatch[1]) : 0
        }
        
        // 날짜 추출
        const dateEl = row.querySelector(selectors.postDate)
        const dateStr = dateEl?.textContent?.trim() || ''
        
        results.push({
          postNumber,
          title,
          url,
          author,
          category,
          recommendCount,
          views,
          commentCount,
          dateStr
        })
      })
      
      return results
    }, { selectors: this.selectors })
    
    // 날짜 파싱
    return posts.map(post => ({
      ...post,
      postDate: this.parseRuliwebDate(post.dateStr)
    }))
  }

  private parseRuliwebDate(dateStr: string): Date {
    const now = new Date()
    
    // 루리웹 날짜 형식 처리
    console.log(`루리웹 날짜 파싱 시도: "${dateStr}"`)
    
    // "2025.07.30" 형식
    const fullDateMatch = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
    if (fullDateMatch) {
      const [, year, month, day] = fullDateMatch
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      console.log(`전체 날짜 형식으로 파싱: ${date}`)
      return date
    }
    
    // "07:30" 또는 "16:45" 형식 (오늘 날짜)
    const timeOnlyMatch = dateStr.match(/(\d{1,2}):(\d{2})/)
    if (timeOnlyMatch) {
      const [, hours, minutes] = timeOnlyMatch
      const date = new Date(now)
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      console.log(`시간만 파싱 (오늘): ${date}`)
      return date
    }
    
    // "07-30" 또는 "07/30" 형식 (올해)
    const monthDayMatch = dateStr.match(/(\d{1,2})[-.\/](\d{1,2})/)
    if (monthDayMatch) {
      const [, month, day] = monthDayMatch
      const date = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day))
      console.log(`월-일 형식으로 파싱: ${date}`)
      return date
    }
    
    // 파싱 실패 시 현재 시간 반환
    console.log(`날짜 파싱 실패, 현재 시간 사용: ${now}`)
    return now
  }

  private async getPostDetail(post: RuliwebPost): Promise<{ content: string; images: string[] }> {
    if (!this.page) throw new Error('Page not initialized')
    
    // 상세 페이지 접근
    try {
      await this.page.goto(post.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })
    } catch (error) {
      console.log(`상세 페이지 접근 실패, 건너뛰기: ${post.url}`)
      return { content: '', images: [] }
    }
    
    // 콘텐츠 영역 로딩 대기
    try {
      await this.page.waitForSelector('.board_content, .view_content, .article_content', {
        timeout: 8000
      })
    } catch (e) {
      console.log(`콘텐츠 영역 로딩 실패: ${post.url}`)
    }
    
    // 콘텐츠 로딩을 위한 추가 대기
    await this.delay(1500)
    
    const detail = await this.page.evaluate(({ selectors }) => {
      // 콘텐츠 추출을 위한 셀렉터 우선순위
      const prioritySelectors = [
        '.board_content',  // 루리웹 게시판 콘텐츠
        '.view_content',   // 뷰 콘텐츠
        '.article_content', // 아티클 콘텐츠
        '.post-content',   // 포스트 콘텐츠
        ...selectors.contentAreas
      ]
      
      let contentEl: Element | null = null
      let content = ''
      let foundSelector = ''
      
      // 우선순위에 따라 콘텐츠 셀렉터 시도
      for (const selector of prioritySelectors) {
        try {
          contentEl = document.querySelector(selector)
          if (contentEl) {
            const text = contentEl.textContent?.trim() || ''
            // 실제 콘텐츠인지 확인 (최소 20자 이상)
            if (text.length > 20 && 
                !text.includes('로그인') && 
                !text.includes('회원가입') &&
                !text.includes('검색') &&
                !text.includes('광고')) {
              foundSelector = selector
              console.log(`콘텐츠 발견: ${selector} (${text.length}자)`)
              break
            }
          }
        } catch (e) {
          continue
        }
      }
      
      // 콘텐츠 추출
      if (contentEl) {
        content = contentEl.textContent?.trim() || ''
        
        // 텍스트 정리
        content = content
          .replace(/\s+/g, ' ')  // 여러 공백을 하나로
          .replace(/\n\s*\n/g, '\n')  // 여러 줄바꿈을 하나로
          .trim()
        
        console.log(`최종 콘텐츠 길이: ${content.length}자`)
      }
      
      // 이미지 추출
      const images: string[] = []
      
      if (contentEl) {
        const imageEls = contentEl.querySelectorAll('img')
        imageEls.forEach(img => {
          const src = (img as HTMLImageElement).src
          if (src && src.startsWith('http')) {
            const isValidFormat = /\.(jpg|jpeg|png|webp|gif)/i.test(src)
            const isIcon = /icon|emoticon|menu|logo|share|smilie/i.test(src)
            
            if (isValidFormat && !isIcon) {
              images.push(src)
            }
          }
        })
      }
      
      console.log(`수집된 이미지: ${images.length}개`)
      
      return { content, images }
    }, { selectors: this.selectors })
    
    return detail
  }

  private convertToHotDeal(post: RuliwebPost, detail?: { content: string; images: string[] }): HotDeal {
    const priceNum = this.parsePrice(post.title)
    const storeName = this.parseRuliwebStore(post.title)
    const category = this.inferCategory(post.title)
    const isFreeShipping = this.isFreeShipping(post.title)
    
    // 이미지 선택 (첫 번째 이미지 사용)
    const imageUrl = detail?.images && detail.images.length > 0 ? detail.images[0] : ''
    
    return {
      id: this.generateId('ruliweb', post.postNumber),
      title: post.title,
      sale_price: priceNum,
      seller: storeName || '알 수 없음',
      category,
      original_url: post.url,
      image_url: imageUrl,
      thumbnail_url: imageUrl, // 루리웹은 썸네일과 원본이 동일
      source: 'ruliweb' as any,
      source_id: post.postNumber,
      created_at: post.postDate.toISOString(),
      author_name: post.author,
      comment_count: post.commentCount || 0,
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
    }
  }

  private parseRuliwebStore(title: string): string | null {
    // 루리웹 제목 형식: [상점명] 상품명
    const storeMatch = title.match(/^\[(.*?)\]/)
    if (storeMatch) {
      return storeMatch[1].trim()
    }
    
    // 상점명이 없는 경우 null 반환
    return null
  }

  private printStatistics(stats: any, timeFilterHours?: number): void {
    console.log(chalk.cyan('\n📊 통계:'))
    if (timeFilterHours) {
      console.log(chalk.gray(`- 시간 필터: 최근 ${timeFilterHours}시간 내 게시물만`))
    }
    console.log(chalk.gray(`- 총 딜 수: ${stats.totalDeals}개`))
    console.log(chalk.gray(`- 무료배송: ${stats.freeShippingCount}개`))
    console.log(chalk.gray(`- 이미지 있음: ${stats.imagesCount}개`))
    console.log(chalk.gray(`- 본문 텍스트 있음: ${stats.contentCount}개`))
    console.log(chalk.gray(`- 카테고리: ${Object.keys(stats.categoryCounts).length}개`))
    console.log(chalk.gray(`- 쇼핑몰: ${Object.keys(stats.storeCounts).length}개`))
  }

  protected getSourceName(): string {
    return 'ruliweb'
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
}