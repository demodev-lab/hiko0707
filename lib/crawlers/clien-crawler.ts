import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface ClienPost {
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
}

export class ClienCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://www.clien.net/service/board/jirum'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    postItem: 'div.list_item.symph_row.jirum',
    postIdAttr: 'data-board-sn',
    likeCount: 'div.list_symph em',
    titleLink: 'div.list_title a',
    author: 'div.list_author span.nickname span',
    authorImg: 'div.list_author span.nickname img',
    category: 'span.category',
    viewCount: 'div.list_hit span.hit',
    timestamp: 'div.list_time span.timestamp',
    commentCount: 'span.list_comment_count span',
    soldOutClass: 'sold_out',
    // 상세페이지 콘텐츠 셀렉터들
    contentAreas: [
      '.post_content',
      '.content_view',
      '.board_main',
      'div[class*="content"]'
    ],
    contentImages: 'img'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('클리앙 크롤링 시작...').start()
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

      console.log(chalk.cyan(`🔍 클리앙 크롤링 시작 (최대 ${this.options.maxPages}페이지)`))
      if (timeFilterEnabled) {
        console.log(chalk.yellow(`⏰ 시간 필터링: 최근 ${timeFilterHours}시간 이내 게시물만 수집`))
      }

      for (let pageNum = 0; pageNum < this.options.maxPages && !shouldStopCrawling; pageNum++) {
        spinner.text = `클리앙 ${pageNum + 1}/${this.options.maxPages} 페이지 크롤링 중...`
        
        const posts = await this.crawlPage(pageNum)
        if (posts.length === 0) {
          console.log(chalk.yellow(`클리앙 ${pageNum + 1}페이지: 게시물 없음`))
          break
        }

        console.log(chalk.gray(`클리앙 ${pageNum + 1}페이지: ${posts.length}개 게시물 발견`))

        // 시간 필터 적용
        const cutoffTime = timeFilterEnabled 
          ? new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000))
          : null

        for (let i = 0; i < posts.length; i++) {
          spinner.text = `클리앙 ${pageNum + 1}/${this.options.maxPages} 페이지 - ${i + 1}/${posts.length} 처리 중...`
          
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
            const existing = await this.supabaseRepository.findBySourceAndPostId('clien', hotdeal.source_id)
            
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
            const estimatedTotal = totalProcessed + (posts.length - i - 1) + ((this.options.maxPages - pageNum - 1) * 30)
            this.options.onProgress?.(totalProcessed, estimatedTotal, `클리앙: ${posts[i].title}`)
            
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
        
        if (pageNum < this.options.maxPages - 1 && !shouldStopCrawling) {
          await this.delay()
        }
      }
      
      const completionMessage = timeFilterEnabled
        ? `클리앙 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내)`
        : `클리앙 크롤링 완료: ${this.results.length}개 딜 수집`
      
      this.options.onProgress?.(totalProcessed, totalProcessed, completionMessage)
      spinner.succeed(chalk.green(completionMessage))
      
    } catch (error) {
      spinner.fail(chalk.red('클리앙 크롤링 실패'))
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

  private async crawlPage(pageNum: number): Promise<ClienPost[]> {
    const url = pageNum === 0 
      ? this.baseUrl 
      : `${this.baseUrl}?&po=${pageNum}`
    
    await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // 페이지가 완전히 로드될 때까지 잠시 대기
    await this.delay(2000)
    
    // 게시물 목록이 로드될 때까지 대기
    try {
      await this.page!.waitForSelector('div.list_item.symph_row', {
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
        // Skip notice items
        if (item.classList.contains('notice')) return
        
        const postNumber = item.getAttribute(selectors.postIdAttr) || ''
        if (!postNumber) return
        
        const titleLink = item.querySelector(selectors.titleLink) as HTMLAnchorElement
        const title = titleLink?.textContent?.trim() || ''
        const url = titleLink?.href || ''
        
        // Extract like count
        const likeEl = item.querySelector(selectors.likeCount)
        const likeCount = parseInt(likeEl?.textContent?.trim() || '0') || 0
        
        // Extract author (can be from span or img alt)
        let author = item.querySelector(selectors.author)?.textContent?.trim() || ''
        if (!author) {
          const authorImg = item.querySelector(selectors.authorImg) as HTMLImageElement
          author = authorImg?.alt || 'Unknown'
        }
        
        // Extract view count
        const viewText = item.querySelector(selectors.viewCount)?.textContent?.trim() || '0'
        let views = 0
        if (viewText.toLowerCase().includes('k')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000)
        } else if (viewText.toLowerCase().includes('m')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000000)
        } else {
          views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
        }
        
        // Extract comment count from data attribute
        const commentCount = parseInt(item.getAttribute('data-comment-count') || '0') || 0
        
        // Extract date (will be parsed outside evaluate)
        const dateText = item.querySelector(selectors.timestamp)?.textContent?.trim() || ''
        
        // Check if sold out
        const isSoldOut = item.classList.contains(selectors.soldOutClass)
        
        postList.push({
          postNumber,
          title,
          url,
          author,
          views,
          likeCount,
          commentCount,
          dateText,
          isSoldOut
        })
      })
      
      return postList
    }, { selectors: this.selectors })

    // Parse dates outside evaluate
    const postsWithDates = posts.map(post => ({
      ...post,
      postDate: this.parseClienDate(post.dateText)
    }))

    return postsWithDates
  }

  private parseClienDate(dateText: string): Date {
    const now = new Date()
    
    // Clien uses full timestamp format: "2025-08-05 09:10:11"
    if (dateText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
      return new Date(dateText)
    }
    
    // In case of other formats, return current time
    return now
  }

  private convertToHotDeal(post: ClienPost): HotDeal {
    // Extract price from title
    const priceNum = this.parsePrice(post.title)
    
    // Extract store from title or use default
    const storeName = this.parseStore(post.title) || '클리앙'
    
    // Determine category based on title
    const category = this.inferCategory(post.title)
    
    // Check free shipping
    const isFreeShipping = this.isFreeShipping(post.title)
    
    // Determine status
    const status = post.isSoldOut ? 'expired' : 'active'
    
    return {
      id: '',
      source: 'clien',
      source_id: post.postNumber,
      category,
      title: post.title,
      description: null,
      original_price: priceNum || 0,
      sale_price: priceNum || 0,
      discount_rate: 0,
      seller: storeName,
      original_url: post.url.startsWith('http') ? post.url : `https://www.clien.net${post.url}`,
      thumbnail_url: '',
      image_url: '',
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

  protected getSourceName(): string {
    return '클리앙'
  }

}