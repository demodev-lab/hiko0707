'use client'

import { useState } from 'react'
import { Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TranslationIndicator } from './translation-indicator'
import { useTranslationStatus } from '@/hooks/use-supabase-translations'
import { Language } from '@/types/hotdeal'
import { cn } from '@/lib/utils'

interface TranslationStatusPanelProps {
  hotDealId: string
  className?: string
  compact?: boolean
}

const languageLabels: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
  mn: 'Монгол',
  th: 'ไทย',
  ja: '日本語',
  ru: 'Русский'
}

export function TranslationStatusPanel({ 
  hotDealId, 
  className,
  compact = false 
}: TranslationStatusPanelProps) {
  const [isOpen, setIsOpen] = useState(!compact)
  const { data: translationStatus, isLoading } = useTranslationStatus(hotDealId)

  if (isLoading || !translationStatus) {
    return null
  }

  // 번역 가능한 언어 목록 (한국어 제외)
  const supportedLanguages: Language[] = ['en', 'zh', 'vi', 'mn', 'th', 'ja', 'ru']
  const languages = Object.keys(translationStatus) as Language[]
  const completedCount = languages.length // 존재하는 번역 수
  const totalCount = supportedLanguages.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const hasTranslations = languages.length > 0

  if (!hasTranslations) {
    return null // 번역이 하나도 시작되지 않았으면 표시하지 않음
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">번역 상태</span>
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {completedCount}/{totalCount}
              </Badge>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-3">
              {/* 전체 진행률 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>전체 진행률</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* 각 언어별 상태 */}
              <div className="grid grid-cols-2 gap-2">
                {supportedLanguages
                  .map(lang => (
                    <div
                      key={lang}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-xs font-medium">{languageLabels[lang]}</span>
                      <TranslationIndicator
                        status={translationStatus[lang] ? 'completed' : 'pending'}
                        language={lang}
                        showLabel={false}
                      />
                    </div>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode
  variant?: 'default' | 'secondary'
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      variant === 'secondary' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      className
    )}>
      {children}
    </span>
  )
}