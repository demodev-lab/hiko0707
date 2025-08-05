'use client'

import { useHotDealTranslation } from '@/hooks/use-supabase-translations'
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
    const content = field === 'productComment' ? hotDeal.productComment : 
                    field === 'title' ? hotDeal.title : 
                    field === 'description' ? hotDeal.productComment : ''
    return <span className={className}>{content}</span>
  }
  
  // 번역 로딩 중
  if (isLoading) {
    return fallback || <Skeleton className="h-4 w-full" />
  }
  
  // 번역이 없는 경우 원본 표시
  if (!translation) {
    const content = field === 'productComment' ? hotDeal.productComment : 
                    field === 'title' ? hotDeal.title : 
                    field === 'description' ? hotDeal.productComment : ''
    return (
      <div className="space-y-1">
        <span className={className}>{content}</span>
        {showIndicator && (
          <TranslationIndicator 
            status="pending" 
            language={language}
            className="inline-flex ml-2"
          />
        )}
      </div>
    )
  }
  
  // 번역 완료 - Supabase에서는 번역이 있으면 항상 완료 상태
  const translatedContent = field === 'title' ? translation.title :
                          field === 'description' || field === 'productComment' ? translation.description :
                          ''
  const originalContent = field === 'productComment' ? hotDeal.productComment : 
                          field === 'title' ? hotDeal.title : 
                          field === 'description' ? hotDeal.productComment : ''
  
  return (
    <div className="space-y-1">
      <span className={className}>
        {translatedContent || originalContent}
      </span>
      {showIndicator && translation.is_auto_translated && (
        <TranslationIndicator 
          status="completed" 
          language={language}
          className="inline-flex ml-2"
        />
      )}
    </div>
  )
}