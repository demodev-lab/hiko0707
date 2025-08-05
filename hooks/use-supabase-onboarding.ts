'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { SupabaseOnboardingService, ClientOnboardingState } from '@/lib/services/supabase-onboarding-service'
import { TourStep } from '@/components/features/onboarding/onboarding-tour'
import { toast } from 'sonner'

interface UseSupabaseOnboardingOptions {
  autoStart?: boolean
  storageKey?: string
  maxSkipCount?: number
  tourSteps?: TourStep[]
}

export function useSupabaseOnboarding(options: UseSupabaseOnboardingOptions = {}) {
  const {
    autoStart = true,
    maxSkipCount = 3,
    tourSteps = []
  } = options

  const { user } = useUser()
  const queryClient = useQueryClient()

  const [showWelcome, setShowWelcome] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // Fetch onboarding state from Supabase or localStorage
  const { data: state, isLoading } = useQuery({
    queryKey: ['onboarding-state', user?.id],
    queryFn: async () => {
      return await SupabaseOnboardingService.getOnboardingState(user?.id)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Update onboarding state mutation
  const updateStateMutation = useMutation({
    mutationFn: async (updates: Partial<ClientOnboardingState>) => {
      return await SupabaseOnboardingService.updateOnboardingState(updates, user?.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-state', user?.id] })
    },
    onError: (error) => {
      toast.error('온보딩 상태 업데이트 중 오류가 발생했습니다.')
      console.error('Onboarding state update error:', error)
    },
  })

  // Reset onboarding mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await SupabaseOnboardingService.resetOnboarding(user?.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-state', user?.id] })
      setShowWelcome(true)
      setShowTour(false)
    },
    onError: (error) => {
      toast.error('온보딩 리셋 중 오류가 발생했습니다.')
      console.error('Onboarding reset error:', error)
    },
  })

  // Calculate if this is first visit
  useEffect(() => {
    if (!state || isLoading) return

    const daysSinceLastVisit = state.lastVisit 
      ? Math.floor((Date.now() - new Date(state.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity
    
    setIsFirstVisit(!state.hasSeenWelcome || daysSinceLastVisit > 30)
  }, [state, isLoading])

  // Auto start logic
  useEffect(() => {
    if (!autoStart || !state || isLoading) return

    const timer = setTimeout(() => {
      if (isFirstVisit && !state.hasSeenWelcome && state.skipCount < maxSkipCount) {
        setShowWelcome(true)
      }
    }, 1000) // 1초 후 시작

    return () => clearTimeout(timer)
  }, [autoStart, isFirstVisit, state, isLoading, maxSkipCount])

  // Start welcome modal
  const startWelcome = useCallback(() => {
    setShowWelcome(true)
  }, [])

  // Complete welcome modal
  const completeWelcome = useCallback(() => {
    setShowWelcome(false)
    updateStateMutation.mutate({ hasSeenWelcome: true })
  }, [updateStateMutation])

  // Start tour
  const startTour = useCallback(() => {
    setShowWelcome(false)
    setShowTour(true)
    updateStateMutation.mutate({ hasSeenWelcome: true })
  }, [updateStateMutation])

  // Complete tour
  const completeTour = useCallback(() => {
    setShowTour(false)
    updateStateMutation.mutate({ 
      hasSeenWelcome: true,
      hasCompletedTour: true,
      currentStep: 0
    })
  }, [updateStateMutation])

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    if (!state) return

    setShowWelcome(false)
    setShowTour(false)
    updateStateMutation.mutate({ 
      hasSeenWelcome: true,
      skipCount: state.skipCount + 1
    })
  }, [updateStateMutation, state])

  // Go to specific step
  const goToStep = useCallback((stepId: string) => {
    const stepIndex = tourSteps.findIndex(step => step.id === stepId)
    if (stepIndex !== -1) {
      setShowTour(true)
      updateStateMutation.mutate({ currentStep: stepIndex })
    }
  }, [tourSteps, updateStateMutation])

  // Restart onboarding
  const restartOnboarding = useCallback(() => {
    resetMutation.mutate()
  }, [resetMutation])

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setShowWelcome(false)
    setShowTour(false)
    resetMutation.mutate()
  }, [resetMutation])

  // Start help mode (tour only)
  const startHelpMode = useCallback(() => {
    setShowTour(true)
  }, [])

  // Track user action
  const trackUserAction = useCallback((action: string, data?: any) => {
    // Analytics tracking can be added here
    console.log('Onboarding action:', action, data)
  }, [])

  // Mark settings as viewed
  const markSettingsViewed = useCallback(() => {
    updateStateMutation.mutate({ settingsViewed: true })
  }, [updateStateMutation])

  // Mark profile as completed
  const markProfileCompleted = useCallback(() => {
    updateStateMutation.mutate({ profileCompleted: true })
  }, [updateStateMutation])

  // Update current step
  const updateCurrentStep = useCallback((step: number) => {
    updateStateMutation.mutate({ currentStep: step })
  }, [updateStateMutation])

  // Default state while loading
  const defaultState: ClientOnboardingState = {
    hasSeenWelcome: false,
    hasCompletedTour: false,
    currentStep: 0,
    skipCount: 0,
    lastVisit: new Date().toISOString(),
    settingsViewed: false,
    profileCompleted: false,
  }

  const currentState = state || defaultState

  return {
    // State
    state: currentState,
    isFirstVisit,
    shouldShowOnboarding: showWelcome || showTour,
    isLoading,
    
    // Modal states
    showWelcome,
    showTour,
    
    // Actions
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
    markSettingsViewed,
    markProfileCompleted,
    updateCurrentStep,
    
    // Utility states
    hasCompletedFullOnboarding: currentState.hasSeenWelcome && currentState.hasCompletedTour,
    canShowOnboarding: currentState.skipCount < maxSkipCount,
    daysUntilNextPrompt: Math.max(0, 7 - currentState.skipCount * 2), // 건너뛸수록 간격 증가
    
    // Loading states
    isUpdating: updateStateMutation.isPending,
    isResetting: resetMutation.isPending,
  }
}

// Default tour steps (exported from original hook)
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

// Page-specific tour steps
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