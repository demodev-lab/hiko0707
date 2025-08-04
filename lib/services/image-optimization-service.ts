'use client'

import { COMMUNITY_CONFIGS } from '@/lib/crawlers/community-configs'
import { HotDealSource } from '@/types/hotdeal'

/**
 * 이미지 최적화 및 CDN 관리 서비스
 */
export class ImageOptimizationService {
  private static readonly DEFAULT_IMAGE_QUALITY = 85
  private static readonly THUMBNAIL_SIZE = { width: 400, height: 320 }
  private static readonly PROXY_ENDPOINT = '/api/image-proxy'
  
  // 허용된 이미지 도메인 목록 (next.config.js와 동기화)
  private static readonly ALLOWED_DOMAINS = [
    // 플레이스홀더 서비스
    'picsum.photos',
    'images.unsplash.com',
    'via.placeholder.com',
    'placeholder.com',
    'placehold.co',
    
    // 핫딜 커뮤니티
    'cdn2.ppomppu.co.kr',
    'cdn.ppomppu.co.kr',
    'bbs.ruliweb.com',
    'img.ruliweb.com',
    'www.clien.net',
    'cdn.clien.net',
    'quasarzone.com',
    'cdn.quasarzone.com',
    'coolenjoy.net',
    'cdn.coolenjoy.net',
    'eomisae.co.kr',
    'cdn.eomisae.co.kr',
    'zod.kr',
    'cdn.zod.kr',
    'www.algumon.com',
    'cdn.algumon.com',
    'www.itcm.co.kr',
    'cdn.itcm.co.kr',
    
    // 쇼핑몰 CDN
    'thumbnail.coupangcdn.com',
    'image.coupangcdn.com',
    'gdimg.gmarket.co.kr',
    'image.gmarket.co.kr',
    'pic.auction.co.kr',
    'cdn.011st.com',
    'image.011st.com',
    'shopping-phinf.pstatic.net',
    'shop-phinf.pstatic.net',
    
    // 일반 CDN 패턴
    '.cloudfront.net',
    '.amazonaws.com',
    '.googleusercontent.com'
  ]

  /**
   * 이미지 URL 최적화
   */
  static optimizeImageUrl(src: string, options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  }): string {
    if (!src) return ''
    
    // 로컬 이미지는 그대로 반환
    if (src.startsWith('/') || src.startsWith('./')) {
      return src
    }

    try {
      const url = new URL(src)
      const hostname = url.hostname

      // 허용된 도메인인지 확인
      const isAllowed = this.ALLOWED_DOMAINS.some(domain => {
        if (domain.startsWith('.')) {
          return hostname.endsWith(domain)
        }
        return hostname === domain || hostname.endsWith('.' + domain)
      })

      // 허용되지 않은 도메인은 프록시 사용
      if (!isAllowed) {
        return this.getProxyUrl(src, options)
      }

      // Next.js Image Optimization 파라미터 추가
      if (options) {
        const params = new URLSearchParams()
        if (options.width) params.set('w', options.width.toString())
        if (options.height) params.set('h', options.height.toString())
        if (options.quality) params.set('q', options.quality.toString())
        
        const queryString = params.toString()
        if (queryString) {
          const separator = src.includes('?') ? '&' : '?'
          return `${src}${separator}${queryString}`
        }
      }

      return src
    } catch (error) {
      console.warn('이미지 URL 최적화 실패:', error)
      return src
    }
  }

  /**
   * 프록시 URL 생성 (허용되지 않은 도메인용)
   */
  private static getProxyUrl(originalUrl: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): string {
    const params = new URLSearchParams()
    params.set('url', originalUrl)
    
    if (options?.width) params.set('w', options.width.toString())
    if (options?.height) params.set('h', options.height.toString())
    if (options?.quality) params.set('q', options.quality.toString())

    return `${this.PROXY_ENDPOINT}?${params.toString()}`
  }

  /**
   * 반응형 이미지 크기 계산
   */
  static calculateResponsiveSizes(
    originalWidth: number,
    originalHeight: number,
    breakpoints: { 
      mobile: number
      tablet: number
      desktop: number 
    } = {
      mobile: 320,
      tablet: 768,
      desktop: 1200
    }
  ): {
    sizes: string
    srcSet: Array<{ width: number; height: number }>
  } {
    const aspectRatio = originalWidth / originalHeight
    
    const srcSet = [
      { 
        width: breakpoints.mobile, 
        height: Math.round(breakpoints.mobile / aspectRatio) 
      },
      { 
        width: breakpoints.tablet, 
        height: Math.round(breakpoints.tablet / aspectRatio) 
      },
      { 
        width: breakpoints.desktop, 
        height: Math.round(breakpoints.desktop / aspectRatio) 
      }
    ]

    const sizes = [
      `(max-width: ${breakpoints.mobile}px) ${breakpoints.mobile}px`,
      `(max-width: ${breakpoints.tablet}px) ${breakpoints.tablet}px`,
      `${breakpoints.desktop}px`
    ].join(', ')

    return { sizes, srcSet }
  }

  /**
   * 커뮤니티별 기본 fallback 이미지 URL
   */
  static getFallbackImageUrl(source: HotDealSource): string {
    const config = COMMUNITY_CONFIGS[source]
    const communityName = config?.displayName || source
    
    // 커뮤니티별 브랜드 컬러를 이용한 placeholder
    const colors = {
      ppomppu: { bg: '4F46E5', text: 'FFFFFF' },
      ruliweb: { bg: 'DC2626', text: 'FFFFFF' },
      clien: { bg: '059669', text: 'FFFFFF' },
      quasarzone: { bg: 'EA580C', text: 'FFFFFF' },
      coolenjoy: { bg: '7C3AED', text: 'FFFFFF' },
      eomisae: { bg: 'DB2777', text: 'FFFFFF' },
      zod: { bg: '0891B2', text: 'FFFFFF' },
      algumon: { bg: 'B91C1C', text: 'FFFFFF' },
      itcm: { bg: '166534', text: 'FFFFFF' }
    }
    
    const color = colors[source] || { bg: '6B7280', text: 'FFFFFF' }
    const encodedText = encodeURIComponent(communityName)
    
    return `https://placehold.co/400x320/${color.bg}/${color.text}?text=${encodedText}`
  }

  /**
   * 이미지 로딩 성능 모니터링
   */
  static monitorImagePerformance(
    imageUrl: string,
    loadTime: number,
    success: boolean,
    fallbackUsed: boolean = false
  ): void {
    // 성능 데이터 수집 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ 이미지 성능 모니터링:', {
        url: imageUrl,
        loadTime: `${loadTime}ms`,
        success,
        fallbackUsed,
        timestamp: new Date().toISOString()
      })
    }

    // 실제 운영 환경에서는 분석 서비스로 전송
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Google Analytics 4 또는 기타 분석 도구로 전송
      if ('gtag' in window) {
        (window as any).gtag('event', 'image_load', {
          event_category: 'performance',
          event_label: success ? 'success' : 'failed',
          value: Math.round(loadTime),
          custom_parameters: {
            fallback_used: fallbackUsed,
            image_domain: new URL(imageUrl).hostname
          }
        })
      }
    }
  }

  /**
   * 이미지 프리로딩
   */
  static preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const startTime = performance.now()

      img.onload = () => {
        const loadTime = performance.now() - startTime
        this.monitorImagePerformance(src, loadTime, true, false)
        resolve()
      }

      img.onerror = () => {
        const loadTime = performance.now() - startTime
        this.monitorImagePerformance(src, loadTime, false, false)
        reject(new Error(`Failed to preload image: ${src}`))
      }

      // 우선순위에 따른 로딩 설정
      if (priority === 'high') {
        img.loading = 'eager'
      }

      img.src = this.optimizeImageUrl(src, this.THUMBNAIL_SIZE)
    })
  }

  /**
   * 여러 이미지 배치 프리로딩
   */
  static async preloadImages(
    urls: string[], 
    options?: { 
      concurrency?: number
      priority?: 'high' | 'low'
    }
  ): Promise<void> {
    const { concurrency = 3, priority = 'low' } = options || {}
    
    const chunks = []
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.preloadImage(url, priority))
      )
    }
  }

  /**
   * 이미지 캐시 정리 (브라우저 캐시 관리)
   */
  static clearImageCache(): void {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('images') || cacheName.includes('next-image')) {
            caches.delete(cacheName)
          }
        })
      })
    }
  }

  /**
   * 이미지 메타데이터 추출
   */
  static async getImageMetadata(src: string): Promise<{
    width: number
    height: number
    format: string
    size?: number
  } | null> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            format: this.detectImageFormat(src),
          })
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image for metadata extraction'))
        }
        
        img.src = src
      })
    } catch (error) {
      console.warn('이미지 메타데이터 추출 실패:', error)
      return null
    }
  }

  /**
   * 이미지 포맷 감지
   */
  private static detectImageFormat(src: string): string {
    const url = src.toLowerCase()
    if (url.includes('.webp') || url.includes('format=webp')) return 'webp'
    if (url.includes('.avif') || url.includes('format=avif')) return 'avif'
    if (url.includes('.png') || url.includes('format=png')) return 'png'
    if (url.includes('.gif') || url.includes('format=gif')) return 'gif'
    if (url.includes('.svg') || url.includes('format=svg')) return 'svg'
    return 'jpeg' // 기본값
  }

  /**
   * WebP 지원 여부 확인
   */
  static isWebPSupported(): boolean {
    if (typeof window === 'undefined') return false
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
  }

  /**
   * AVIF 지원 여부 확인
   */
  static isAVIFSupported(): boolean {
    if (typeof window === 'undefined') return false
    
    return new Promise((resolve) => {
      const avif = new Image()
      avif.onload = avif.onerror = () => resolve(avif.height === 2)
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    }).catch(() => false)
  }

  /**
   * 최적 이미지 포맷 선택
   */
  static getOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.isAVIFSupported()) return 'avif'
    if (this.isWebPSupported()) return 'webp'
    return 'jpeg'
  }
}