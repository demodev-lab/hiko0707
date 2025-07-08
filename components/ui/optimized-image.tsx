'use client'

import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  showLoader?: boolean
  containerClassName?: string
  onLoadComplete?: () => void
  onError?: () => void
  lazy?: boolean
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  showLoader = true,
  containerClassName,
  className,
  onLoadComplete,
  onError,
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [inView, setInView] = useState(!lazy)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px 0px', // Load images 100px before they're visible
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, inView])

  const handleLoad = () => {
    setLoading(false)
    onLoadComplete?.()
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
      setError(false)
    } else {
      onError?.()
    }
  }

  // Generate blur data URL for placeholder
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", containerClassName)}>
      {/* Loading placeholder */}
      {loading && showLoader && inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error fallback */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded" />
            <span className="text-xs">이미지를 불러올 수 없습니다</span>
          </div>
        </div>
      )}

      {/* Lazy loading placeholder */}
      {!inView && lazy && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      {/* Actual image */}
      {inView && (
        <Image
          {...props}
          src={imageSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          placeholder="blur"
          blurDataURL={blurDataURL}
          loading={lazy ? "lazy" : "eager"}
          quality={85} // Optimize for file size vs quality
        />
      )}
    </div>
  )
}

// Specialized component for hotdeal cards
export function HotDealImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'sizes'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      {...props}
    />
  )
}

// Specialized component for avatars
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> & {
  size?: number
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      sizes={`${size}px`}
      {...props}
    />
  )
}