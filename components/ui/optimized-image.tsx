'use client'

import { useState, useCallback, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  showLoader?: boolean
  blurDataURL?: string
  className?: string
  containerClassName?: string
  onLoadComplete?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = 'https://via.placeholder.com/400x300/f3f4f6/6b7280?text=이미지+없음',
  showLoader = true,
  blurDataURL,
  className,
  containerClassName,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // src가 변경되면 상태 초기화
  useEffect(() => {
    setCurrentSrc(src)
    setIsLoading(true)
    setHasError(false)
  }, [src])

  const handleLoad = useCallback(() => {
    console.log('✅ Image loaded successfully:', currentSrc, { alt, width: props.width, height: props.height })
    setIsLoading(false)
    onLoadComplete?.()
  }, [onLoadComplete, currentSrc, alt, props.width, props.height])

  const handleError = useCallback(() => {
    console.log('❌ Image failed to load:', currentSrc)
    console.log('❌ Image error details:', {
      src: currentSrc,
      alt,
      fallbackSrc,
      hasError
    })
    setIsLoading(false)
    setHasError(true)
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.log('🔄 Trying fallback image:', fallbackSrc)
      setCurrentSrc(fallbackSrc)
      setHasError(false)
    }
    onError?.()
  }, [fallbackSrc, currentSrc, onError, alt, hasError])

  // 기본 blur placeholder 생성
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL()

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <Image
        {...props}
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading && showLoader ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL={defaultBlurDataURL}
        priority={props.priority}
        quality={props.quality || 85}
        sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        unoptimized={currentSrc.startsWith('/images/')}
      />
      
      {/* 로딩 스켈레톤 */}
      {isLoading && showLoader && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 에러 상태 */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      )}
    </div>
  )
}

// 기본 blur placeholder 생성 함수
function generateBlurDataURL(): string {
  // 10x10 픽셀의 회색 이미지를 base64로 인코딩
  const svg = `
    <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="#f3f4f6"/>
    </svg>
  `
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// 이미지 포맷 최적화를 위한 헬퍼 함수
export function getOptimizedImageUrl(src: string, options?: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
}): string {
  if (!src) return src
  
  // 외부 URL인 경우 그대로 반환
  if (src.startsWith('http') || src.startsWith('//')) {
    return src
  }
  
  // Next.js Image Optimization API 사용
  const params = new URLSearchParams()
  if (options?.width) params.set('w', options.width.toString())
  if (options?.height) params.set('h', options.height.toString())
  if (options?.quality) params.set('q', options.quality.toString())
  if (options?.format) params.set('f', options.format)
  
  const queryString = params.toString()
  return queryString ? `${src}?${queryString}` : src
}

// 이미지 사이즈 계산 헬퍼
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight
  let width = Math.min(originalWidth, maxWidth)
  let height = width / aspectRatio
  
  if (maxHeight && height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}