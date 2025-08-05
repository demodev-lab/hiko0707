'use client'

import { useState, useEffect, useRef } from 'react'
import { HotDeal } from '@/types/hotdeal'
import { HotDealCard } from './hotdeal-card'
import { useKeyboardNavigation, useScreenReader } from '@/hooks/use-keyboard-navigation'
import { LiveRegion } from '@/components/common/screen-reader-only'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface AccessibleHotDealListProps {
  deals: HotDeal[]
  loading?: boolean
  className?: string
  itemsPerPage?: number
  enableKeyboardNavigation?: boolean
}

export function AccessibleHotDealList({
  deals,
  loading = false,
  className,
  itemsPerPage = 12,
  enableKeyboardNavigation = true
}: AccessibleHotDealListProps) {
  const { t } = useLanguage()
  const { announce } = useScreenReader()
  const [currentPage, setCurrentPage] = useState(0)
  const [announceText, setAnnounceText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  
  const totalPages = Math.ceil(deals.length / itemsPerPage)
  const currentDeals = deals.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const {
    currentIndex,
    isActive,
    focus,
    reset
  } = useKeyboardNavigation(currentDeals.length, {
    enableArrowKeys: enableKeyboardNavigation,
    onNavigate: (direction, index) => {
      if (index !== undefined && currentDeals[index]) {
        const deal = currentDeals[index]
        setAnnounceText(`${deal.title}, ${t('hotdeals.price')}: ${deal.sale_price}원`)
        
        // 포커스를 해당 카드로 이동
        const cardElement = document.querySelector(`[aria-labelledby="deal-title-${deal.id}"]`)
        if (cardElement) {
          (cardElement as HTMLElement).focus()
        }
      }
    },
    onActivate: (index) => {
      if (currentDeals[index]) {
        const deal = currentDeals[index]
        window.location.href = `/hotdeals/${deal.id}`
      }
    }
  })

  // 페이지 변경 시 상태 초기화
  useEffect(() => {
    reset()
    setAnnounceText(
      `총 ${deals.length}개 중 ${currentDeals.length}개 표시 (${currentPage + 1}/${totalPages} 페이지)`
    )
  }, [currentPage, deals.length, currentDeals.length, totalPages, reset])

  // 로딩 상태 변경 시 알림
  useEffect(() => {
    if (loading) {
      announce(t('accessibility.loading'))
    } else if (deals.length === 0) {
      announce(t('accessibility.noResults'))
    } else {
      announce(
        `${deals.length}개의 핫딜이 로드되었습니다. 키보드 화살표 키로 탐색하고 엔터 키로 선택할 수 있습니다.`
      )
    }
  }, [loading, deals.length, announce, t])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
      // 새 페이지 로드 후 첫 번째 아이템에 포커스
      setTimeout(() => {
        const firstCard = listRef.current?.querySelector('[role="article"]') as HTMLElement
        if (firstCard) {
          firstCard.focus()
          focus(0)
        }
      }, 100)
    }
  }

  if (loading) {
    return (
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        aria-live="polite"
        aria-label={t('accessibility.loading')}
      >
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"
            role="img"
            aria-label={`${t('accessibility.loading')} ${index + 1}`}
          />
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div 
        className="text-center py-12"
        role="status"
        aria-live="polite"
      >
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {t('hotdeals.noResults')}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 스크린 리더용 라이브 리전 */}
      <LiveRegion priority="polite">
        {announceText}
      </LiveRegion>

      {/* 검색 결과 요약 */}
      <div 
        className="text-sm text-gray-600 dark:text-gray-400 mb-4"
        aria-live="polite"
        role="status"
      >
        총 {deals.length}개의 핫딜 중 {currentDeals.length}개 표시
        {totalPages > 1 && ` (${currentPage + 1}/${totalPages} 페이지)`}
      </div>

      {/* 키보드 네비게이션 안내 */}
      {enableKeyboardNavigation && (
        <div className="sr-only" aria-live="polite">
          화살표 키로 핫딜을 탐색하고, 엔터 키나 스페이스 키로 선택할 수 있습니다.
        </div>
      )}

      {/* 핫딜 그리드 */}
      <div 
        ref={listRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        role="grid"
        aria-label="핫딜 목록"
        tabIndex={enableKeyboardNavigation ? 0 : -1}
        onFocus={() => enableKeyboardNavigation && focus(0)}
        onBlur={reset}
      >
        {currentDeals.map((deal, index) => (
          <div
            key={deal.id}
            role="gridcell"
            tabIndex={enableKeyboardNavigation ? (currentIndex === index ? 0 : -1) : 0}
            className={cn(
              'focus:outline-none',
              currentIndex === index && isActive && 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
            )}
          >
            <HotDealCard deal={deal} />
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav 
          aria-label="핫딜 목록 페이지네이션"
          className="flex justify-center items-center space-x-2 mt-8"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            )}
            aria-label="이전 페이지"
          >
            이전
          </button>

          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                currentPage === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              )}
              aria-label={`${index + 1}페이지`}
              aria-current={currentPage === index ? 'page' : undefined}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              currentPage === totalPages - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            )}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  )
}