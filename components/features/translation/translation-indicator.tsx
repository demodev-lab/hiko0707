'use client'

import { Globe, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Translation, Language } from '@/types/hotdeal'
import { cn } from '@/lib/utils'

interface TranslationIndicatorProps {
  status: Translation['status']
  language?: Language
  className?: string
  showLabel?: boolean
}

export function TranslationIndicator({ 
  status, 
  language,
  className,
  showLabel = true 
}: TranslationIndicatorProps) {
  const config = {
    pending: {
      icon: Clock,
      label: '번역 대기중',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      animate: false
    },
    translating: {
      icon: Loader2,
      label: '번역 중...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      animate: true
    },
    completed: {
      icon: CheckCircle,
      label: '번역 완료',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      animate: false
    },
    failed: {
      icon: XCircle,
      label: '번역 실패',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      animate: false
    }
  }

  const { icon: Icon, label, color, bgColor, borderColor, animate } = config[status]

  const content = (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 px-2 py-0.5',
        bgColor,
        borderColor,
        color,
        className
      )}
    >
      <Icon 
        className={cn(
          'w-3 h-3',
          animate && 'animate-spin'
        )} 
      />
      {showLabel && <span className="text-xs">{label}</span>}
    </Badge>
  )

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p>{label} {language && `(${language.toUpperCase()})`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}