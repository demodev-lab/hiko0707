'use client'

import { useState } from 'react'
import { HelpCircle, Play, RotateCcw, Book, MessageCircle } from 'lucide-react'
import { AccessibleButton } from '@/components/common/accessible-button'
import { useOnboardingContext } from './onboarding-provider'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface HelpButtonProps {
  variant?: 'floating' | 'inline' | 'header'
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export function HelpButton({
  variant = 'floating',
  size = 'md',
  showTooltip = true,
  className
}: HelpButtonProps) {
  const { t } = useLanguage()
  const { startHelpMode, restartOnboarding, hasCompletedFullOnboarding } = useOnboardingContext()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleHelpClick = () => {
    if (variant === 'floating') {
      setIsMenuOpen(!isMenuOpen)
    } else {
      startHelpMode()
    }
  }

  const handleTourStart = () => {
    startHelpMode()
    setIsMenuOpen(false)
  }

  const handleRestartOnboarding = () => {
    restartOnboarding()
    setIsMenuOpen(false)
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  if (variant === 'floating') {
    return (
      <>
        {/* 플로팅 도움말 버튼 */}
        <div className={cn('fixed bottom-6 right-6 z-40', className)}>
          {/* 도움말 메뉴 */}
          {isMenuOpen && (
            <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]">
              <div className="space-y-1">
                <button
                  onClick={handleTourStart}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Play className="w-4 h-4 text-blue-600" />
                  <span>가이드 투어 시작</span>
                </button>
                
                {hasCompletedFullOnboarding && (
                  <button
                    onClick={handleRestartOnboarding}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-green-600" />
                    <span>온보딩 다시 보기</span>
                  </button>
                )}
                
                <a
                  href="/faq"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Book className="w-4 h-4 text-purple-600" />
                  <span>자주 묻는 질문</span>
                </a>
                
                <a
                  href="/contact"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-orange-600" />
                  <span>문의하기</span>
                </a>
              </div>
            </div>
          )}

          {/* 메인 버튼 */}
          <AccessibleButton
            variant="default"
            size="icon"
            onClick={handleHelpClick}
            aria-label="도움말 메뉴"
            className={cn(
              'rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'focus:ring-4 focus:ring-blue-300',
              sizeClasses[size]
            )}
            tooltip={showTooltip ? '도움이 필요하신가요?' : undefined}
          >
            <HelpCircle className={iconSizeClasses[size]} />
          </AccessibleButton>
        </div>

        {/* 오버레이 (메뉴 닫기용) */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </>
    )
  }

  if (variant === 'header') {
    return (
      <AccessibleButton
        variant="ghost"
        size="icon"
        onClick={handleHelpClick}
        aria-label="도움말 투어 시작"
        className={cn('text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400', className)}
        tooltip={showTooltip ? '도움말' : undefined}
      >
        <HelpCircle className={iconSizeClasses[size]} />
      </AccessibleButton>
    )
  }

  // inline variant
  const buttonSize = size === 'md' ? 'default' : size
  
  return (
    <AccessibleButton
      variant="outline"
      size={buttonSize as any}
      onClick={handleHelpClick}
      aria-label="도움말 투어 시작"
      className={cn('flex items-center gap-2', className)}
    >
      <HelpCircle className={iconSizeClasses[size]} />
      도움말
    </AccessibleButton>
  )
}

// 특정 기능에 대한 컨텍스트 도움말
interface ContextHelpProps {
  stepId: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

export function ContextHelp({
  stepId,
  title,
  description,
  position = 'top',
  children
}: ContextHelpProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const { goToStep } = useOnboardingContext()

  const handleHelpClick = () => {
    goToStep(stepId)
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {showTooltip && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg',
            'pointer-events-none max-w-xs',
            position === 'top' && 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
            position === 'bottom' && 'top-full mt-2 left-1/2 transform -translate-x-1/2',
            position === 'left' && 'right-full mr-2 top-1/2 transform -translate-y-1/2',
            position === 'right' && 'left-full ml-2 top-1/2 transform -translate-y-1/2'
          )}
        >
          <div className="font-medium mb-1">{title}</div>
          <div className="text-gray-300 text-xs">{description}</div>
          <button
            onClick={handleHelpClick}
            className="text-blue-300 hover:text-blue-200 text-xs mt-1 underline"
          >
            자세히 보기
          </button>
        </div>
      )}
    </div>
  )
}

// 페이지별 도움말 버튼
export function PageHelpButton({ page }: { page: string }) {
  const { goToStep } = useOnboardingContext()

  const pageSteps = {
    hotdeals: 'hotdeal-card',
    search: 'search-filters',
    order: 'order-form',
    dashboard: 'dashboard-overview'
  }

  const handleClick = () => {
    const stepId = pageSteps[page as keyof typeof pageSteps]
    if (stepId) {
      goToStep(stepId)
    }
  }

  return (
    <AccessibleButton
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={`${page} 페이지 도움말`}
      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <HelpCircle className="w-4 h-4 mr-1" />
      이 페이지 도움말
    </AccessibleButton>
  )
}