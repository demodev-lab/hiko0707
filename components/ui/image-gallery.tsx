'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { OptimizedImage } from './optimized-image'
import { ProgressiveImage } from './progressive-image'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    caption?: string
    thumbnail?: string
  }>
  currentIndex?: number
  showThumbnails?: boolean
  showCaption?: boolean
  enableZoom?: boolean
  enableDownload?: boolean
  className?: string
  onImageChange?: (index: number) => void
}

export function ImageGallery({
  images,
  currentIndex = 0,
  showThumbnails = true,
  showCaption = true,
  enableZoom = true,
  enableDownload = false,
  className,
  onImageChange
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const currentImage = images[activeIndex]

  useEffect(() => {
    setActiveIndex(currentIndex)
  }, [currentIndex])

  const handlePrevious = useCallback(() => {
    const newIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1
    setActiveIndex(newIndex)
    onImageChange?.(newIndex)
    setZoomLevel(1)
  }, [activeIndex, images.length, onImageChange])

  const handleNext = useCallback(() => {
    const newIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1
    setActiveIndex(newIndex)
    onImageChange?.(newIndex)
    setZoomLevel(1)
  }, [activeIndex, images.length, onImageChange])

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index)
    onImageChange?.(index)
    setZoomLevel(1)
  }, [onImageChange])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5))
  }, [])

  const handleDownload = useCallback(async () => {
    if (!currentImage || !enableDownload) return

    try {
      setIsLoading(true)
      const response = await fetch(currentImage.src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${activeIndex + 1}.${getFileExtension(currentImage.src)}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentImage, activeIndex, enableDownload])

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'Escape':
          e.preventDefault()
          setIsFullscreen(false)
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, handlePrevious, handleNext, handleZoomIn, handleZoomOut])

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">이미지가 없습니다</p>
      </div>
    )
  }

  return (
    <>
      <div className={cn('relative', className)}>
        {/* 메인 이미지 */}
        <div className="relative group">
          <ProgressiveImage
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-full h-auto cursor-zoom-in"
            containerClassName="aspect-[4/3] rounded-lg overflow-hidden"
            onLoad={() => setIsLoading(false)}
          />

          {/* 네비게이션 버튼 */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* 컨트롤 버튼 */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {enableZoom && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={() => setIsFullscreen(true)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            )}
            {enableDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={handleDownload}
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 이미지 카운터 */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* 캡션 */}
        {showCaption && currentImage.caption && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {currentImage.caption}
          </p>
        )}

        {/* 썸네일 */}
        {showThumbnails && images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                  index === activeIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleThumbnailClick(index)}
              >
                <OptimizedImage
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  quality={60}
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 풀스크린 모달 */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* 컨트롤 바 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 rounded-lg px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* 메인 이미지 */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] overflow-auto"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <OptimizedImage
              src={currentImage.src}
              alt={currentImage.alt}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              quality={95}
              priority
            />
          </div>

          {/* 네비게이션 버튼 */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const extension = pathname.split('.').pop()
    return extension || 'jpg'
  } catch {
    return 'jpg'
  }
}