'use client'

import { useEffect, useCallback, useRef } from 'react'
import { ImageOptimizationService } from '@/lib/services/image-optimization-service'

/**
 * 이미지 배치 프리로딩을 위한 Hook
 */
export function useImagePreloader() {
  const preloadQueueRef = useRef<Set<string>>(new Set())
  const isProcessingRef = useRef(false)

  /**
   * 이미지 URL 배열을 프리로드 큐에 추가
   */
  const addToPreloadQueue = useCallback((urls: string[], priority: 'high' | 'low' = 'low') => {
    urls.forEach(url => {
      if (url && !preloadQueueRef.current.has(url)) {
        preloadQueueRef.current.add(url)
      }
    })

    // 즉시 처리 시작
    processPreloadQueue(priority)
  }, [])

  /**
   * 프리로드 큐 처리
   */
  const processPreloadQueue = useCallback(async (priority: 'high' | 'low' = 'low') => {
    if (isProcessingRef.current || preloadQueueRef.current.size === 0) {
      return
    }

    isProcessingRef.current = true
    const urls = Array.from(preloadQueueRef.current)
    preloadQueueRef.current.clear()

    try {
      await ImageOptimizationService.preloadImages(urls, {
        concurrency: priority === 'high' ? 5 : 3,
        priority
      })
    } catch (error) {
      console.warn('이미지 배치 프리로딩 중 일부 실패:', error)
    } finally {
      isProcessingRef.current = false
    }
  }, [])

  /**
   * 가시성 기반 이미지 프리로딩 (Intersection Observer)
   */
  const preloadOnVisible = useCallback((
    imageUrls: string[],
    targetElement: Element | null,
    options?: {
      rootMargin?: string
      threshold?: number
      priority?: 'high' | 'low'
    }
  ) => {
    if (!targetElement || !('IntersectionObserver' in window)) {
      return () => {}
    }

    const {
      rootMargin = '50px',
      threshold = 0.1,
      priority = 'low'
    } = options || {}

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            addToPreloadQueue(imageUrls, priority)
            observer.unobserve(targetElement)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(targetElement)

    return () => {
      observer.unobserve(targetElement)
      observer.disconnect()
    }
  }, [addToPreloadQueue])

  /**
   * 네트워크 상태 기반 프리로딩 전략
   */
  const preloadWithNetworkAwareness = useCallback((urls: string[]) => {
    if (!('navigator' in window) || !('connection' in navigator)) {
      // 네트워크 정보를 알 수 없으면 기본 설정으로
      addToPreloadQueue(urls, 'low')
      return
    }

    const connection = (navigator as any).connection
    const { effectiveType, downlink, saveData } = connection

    // 데이터 절약 모드일 때는 프리로딩 하지 않음
    if (saveData) {
      console.log('📱 Data saver mode detected, skipping image preload')
      return
    }

    // 네트워크 상태에 따른 전략 조정
    let priority: 'high' | 'low' = 'low'
    let shouldPreload = true

    switch (effectiveType) {
      case '4g':
        priority = downlink > 10 ? 'high' : 'low'
        break
      case '3g':
        priority = 'low'
        break
      case '2g':
      case 'slow-2g':
        shouldPreload = false
        break
    }

    if (shouldPreload) {
      addToPreloadQueue(urls, priority)
    } else {
      console.log('🐌 Slow network detected, skipping image preload')
    }
  }, [addToPreloadQueue])

  /**
   * 스크롤 기반 적응형 프리로딩
   */
  const preloadOnScroll = useCallback((
    getImageUrls: () => string[],
    options?: {
      throttleMs?: number
      distanceThreshold?: number
    }
  ) => {
    const { throttleMs = 200, distanceThreshold = 500 } = options || {}
    
    let isThrottled = false
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      if (isThrottled) return

      isThrottled = true
      setTimeout(() => {
        isThrottled = false
      }, throttleMs)

      const currentScrollY = window.scrollY
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up'
      const scrollDistance = Math.abs(currentScrollY - lastScrollY)

      lastScrollY = currentScrollY

      // 아래로 스크롤하고 임계값을 넘었을 때만 프리로드
      if (scrollDirection === 'down' && scrollDistance > distanceThreshold) {
        const urls = getImageUrls()
        preloadWithNetworkAwareness(urls)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [preloadWithNetworkAwareness])

  /**
   * 마우스 호버 시 프리로딩
   */
  const preloadOnHover = useCallback((
    element: Element | null,
    imageUrls: string[],
    priority: 'high' | 'low' = 'high'
  ) => {
    if (!element) return () => {}

    const handleMouseEnter = () => {
      addToPreloadQueue(imageUrls, priority)
    }

    element.addEventListener('mouseenter', handleMouseEnter, { once: true })

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [addToPreloadQueue])

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      preloadQueueRef.current.clear()
      isProcessingRef.current = false
    }
  }, [])

  return {
    addToPreloadQueue,
    preloadOnVisible,
    preloadWithNetworkAwareness,
    preloadOnScroll,
    preloadOnHover,
    queueSize: preloadQueueRef.current.size,
    isProcessing: isProcessingRef.current
  }
}

/**
 * HOT 딜 목록용 특화된 이미지 프리로딩 Hook
 */
export function useHotDealImagePreloader() {
  const imagePreloader = useImagePreloader()

  /**
   * HOT 딜 목록의 이미지들을 스마트하게 프리로드
   */
  const preloadHotDealImages = useCallback((
    deals: Array<{ originalImageUrl?: string; isHot?: boolean; ranking?: number }>,
    strategy: 'priority' | 'lazy' | 'network-aware' = 'network-aware'
  ) => {
    const imageUrls = deals
      .filter(deal => deal.originalImageUrl)
      .map(deal => deal.originalImageUrl!)

    if (imageUrls.length === 0) return

    switch (strategy) {
      case 'priority':
        // HOT 딜과 상위 랭킹 우선
        const priorityUrls = deals
          .filter(deal => deal.originalImageUrl && (deal.isHot || (deal.ranking && deal.ranking <= 10)))
          .map(deal => deal.originalImageUrl!)
        
        const normalUrls = deals
          .filter(deal => deal.originalImageUrl && !deal.isHot && (!deal.ranking || deal.ranking > 10))
          .map(deal => deal.originalImageUrl!)

        if (priorityUrls.length > 0) {
          imagePreloader.addToPreloadQueue(priorityUrls, 'high')
        }
        if (normalUrls.length > 0) {
          imagePreloader.addToPreloadQueue(normalUrls, 'low')
        }
        break

      case 'lazy':
        imagePreloader.addToPreloadQueue(imageUrls, 'low')
        break

      case 'network-aware':
      default:
        imagePreloader.preloadWithNetworkAwareness(imageUrls)
        break
    }
  }, [imagePreloader])

  /**
   * 핫딜 카드 호버 시 상세 이미지 프리로드
   */
  const preloadOnHotDealHover = useCallback((
    cardElement: Element | null,
    detailImageUrls: string[]
  ) => {
    return imagePreloader.preloadOnHover(cardElement, detailImageUrls, 'high')
  }, [imagePreloader])

  return {
    ...imagePreloader,
    preloadHotDealImages,
    preloadOnHotDealHover
  }
}