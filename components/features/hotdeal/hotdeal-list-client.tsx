'use client'

import { useHotDeals } from '@/hooks/use-hotdeals'
import { HotDealCard } from './hotdeal-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { HotDeal, HotDealCategory } from '@/types/hotdeal'
import { useLanguage } from '@/lib/i18n/context'

interface HotDealListClientProps {
  initialData: {
    items: HotDeal[]
    total: number
    page: number
    totalPages: number
  }
  category?: string
  sort?: string
  page: number
}

export function HotDealListClient({ 
  initialData, 
  category, 
  sort, 
  page 
}: HotDealListClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  
  // 클라이언트 사이드에서 데이터 페칭 (초기 데이터 사용)
  const { hotdeals, total, totalPages, currentPage, isLoading } = useHotDeals(
    category as HotDealCategory | undefined,
    page,
    20
  )

  // 서버에서 가져온 초기 데이터를 우선 사용
  const displayHotdeals = hotdeals.length > 0 ? hotdeals : initialData.items
  const displayTotal = total || initialData.total
  const displayTotalPages = totalPages || initialData.totalPages
  const displayCurrentPage = currentPage || initialData.page

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (sort) params.set('sort', sort)
    params.set('page', newPage.toString())
    router.push(`/hotdeals?${params.toString()}`)
  }

  if (isLoading && displayHotdeals.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* 결과 정보 */}
      <div className="mb-4 text-sm text-gray-600">
        {displayTotal} {t('hotdeals.title')}
      </div>

      {/* 핫딜 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayHotdeals.map((deal) => (
          <HotDealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {displayTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(displayCurrentPage - 1)}
            disabled={displayCurrentPage === 1}
          >
            {t('common.previous') || '이전'}
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === displayCurrentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            {displayTotalPages > 5 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant={displayTotalPages === displayCurrentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(displayTotalPages)}
                >
                  {displayTotalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(displayCurrentPage + 1)}
            disabled={displayCurrentPage === displayTotalPages}
          >
            {t('common.next') || '다음'}
          </Button>
        </div>
      )}

      {/* 결과가 없을 때 */}
      {displayHotdeals.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('common.noResults')}</p>
        </div>
      )}
    </div>
  )
}