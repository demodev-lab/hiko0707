import { BaseHotdealCrawler, CrawlerOptions } from './base-hotdeal-crawler'
import type { HotDeal } from '@/types/hotdeal'
import type { CrawlResult } from './types'
import { SupabaseHotDealRepository } from '@/lib/db/supabase/repositories/hotdeal-repository'
import chalk from 'chalk'
import ora from 'ora'

interface QuasarzonePost {
  postNumber: string
  title: string
  url: string
  author: string
  category?: string
  price?: number
  store?: string
  shippingInfo?: string
  views: number
  recommendCount: number
  commentCount: number
  postDate: Date
  status?: string
}

export class QuasarzoneCrawler extends BaseHotdealCrawler {
  private readonly baseUrl = 'https://quasarzone.com/bbs/qb_saleinfo'
  private supabaseRepository: SupabaseHotDealRepository
  private readonly selectors = {
    postRow: 'table tbody tr',
    voteCount: 'td:first-child span.num',
    postContainer: 'div.market-info-list',
    titleLink: 'a.subject-link',
    titleText: 'a.subject-link span.ellipsis-with-reply-cnt',
    category: 'span.category',
    price: 'span.text-orange',
    brand: 'span.brand',
    shippingInfo: 'div.market-info-sub p:first-child span',
    author: 'span.user-nick-wrap .user-nick-text',
    viewCount: 'span.count',
    date: 'span.date',
    status: 'span.label',
    commentCount: 'span.board-list-comment span.ctn-count',
    // 상세페이지 콘텐츠 셀렉터들
    contentAreas: [
      '.board-contents',
      '.view-content',
      '.article-content',
      '.post-content',
      'div[class*="content"]'
    ],
    contentImages: 'img'
  }

  constructor(options: CrawlerOptions = {}) {
    super(options)
    this.supabaseRepository = new SupabaseHotDealRepository()
  }

  async crawl(): Promise<CrawlResult> {
    const spinner = ora('퀘이사존 크롤링 시작...').start()
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

      console.log(chalk.cyan(`🔍 퀘이사존 크롤링 시작 (최대 ${this.options.maxPages}페이지)`))
      if (timeFilterEnabled) {
        console.log(chalk.yellow(`⏰ 시간 필터링: 최근 ${timeFilterHours}시간 이내 게시물만 수집`))
      }

      for (let pageNum = 1; pageNum <= this.options.maxPages && !shouldStopCrawling; pageNum++) {
        spinner.text = `퀘이사존 ${pageNum}/${this.options.maxPages} 페이지 크롤링 중...`
        
        const posts = await this.crawlPage(pageNum)
        if (posts.length === 0) {
          console.log(chalk.yellow(`퀘이사존 ${pageNum}페이지: 게시물 없음`))
          break
        }

        console.log(chalk.gray(`퀘이사존 ${pageNum}페이지: ${posts.length}개 게시물 발견`))

        // 시간 필터 적용
        const cutoffTime = timeFilterEnabled 
          ? new Date(Date.now() - (timeFilterHours * 60 * 60 * 1000))
          : null

        for (let i = 0; i < posts.length; i++) {
          spinner.text = `퀘이사존 ${pageNum}/${this.options.maxPages} 페이지 - ${i + 1}/${posts.length} 처리 중...`
          
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
            const existing = await this.supabaseRepository.findBySourceAndPostId('quasarzone', hotdeal.source_id)
            
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
            this.options.onProgress?.(totalProcessed, estimatedTotal, `퀘이사존: ${posts[i].title}`)
            
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
        ? `퀘이사존 크롤링 완료: ${this.results.length}개 딜 수집 (최근 ${timeFilterHours}시간 내)`
        : `퀘이사존 크롤링 완료: ${this.results.length}개 딜 수집`
      
      this.options.onProgress?.(totalProcessed, totalProcessed, completionMessage)
      spinner.succeed(chalk.green(completionMessage))
      
    } catch (error) {
      spinner.fail(chalk.red('퀘이사존 크롤링 실패'))
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

  private async crawlPage(pageNum: number): Promise<QuasarzonePost[]> {
    const url = pageNum === 1 
      ? this.baseUrl 
      : `${this.baseUrl}?page=${pageNum}`
    
    await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // 페이지가 완전히 로드될 때까지 잠시 대기
    await this.delay(2000)
    
    // 테이블이 로드될 때까지 대기
    try {
      await this.page!.waitForSelector('div.market-info-list', {
        timeout: 10000
      })
    } catch (error) {
      console.log(chalk.yellow('콘텐츠 로드 실패, 빈 페이지일 수 있습니다.'))
      return []
    }

    const posts = await this.page!.evaluate(({ selectors }) => {
      const rows = document.querySelectorAll(selectors.postRow)
      const postList: any[] = []
      
      rows.forEach(row => {
        const postContainer = row.querySelector(selectors.postContainer)
        if (!postContainer) return // Skip rows without market-info-list
        
        const titleLink = postContainer.querySelector(selectors.titleLink) as HTMLAnchorElement
        const titleText = postContainer.querySelector(selectors.titleText)?.textContent?.trim() || ''
        const url = titleLink?.href || ''
        
        // Extract post ID from URL
        const postIdMatch = url.match(/\/views\/(\d+)/)
        const postNumber = postIdMatch ? postIdMatch[1] : ''
        
        // Extract vote count
        const voteText = row.querySelector(selectors.voteCount)?.textContent?.trim() || '0'
        const recommendCount = parseInt(voteText) || 0
        
        // Extract category
        const category = postContainer.querySelector(selectors.category)?.textContent?.trim()
        
        // Extract price
        const priceText = postContainer.querySelector(selectors.price)?.textContent?.trim() || ''
        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0
        
        // Extract shipping info
        const shippingSpans = postContainer.querySelectorAll('div.market-info-sub p:first-child span')
        let shippingInfo = ''
        shippingSpans.forEach(span => {
          const text = span.textContent || ''
          if (text.includes('배송비')) {
            shippingInfo = text.trim()
          }
        })
        
        // Extract store from title [Store] format
        const storeMatch = titleText.match(/\[([^\]]+)\]/)
        const store = storeMatch ? storeMatch[1] : '퀘이사존'
        
        // Extract author
        const author = postContainer.querySelector(selectors.author)?.textContent?.trim() || 'Unknown'
        
        // Extract view count
        const viewText = postContainer.querySelector(selectors.viewCount)?.textContent?.trim() || '0'
        let views = 0
        if (viewText.toLowerCase().includes('k')) {
          const num = parseFloat(viewText.replace(/[^0-9.]/g, ''))
          views = Math.round(num * 1000)
        } else {
          views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0
        }
        
        // Extract comment count
        const commentText = postContainer.querySelector(selectors.commentCount)?.textContent?.trim() || '0'
        const commentCount = parseInt(commentText) || 0
        
        // Extract date (will be parsed outside evaluate)
        const dateText = postContainer.querySelector(selectors.date)?.textContent?.trim() || ''
        
        // Extract status
        const status = postContainer.querySelector(selectors.status)?.textContent?.trim()
        
        postList.push({
          postNumber,
          title: titleText.replace(/\[[^\]]+\]\s*/, '').trim(), // Remove store prefix
          url,
          author,
          category,
          price,
          store,
          shippingInfo,
          views,
          recommendCount,
          commentCount,
          dateText,
          status
        })
      })
      
      return postList
    }, { selectors: this.selectors })

    // Parse dates outside evaluate
    const postsWithDates = posts.map(post => ({
      ...post,
      postDate: this.parseRelativeDate(post.dateText)
    }))

    return postsWithDates
  }

  private parseRelativeDate(dateText: string): Date {
    const now = new Date()
    
    // Handle relative dates like "12시간 전", "2일 전"
    if (dateText.includes('시간 전')) {
      const hours = parseInt(dateText.match(/(\d+)시간 전/)?.[1] || '0')
      now.setHours(now.getHours() - hours)
      return now
    }
    
    if (dateText.includes('분 전')) {
      const minutes = parseInt(dateText.match(/(\d+)분 전/)?.[1] || '0')
      now.setMinutes(now.getMinutes() - minutes)
      return now
    }
    
    if (dateText.includes('일 전')) {
      const days = parseInt(dateText.match(/(\d+)일 전/)?.[1] || '0')
      now.setDate(now.getDate() - days)
      return now
    }
    
    // Handle absolute dates like "2025.08.04"
    const absoluteMatch = dateText.match(/(\d{4})\.(\d{2})\.(\d{2})/)
    if (absoluteMatch) {
      const [_, year, month, day] = absoluteMatch
      return new Date(`${year}-${month}-${day}`)
    }
    
    // Handle time format like "16:45"
    const timeMatch = dateText.match(/(\d{2}):(\d{2})/)
    if (timeMatch) {
      const [_, hour, minute] = timeMatch
      const date = new Date()
      date.setHours(parseInt(hour))
      date.setMinutes(parseInt(minute))
      return date
    }
    
    return now
  }

  private convertToHotDeal(post: QuasarzonePost): HotDeal {
    const isFreeShipping = post.shippingInfo?.includes('무료') || post.shippingInfo?.includes('0') || false
    const status = post.status === '종료' ? 'expired' : 'active'
    
    return {
      id: '',
      source: 'quasarzone',
      source_id: post.postNumber,
      category: post.category || '기타',
      title: post.title,
      description: null,
      original_price: post.price || 0,
      sale_price: post.price || 0,
      discount_rate: 0,
      seller: post.store || '퀘이사존',
      original_url: post.url.startsWith('http') ? post.url : `https://quasarzone.com${post.url}`,
      thumbnail_url: '',
      image_url: '',
      is_free_shipping: isFreeShipping,
      status,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: post.views,
      comment_count: post.commentCount,
      like_count: post.recommendCount,
      author_name: post.author,
      shopping_comment: '',
      created_at: post.postDate.toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
  }

  protected getSourceName(): string {
    return '퀘이사존'
  }
}