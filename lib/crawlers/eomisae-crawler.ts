import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface EomisaePost {
  postNumber: string
  title: string
  url: string
  author: string
  category?: string
  views: number
  likeCount: number
  commentCount: number
  postDate: Date
}

export class EomisaeCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://eomisae.co.kr/fs'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    postItem: 'div.card_el.n_ntc',
    titleLink: 'h3 a.pjax',
    category: 'span.cate',
    dateSpan: 'p > span:not(.cate)',
    authorContainer: 'div.info span div',
    viewCount: 'span.fr:has(i.ion-ios-eye)',
    commentCount: 'span.fr:has(i.ion-ios-chatbubble)',
    likeCount: 'span.fr:has(i.ion-ios-heart)',
    thumbnail: 'img.tmb',
    // 상세페이지 콘텐츠 셀렉터들
    contentAreas: [
      '.xe_content',
      '.board-content',
      '.view-content',
      'div[class*="content"]'
    ],
    contentImages: 'img'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('어미새 크롤링 시작...').start()
    const startTime = Date.now()
    let totalProcessed = 0
    let newDeals = 0
    let updatedDeals = 0
    let errors = 0

    try {
      await this.init()
      
      const timeFilterEnabled = this.options.timeFilterHours !== undefined
      const timeFilterHours = this.options.timeFilterHours || 24
      let oldPostsInRowCount = 0
      let shouldStopCrawling = false

      console.log(chalk.cyan(`🔍 어미새 크롤링 시작 (최대 ${this.options.maxPages}페이지)`))
      if (timeFilterEnabled) {
        console.log(chalk.yellow(`⏰ 시간 필터링: 최근 ${timeFilterHours}시간 이내 게시물만 수집`))
      }

      for (let pageNum = 1; pageNum <= this.options.maxPages && !shouldStopCrawling; pageNum++) {
        spinner.text = `어미새 ${pageNum}/${this.options.maxPages} 페이지 크롤링 중...`
        
        const posts = await this.crawlPage(pageNum)
        if (posts.length === 0) {
          console.log(chalk.yellow(`어미새 ${pageNum}페이지: 게시물 없음`))
          break
        }

        console.log(chalk.gray(`어미새 ${pageNum}페이지: ${posts.length}개 게시물 발견`))

        // 시간 필터 적용
        const cutoffTime = timeFilterEnabled 
          ? new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000))
          : null

        for (let i = 0; i < posts.length; i++) {
          spinner.text = `어미새 ${pageNum}/${this.options.maxPages} 페이지 - ${i + 1}/${posts.length} 처리 중...`
          
          try {
            // 시간 기준 필터링
            if (timeFilterEnabled && cutoffTime && posts[i].postDate) {
              if (posts[i].postDate < cutoffTime) {
                oldPostsInRowCount++
                console.log(chalk.gray(`⏰ 시간 범위 초과: ${posts[i].title} (${posts[i].postDate})`))
                
                if (oldPostsInRowCount >= 5) {
                  console.log(chalk.yellow(`연속 ${oldPostsInRowCount}개 오래된 게시물 발견, 크롤링 중단`))
                  shouldStopCrawling = true
                  break
                }
                continue
              } else {
                oldPostsInRowCount = 0
                console.log(chalk.green(`✓ 시간 범위 내: ${posts[i].title} (${posts[i].postDate})`))
              }
            }

            const hotdeal = this.convertToHotDeal(posts[i])
            
            // Supabase에 저장
            const existing = await this.supabaseRepository.findBySourceAndPostId('eomisae', hotdeal.source_id)
            
            if (!existing) {
              const saved = await this.supabaseRepository.create(hotdeal)
              if (saved) {
                newDeals++
                console.log(chalk.green(`✅ 신규 저장: ${hotdeal.title}`))
              }
            } else {
              updatedDeals++
              console.log(chalk.blue(`♻️  업데이트: ${hotdeal.title}`))
            }
            
            this.results.push(hotdeal)
            totalProcessed++
            
            // 진행도 콜백
            const estimatedTotal = totalProcessed + (posts.length - i - 1) + ((this.options.maxPages - pageNum) * 20)
            this.options.onProgress?.(totalProcessed, estimatedTotal, `어미새: ${posts[i].title}`)
            
          } catch (error) {
            console.error(chalk.red(`❌ 처리 실패: ${posts[i].title}`), error)
            errors++
            oldPostsInRowCount = 0
          }
          
          // 각 게시물 사이에 짧은 딜레이
          if (i < posts.length - 1) {
            await this.delay(200)
          }
        }
        
        if (pageNum < this.options.maxPages && !shouldStopCrawling) {
          await this.delay()
        }
      }
      
      const completionMessage = timeFilterEnabled
        ? `어미새 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내)`
        : `어미새 크롤링 완료: ${this.results.length}개 딜 수집`
      
      this.options.onProgress?.(totalProcessed, totalProcessed, completionMessage)
      spinner.succeed(chalk.green(completionMessage))
      
    } catch (error) {
      spinner.fail(chalk.red('어미새 크롤링 실패'))
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

  private async crawlPage(pageNum: number): Promise<EomisaePost[]> {
    const url = pageNum === 1 
      ? this.baseUrl 
      : `${this.baseUrl}?page=${pageNum}`
    
    await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // 페이지가 완전히 로드될 때까지 잠시 대기
    await this.delay(2000)
    
    // 게시물 목록이 로드될 때까지 대기
    try {
      await this.page!.waitForSelector('div.card_el', {
        timeout: 10000
      })
    } catch (error) {
      console.log(chalk.yellow('콘텐츠 로드 실패, 빈 페이지일 수 있습니다.'))
      return []
    }

    const posts = await this.page!.evaluate(({ selectors }) => {
      const items = document.querySelectorAll(selectors.postItem)
      const postList: any[] = []
      
      items.forEach(item => {
        const titleLink = item.querySelector(selectors.titleLink) as HTMLAnchorElement
        if (!titleLink) return
        
        const title = titleLink.textContent?.trim() || ''
        const url = titleLink.href || ''
        
        // Extract post ID from URL (e.g., /fs/158996807)
        const postIdMatch = url.match(/\/fs\/(\d+)/)
        const postNumber = postIdMatch ? postIdMatch[1] : ''
        if (!postNumber) return
        
        // Extract category
        const categoryEl = item.querySelector(selectors.category)
        let category = categoryEl?.textContent?.trim() || ''
        // Remove trailing comma if exists
        category = category.replace(/,$/, '')
        
        // Extract date - it's in a span next to category
        const dateEl = item.querySelector(selectors.dateSpan)
        const dateText = dateEl?.textContent?.trim() || ''
        
        // Extract author
        const authorEl = item.querySelector(selectors.authorContainer)
        const author = authorEl?.textContent?.trim() || 'Unknown'
        
        // Extract view count
        const viewEl = item.querySelector(selectors.viewCount)
        const viewText = viewEl?.textContent?.trim() || '0'
        const views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
        
        // Extract comment count
        const commentEl = item.querySelector(selectors.commentCount)
        const commentText = commentEl?.textContent?.trim() || '0'
        const commentCount = parseInt(commentText.replace(/[^0-9]/g, '')) || 0
        
        // Extract like count
        const likeEl = item.querySelector(selectors.likeCount)
        const likeText = likeEl?.textContent?.trim() || '0'
        const likeCount = parseInt(likeText.replace(/[^0-9]/g, '')) || 0
        
        postList.push({
          postNumber,
          title,
          url,
          author,
          category,
          views,
          likeCount,
          commentCount,
          dateText
        })
      })
      
      return postList
    }, { selectors: this.selectors })

    // Parse dates outside evaluate
    const postsWithDates = posts.map(post => ({
      ...post,
      postDate: this.parseEomisaeDate(post.dateText)
    }))

    return postsWithDates
  }

  private parseEomisaeDate(dateText: string): Date {
    // 어미새 날짜 형식: "25.08.04" (YY.MM.DD)
    const match = dateText.match(/(\d{2})\.(\d{2})\.(\d{2})/)
    if (match) {
      const [_, yearShort, month, day] = match
      const year = 2000 + parseInt(yearShort)
      return new Date(year, parseInt(month) - 1, parseInt(day))
    }
    
    // If parsing fails, return current date
    return new Date()
  }

  private convertToHotDeal(post: EomisaePost): HotDeal {
    // Extract price from title
    const priceNum = this.parsePrice(post.title)
    
    // Extract store from title or use category
    const storeName = this.parseStore(post.title) || post.category || '어미새'
    
    // Determine category based on post category and title
    const category = this.inferCategoryFromEomisae(post.category, post.title)
    
    // Check free shipping
    const isFreeShipping = this.isFreeShipping(post.title)
    
    return {
      id: '',
      source: 'eomisae',
      source_id: post.postNumber,
      category,
      title: post.title,
      description: null,
      original_price: priceNum || 0,
      sale_price: priceNum || 0,
      discount_rate: 0,
      seller: storeName,
      original_url: post.url.startsWith('http') ? post.url : `https://eomisae.co.kr${post.url}`,
      thumbnail_url: '',
      image_url: '',
      is_free_shipping: isFreeShipping,
      status: 'active',
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

  private inferCategoryFromEomisae(postCategory?: string, title?: string): string {
    const categoryLower = postCategory?.toLowerCase() || ''
    const titleLower = title?.toLowerCase() || ''
    
    // Check post category first
    if (categoryLower.includes('패션')) return '패션의류'
    if (categoryLower.includes('네이버')) return '기타'
    if (categoryLower.includes('기타')) return '기타'
    
    // Check title content
    if (titleLower.includes('신발') || titleLower.includes('스니커즈')) return '신발'
    if (titleLower.includes('가방') || titleLower.includes('백팩')) return '가방'
    if (titleLower.includes('모자') || titleLower.includes('캡')) return '모자/액세서리'
    if (titleLower.includes('시계') || titleLower.includes('워치')) return '모자/액세서리'
    if (titleLower.includes('지갑') || titleLower.includes('벨트')) return '모자/액세서리'
    
    return '기타'
  }

  protected getSourceName(): string {
    return '어미새'
  }

  private async delay(ms?: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms || this.options.delay))
  }
}