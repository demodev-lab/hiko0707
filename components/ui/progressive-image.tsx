'use client'

import { useState, useEffect, useRef } from 'react'
import { OptimizedImage } from './optimized-image'
import { cn } from '@/lib/utils'

interface ProgressiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  containerClassName?: string
  lowQualitySrc?: string
  blurAmount?: number
  sizes?: string
  priority?: boolean
  onLoad?: () => void
}

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  lowQualitySrc,
  blurAmount = 20,
  sizes,
  priority = false,
  onLoad
}: ProgressiveImageProps) {
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false)
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const containerRef = useRef<HTMLDivElement>(null)

  // 저화질 이미지 URL 생성
  const lowQuality = lowQualitySrc || generateLowQualityUrl(src)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [priority])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width, height }}
    >
      {isInView && (
        <>
          {/* 저화질 이미지 (빠른 로딩) */}
          <OptimizedImage
            src={lowQuality}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              isLowQualityLoaded && !isHighQualityLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            style={{
              filter: `blur(${blurAmount}px)`,
              transform: 'scale(1.1)', // blur로 인한 가장자리 효과 방지
            }}
            priority={priority}
            quality={20}
            sizes={sizes}
            onLoadComplete={() => setIsLowQualityLoaded(true)}
            showLoader={false}
          />

          {/* 고화질 이미지 (점진적 로딩) */}
          <OptimizedImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              isHighQualityLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            priority={priority}
            quality={85}
            sizes={sizes}
            onLoadComplete={() => {
              setIsHighQualityLoaded(true)
              onLoad?.()
            }}
            showLoader={!isLowQualityLoaded}
          />
        </>
      )}

      {/* 로딩 플레이스홀더 */}
      {!isInView && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  )
}

// 저화질 이미지 URL 생성
function generateLowQualityUrl(src: string): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  // Next.js Image Optimization API 사용
  const url = new URL(src, window.location.origin)
  url.searchParams.set('q', '20') // 저화질 설정
  url.searchParams.set('w', '40') // 작은 크기
  
  return url.toString()
}

// LQIP (Low Quality Image Placeholder) 생성기
export function generateLQIP(src: string, width = 40, height = 40): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    canvas.width = width
    canvas.height = height

    img.onload = () => {
      // 이미지를 작은 크기로 그리기
      ctx.drawImage(img, 0, 0, width, height)
      
      // Base64 데이터 URL로 변환
      const dataURL = canvas.toDataURL('image/jpeg', 0.1)
      resolve(dataURL)
    }

    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

// WebP 지원 여부 확인 유틸리티
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// AVIF 지원 여부 확인 유틸리티
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}