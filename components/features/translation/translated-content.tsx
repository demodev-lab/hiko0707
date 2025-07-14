'use client'

import { useHotDealTranslation } from '@/hooks/use-translations'
import { TranslationIndicator } from './translation-indicator'
import { Skeleton } from '@/components/ui/skeleton'
import { HotDeal } from '@/types/hotdeal'
import { useLanguage } from '@/lib/i18n/context'

interface TranslatedContentProps {
  hotDeal: HotDeal
  field: 'title' | 'description' | 'productComment'
  className?: string
  showIndicator?: boolean
  fallback?: React.ReactNode
}

export function TranslatedContent({ 
  hotDeal, 
  field,
  className,
  showIndicator = true,
  fallback
}: TranslatedContentProps) {
  const { language } = useLanguage()
  const { data: translation, isLoading } = useHotDealTranslation(hotDeal.id)
  
  // 한국어는 원본 표시
  if (language === 'ko') {
    const content = field === 'productComment' ? hotDeal.productComment : hotDeal[field]
    return <span className={className}>{content}</span>
  }
  
  // 번역 로딩 중
  if (isLoading) {
    return fallback || <Skeleton className="h-4 w-full" />
  }
  
  // 번역이 없거나 대기/진행 중
  if (!translation || translation.status === 'pending' || translation.status === 'translating') {
    const content = field === 'productComment' ? hotDeal.productComment : hotDeal[field]
    return (
      <div className="space-y-1">
        <span className={className}>{content}</span>
        {showIndicator && (
          <TranslationIndicator 
            status={translation?.status || 'pending'} 
            language={language}
            className="inline-flex ml-2"
          />
        )}
      </div>
    )
  }
  
  // 번역 실패
  if (translation.status === 'failed') {
    const content = field === 'productComment' ? hotDeal.productComment : hotDeal[field]
    return (
      <div className="space-y-1">
        <span className={className}>{content}</span>
        {showIndicator && (
          <TranslationIndicator 
            status="failed" 
            language={language}
            className="inline-flex ml-2"
          />
        )}
      </div>
    )
  }
  
  // 번역 완료
  const translatedField = field === 'productComment' ? 'translatedProductComment' : field
  const originalContent = field === 'productComment' ? hotDeal.productComment : hotDeal[field]
  
  return (
    <div className="space-y-1">
      <span className={className}>
        {translation[translatedField] || originalContent}
      </span>
      {showIndicator && translation.status !== 'completed' && (
        <TranslationIndicator 
          status={translation.status} 
          language={language}
          className="inline-flex ml-2"
        />
      )}
    </div>
  )
}