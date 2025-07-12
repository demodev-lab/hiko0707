'use client'

import { useState, useEffect, useCallback } from 'react'

interface ImageOptimizationOptions {
  enableWebP?: boolean
  enableAVIF?: boolean
  quality?: number
  sizes?: string
  priority?: boolean
  lazy?: boolean
}

interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size?: number
  loading?: boolean
  error?: boolean
}

export function useImageOptimization(
  src: string,
  options: ImageOptimizationOptions = {}
) {
  const [metadata, setMetadata] = useState<ImageMetadata>({ loading: true })
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src)
  const [supportedFormats, setSupportedFormats] = useState<{
    webp: boolean
    avif: boolean
  }>({ webp: false, avif: false })

  // 브라우저가 지원하는 이미지 포맷 확인
  useEffect(() => {
    const checkFormatSupport = async () => {
      const webpSupport = await supportsImageFormat('webp')
      const avifSupport = await supportsImageFormat('avif')
      
      setSupportedFormats({
        webp: webpSupport,
        avif: avifSupport
      })
    }

    checkFormatSupport()
  }, [])

  // 이미지 메타데이터 로드
  useEffect(() => {
    if (!src) return

    setMetadata(prev => ({ ...prev, loading: true, error: false }))

    const img = new Image()
    
    img.onload = () => {
      setMetadata({
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: false,
        error: false
      })
    }

    img.onerror = () => {
      setMetadata(prev => ({
        ...prev,
        loading: false,
        error: true
      }))
    }

    img.src = src
  }, [src])

  // 최적화된 이미지 URL 생성
  useEffect(() => {
    if (!src) return

    let optimizedUrl = src
    const { enableWebP = true, enableAVIF = true, quality = 85 } = options

    // 최적 포맷 선택 (AVIF > WebP > 원본)
    if (enableAVIF && supportedFormats.avif) {
      optimizedUrl = getOptimizedUrl(src, { format: 'avif', quality })
    } else if (enableWebP && supportedFormats.webp) {
      optimizedUrl = getOptimizedUrl(src, { format: 'webp', quality })
    }

    setOptimizedSrc(optimizedUrl)
  }, [src, options, supportedFormats])

  const generateBlurDataURL = useCallback((): string => {
    // 색상 기반 blur placeholder 생성
    const colors = ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${randomColor}"/>
        <rect x="10" y="10" width="20" height="20" fill="#ffffff" opacity="0.3"/>
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }, [])

  const getResponsiveSizes = useCallback((breakpoints?: Record<string, string>): string => {
    const defaultBreakpoints = {
      sm: '100vw',
      md: '50vw',
      lg: '33vw',
      xl: '25vw'
    }

    const sizes = { ...defaultBreakpoints, ...breakpoints }
    
    return [
      `(max-width: 640px) ${sizes.sm}`,
      `(max-width: 768px) ${sizes.md}`,
      `(max-width: 1024px) ${sizes.lg}`,
      sizes.xl
    ].join(', ')
  }, [])

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  }, [])

  return {
    optimizedSrc,
    metadata,
    supportedFormats,
    generateBlurDataURL,
    getResponsiveSizes,
    preloadImage,
    isLoading: metadata.loading,
    hasError: metadata.error,
  }
}

// 이미지 포맷 지원 여부 확인
async function supportsImageFormat(format: 'webp' | 'avif'): Promise<boolean> {
  const testImages = {
    webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
    avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.width === 2 && img.height === 2)
    img.onerror = () => resolve(false)
    img.src = testImages[format]
  })
}

// 최적화된 URL 생성
function getOptimizedUrl(src: string, options: {
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
  width?: number
  height?: number
}): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  // 외부 URL인 경우 Next.js Image Optimization 사용
  if (src.startsWith('http') || src.startsWith('//')) {
    return src
  }

  const params = new URLSearchParams()
  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format) params.set('f', options.format)

  const queryString = params.toString()
  return queryString ? `${src}?${queryString}` : src
}

// Intersection Observer를 사용한 lazy loading hook
export function useLazyLoading(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref || !('IntersectionObserver' in window)) {
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, threshold])

  return { ref: setRef, isVisible: isIntersecting }
}