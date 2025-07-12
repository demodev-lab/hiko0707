'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react'
import { AccessibleButton } from '@/components/common/accessible-button'
import { AccessibleModal } from '@/components/common/accessible-modal'
import { useLanguage } from '@/lib/i18n/context'
import { useFocusManagement } from '@/hooks/use-keyboard-navigation'
import { cn } from '@/lib/utils'

export interface TourStep {
  id: string
  target: string // CSS selector
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: () => void
  skipable?: boolean
  highlightPadding?: number
}

interface OnboardingTourProps {
  steps: TourStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  showProgress?: boolean
  darkOverlay?: boolean
  className?: string
}

export function OnboardingTour({
  steps,
  isActive,
  onComplete,
  onSkip,
  showProgress = true,
  darkOverlay = true,
  className
}: OnboardingTourProps) {
  const { t } = useLanguage()
  const { saveFocus, restoreFocus } = useFocusManagement()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [popupPlacement, setPopupPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('bottom')
  const popupRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  // 현재 단계의 타겟 요소 찾기 및 위치 계산
  const calculatePosition = useCallback(() => {
    if (!currentStep || !isActive) return

    const targetElement = document.querySelector(currentStep.target) as HTMLElement
    if (!targetElement) return

    const targetRect = targetElement.getBoundingClientRect()
    const popupElement = popupRef.current
    if (!popupElement) return

    const popupRect = popupElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = currentStep.highlightPadding || 8

    let position = { top: 0, left: 0 }
    let placement = currentStep.position || 'bottom'

    // 자동 위치 조정
    switch (placement) {
      case 'top':
        position.top = targetRect.top - popupRect.height - 16
        position.left = targetRect.left + (targetRect.width - popupRect.width) / 2
        
        // 화면 밖으로 나가는 경우 조정
        if (position.top < 0) placement = 'bottom'
        break

      case 'bottom':
        position.top = targetRect.bottom + 16
        position.left = targetRect.left + (targetRect.width - popupRect.width) / 2
        
        if (position.top + popupRect.height > viewportHeight) placement = 'top'
        break

      case 'left':
        position.top = targetRect.top + (targetRect.height - popupRect.height) / 2
        position.left = targetRect.left - popupRect.width - 16
        
        if (position.left < 0) placement = 'right'
        break

      case 'right':
        position.top = targetRect.top + (targetRect.height - popupRect.height) / 2
        position.left = targetRect.right + 16
        
        if (position.left + popupRect.width > viewportWidth) placement = 'left'
        break

      case 'center':
        position.top = (viewportHeight - popupRect.height) / 2
        position.left = (viewportWidth - popupRect.width) / 2
        break
    }

    // 최종 경계 검사
    position.left = Math.max(16, Math.min(position.left, viewportWidth - popupRect.width - 16))
    position.top = Math.max(16, Math.min(position.top, viewportHeight - popupRect.height - 16))

    setPopupPosition(position)
    setPopupPlacement(placement)

    // 하이라이트 위치 설정
    if (highlightRef.current) {
      highlightRef.current.style.top = `${targetRect.top - padding}px`
      highlightRef.current.style.left = `${targetRect.left - padding}px`
      highlightRef.current.style.width = `${targetRect.width + padding * 2}px`
      highlightRef.current.style.height = `${targetRect.height + padding * 2}px`
    }

    // 타겟 요소를 화면에 보이도록 스크롤
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }, [currentStep, isActive])

  // 위치 재계산
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(calculatePosition, 100)
      return () => clearTimeout(timer)
    }
  }, [isActive, currentStepIndex, calculatePosition])

  // 리사이즈 시 위치 재계산
  useEffect(() => {
    if (!isActive) return

    const handleResize = () => calculatePosition()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive, calculatePosition])

  // 투어 시작/종료 시 포커스 관리
  useEffect(() => {
    if (isActive) {
      saveFocus()
      document.body.style.overflow = 'hidden'
      
      // 현재 단계 실행
      if (currentStep?.action) {
        currentStep.action()
      }
    } else {
      document.body.style.overflow = ''
      restoreFocus()
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isActive, currentStep, saveFocus, restoreFocus])

  // 키보드 네비게이션
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onSkip()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1)
          }
          break
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault()
          if (isLastStep) {
            onComplete()
          } else {
            setCurrentStepIndex(prev => prev + 1)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isFirstStep, isLastStep, onComplete, onSkip])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex)
  }

  if (!isActive || !currentStep) return null

  const getArrowDirection = () => {
    switch (popupPlacement) {
      case 'top': return <ArrowDown className="w-4 h-4" />
      case 'bottom': return <ArrowUp className="w-4 h-4" />
      case 'left': return <ArrowRight className="w-4 h-4" />
      case 'right': return <ArrowLeft className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 오버레이 */}
      {darkOverlay && (
        <div className="absolute inset-0 bg-black/50 transition-opacity" />
      )}

      {/* 하이라이트 */}
      <div
        ref={highlightRef}
        className="absolute border-2 border-blue-500 rounded-lg shadow-lg pointer-events-none transition-all duration-300"
        style={{
          boxShadow: darkOverlay 
            ? '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)'
            : '0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      />

      {/* 투어 팝업 */}
      <div
        ref={popupRef}
        className={cn(
          'absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
          'max-w-sm w-full mx-4 p-6 transition-all duration-300',
          className
        )}
        style={{
          top: popupPosition.top,
          left: popupPosition.left
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
      >
        {/* 화살표 */}
        {popupPlacement !== 'center' && (
          <div 
            className={cn(
              'absolute text-blue-500',
              popupPlacement === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2',
              popupPlacement === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2',
              popupPlacement === 'left' && 'right-full top-1/2 transform -translate-y-1/2',
              popupPlacement === 'right' && 'left-full top-1/2 transform -translate-y-1/2'
            )}
          >
            {getArrowDirection()}
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="tour-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentStep.title}
          </h2>
          <AccessibleButton
            variant="ghost"
            size="icon"
            onClick={onSkip}
            aria-label="투어 건너뛰기"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </AccessibleButton>
        </div>

        {/* 콘텐츠 */}
        <div id="tour-content" className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* 진행 표시 */}
        {showProgress && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>단계 {currentStepIndex + 1} / {steps.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            
            {/* 단계 점들 */}
            <div className="flex justify-center mt-3 space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentStepIndex
                      ? 'bg-blue-600'
                      : index < currentStepIndex
                      ? 'bg-blue-300'
                      : 'bg-gray-300 dark:bg-gray-600'
                  )}
                  aria-label={`${index + 1}단계로 이동`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 버튼들 */}
        <div className="flex items-center justify-between">
          <AccessibleButton
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            aria-label="이전 단계"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </AccessibleButton>

          <div className="flex items-center gap-2">
            {currentStep.skipable !== false && (
              <AccessibleButton
                variant="ghost"
                onClick={onSkip}
                aria-label="투어 건너뛰기"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                건너뛰기
              </AccessibleButton>
            )}

            <AccessibleButton
              variant="default"
              onClick={handleNext}
              aria-label={isLastStep ? "투어 완료" : "다음 단계"}
              className="flex items-center gap-2"
            >
              {isLastStep ? '완료' : '다음'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </AccessibleButton>
          </div>
        </div>

        {/* 키보드 단축키 안내 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            화살표 키 또는 Enter: 다음 단계 | Esc: 건너뛰기
          </p>
        </div>
      </div>
    </div>
  )
}