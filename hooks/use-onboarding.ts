'use client'

import { useState, useEffect, useCallback } from 'react'
import { TourStep } from '@/components/features/onboarding/onboarding-tour'

interface OnboardingState {
  hasSeenWelcome: boolean
  hasCompletedTour: boolean
  currentStep: string | null
  skipCount: number
  lastVisit: string | null
}

interface UseOnboardingOptions {
  autoStart?: boolean
  storageKey?: string
  maxSkipCount?: number
  tourSteps?: TourStep[]
}

export function useOnboarding(options: UseOnboardingOptions = {}) {
  const {
    autoStart = true,
    storageKey = 'hiko-onboarding',
    maxSkipCount = 3,
    tourSteps = []
  } = options

  const [state, setState] = useState<OnboardingState>({
    hasSeenWelcome: false,
    hasCompletedTour: false,
    currentStep: null,
    skipCount: 0,
    lastVisit: null
  })

  const [showWelcome, setShowWelcome] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // 로컬 스토리지에서 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsedState = JSON.parse(saved) as OnboardingState
        setState(parsedState)
        
        // 첫 방문 여부 확인
        const daysSinceLastVisit = parsedState.lastVisit 
          ? Math.floor((Date.now() - new Date(parsedState.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity
        
        setIsFirstVisit(!parsedState.hasSeenWelcome || daysSinceLastVisit > 30)
      } catch (error) {
        console.error('Failed to parse onboarding state:', error)
        setIsFirstVisit(true)
      }
    } else {
      setIsFirstVisit(true)
    }
  }, [storageKey])

  // 자동 시작 로직
  useEffect(() => {
    if (!autoStart) return

    const timer = setTimeout(() => {
      if (isFirstVisit && !state.hasSeenWelcome && state.skipCount < maxSkipCount) {
        setShowWelcome(true)
      }
    }, 1000) // 1초 후 시작

    return () => clearTimeout(timer)
  }, [autoStart, isFirstVisit, state.hasSeenWelcome, state.skipCount, maxSkipCount])

  // 상태를 로컬 스토리지에 저장
  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    const updatedState = {
      ...state,
      ...newState,
      lastVisit: new Date().toISOString()
    }
    
    setState(updatedState)
    localStorage.setItem(storageKey, JSON.stringify(updatedState))
  }, [state, storageKey])

  // 웰컴 모달 시작
  const startWelcome = useCallback(() => {
    setShowWelcome(true)
  }, [])

  // 웰컴 모달 완료
  const completeWelcome = useCallback(() => {
    setShowWelcome(false)
    saveState({ hasSeenWelcome: true })
  }, [saveState])

  // 투어 시작
  const startTour = useCallback(() => {
    setShowWelcome(false)
    setShowTour(true)
    saveState({ hasSeenWelcome: true })
  }, [saveState])

  // 투어 완료
  const completeTour = useCallback(() => {
    setShowTour(false)
    saveState({ 
      hasSeenWelcome: true,
      hasCompletedTour: true,
      currentStep: null
    })
  }, [saveState])

  // 건너뛰기
  const skipOnboarding = useCallback(() => {
    setShowWelcome(false)
    setShowTour(false)
    saveState({ 
      hasSeenWelcome: true,
      skipCount: state.skipCount + 1
    })
  }, [saveState, state.skipCount])

  // 특정 단계로 이동
  const goToStep = useCallback((stepId: string) => {
    const stepExists = tourSteps.some(step => step.id === stepId)
    if (stepExists) {
      setShowTour(true)
      saveState({ currentStep: stepId })
    }
  }, [tourSteps, saveState])

  // 온보딩 재시작
  const restartOnboarding = useCallback(() => {
    setState({
      hasSeenWelcome: false,
      hasCompletedTour: false,
      currentStep: null,
      skipCount: 0,
      lastVisit: null
    })
    localStorage.removeItem(storageKey)
    setShowWelcome(true)
  }, [storageKey])

  // 온보딩 상태 리셋
  const resetOnboarding = useCallback(() => {
    setState({
      hasSeenWelcome: false,
      hasCompletedTour: false,
      currentStep: null,
      skipCount: 0,
      lastVisit: null
    })
    localStorage.removeItem(storageKey)
    setShowWelcome(false)
    setShowTour(false)
  }, [storageKey])

  // 도움말 모드 (언제든지 투어 재시작 가능)
  const startHelpMode = useCallback(() => {
    setShowTour(true)
  }, [])

  // 사용자 행동 추적
  const trackUserAction = useCallback((action: string, data?: any) => {
    // 여기에 analytics 트래킹 로직 추가 가능
    console.log('Onboarding action:', action, data)
  }, [])

  return {
    // 상태
    state,
    isFirstVisit,
    shouldShowOnboarding: showWelcome || showTour,
    
    // 모달 상태
    showWelcome,
    showTour,
    
    // 액션
    startWelcome,
    completeWelcome,
    startTour,
    completeTour,
    skipOnboarding,
    goToStep,
    restartOnboarding,
    resetOnboarding,
    startHelpMode,
    trackUserAction,
    
    // 유틸리티
    hasCompletedFullOnboarding: state.hasSeenWelcome && state.hasCompletedTour,
    canShowOnboarding: state.skipCount < maxSkipCount,
    daysUntilNextPrompt: Math.max(0, 7 - state.skipCount * 2) // 건너뛸수록 간격 증가
  }
}

// 기본 투어 단계 정의
export const defaultTourSteps: TourStep[] = [
  {
    id: 'header-search',
    target: 'header [role="search"]',
    title: '검색으로 원하는 상품 찾기',
    content: '여기서 원하는 상품이나 브랜드를 검색할 수 있습니다. 한국어로 검색해도 자동으로 번역해드려요!',
    position: 'bottom'
  },
  {
    id: 'language-selector',
    target: '[data-tour="language-selector"]',
    title: '언어 변경',
    content: '7개 언어로 번역된 콘텐츠를 확인할 수 있습니다. 언어를 변경하면 모든 페이지가 번역됩니다.',
    position: 'bottom'
  },
  {
    id: 'currency-selector',
    target: '[data-tour="currency-selector"]',
    title: '통화 변경',
    content: '10개국 통화로 가격을 확인할 수 있습니다. 실시간 환율로 계산된 가격을 보여드려요.',
    position: 'bottom'
  },
  {
    id: 'hotdeal-card',
    target: '[role="article"]:first-child',
    title: '핫딜 카드 살펴보기',
    content: '각 핫딜 카드에서 할인율, 가격, 리뷰 등을 확인할 수 있습니다. 하트 버튼으로 찜하고 공유도 가능해요!',
    position: 'top'
  },
  {
    id: 'buy-for-me',
    target: '[data-tour="buy-for-me"]',
    title: '대신 사줘요 서비스',
    content: '복잡한 한국 쇼핑몰에서 직접 주문하기 어려우시다면 저희가 대신 주문해드립니다!',
    position: 'top'
  },
  {
    id: 'filters',
    target: '[data-tour="filters"]',
    title: '필터로 정확한 상품 찾기',
    content: '카테고리, 가격대, 할인율 등으로 필터링해서 원하는 상품만 골라볼 수 있습니다.',
    position: 'right'
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: '알림 설정',
    content: '관심 있는 카테고리나 키워드의 새로운 핫딜을 알림으로 받아보세요!',
    position: 'bottom'
  }
]

// 페이지별 특화 투어 단계
export const pageTourSteps = {
  home: defaultTourSteps.slice(0, 4),
  hotdeals: defaultTourSteps,
  search: [
    {
      id: 'search-filters',
      target: '[data-tour="search-filters"]',
      title: '검색 필터 활용하기',
      content: '더 정확한 검색을 위해 다양한 필터를 활용해보세요.',
      position: 'right' as const
    },
    {
      id: 'search-results',
      target: '[data-tour="search-results"]',
      title: '검색 결과 확인',
      content: '검색 결과를 정렬하고 원하는 형태로 볼 수 있습니다.',
      position: 'top' as const
    }
  ],
  order: [
    {
      id: 'order-form',
      target: '[data-tour="order-form"]',
      title: '주문서 작성',
      content: '간단한 정보만 입력하시면 전문 상담원이 대신 주문해드립니다.',
      position: 'right' as const
    },
    {
      id: 'payment-info',
      target: '[data-tour="payment"]',
      title: '안전한 결제',
      content: '다양한 결제 수단을 지원하며 모든 거래는 안전하게 보호됩니다.',
      position: 'top' as const
    }
  ]
}