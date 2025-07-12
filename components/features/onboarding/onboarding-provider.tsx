'use client'

import { createContext, useContext, ReactNode } from 'react'
import { OnboardingTour } from './onboarding-tour'
import { WelcomeModal } from './welcome-modal'
import { useOnboarding, defaultTourSteps, pageTourSteps } from '@/hooks/use-onboarding'
import { useLanguage } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'

interface OnboardingContextType {
  startWelcome: () => void
  startTour: () => void
  startHelpMode: () => void
  restartOnboarding: () => void
  resetOnboarding: () => void
  goToStep: (stepId: string) => void
  hasCompletedFullOnboarding: boolean
  isFirstVisit: boolean
  canShowOnboarding: boolean
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

interface OnboardingProviderProps {
  children: ReactNode
  enableAutoStart?: boolean
  tourSteps?: typeof defaultTourSteps
  currentPage?: 'home' | 'hotdeals' | 'search' | 'order'
}

export function OnboardingProvider({
  children,
  enableAutoStart = true,
  tourSteps,
  currentPage = 'home'
}: OnboardingProviderProps) {
  const { language } = useLanguage()
  const router = useRouter()

  // 페이지별 투어 단계 선택
  const getPageTourSteps = () => {
    if (tourSteps) return tourSteps
    return pageTourSteps[currentPage] || defaultTourSteps
  }

  const {
    state,
    isFirstVisit,
    showWelcome,
    showTour,
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
    hasCompletedFullOnboarding,
    canShowOnboarding
  } = useOnboarding({
    autoStart: enableAutoStart,
    tourSteps: getPageTourSteps()
  })

  const handleWelcomeComplete = () => {
    completeWelcome()
    trackUserAction('welcome_completed', { page: currentPage })
  }

  const handleTourStart = () => {
    startTour()
    trackUserAction('tour_started', { page: currentPage })
  }

  const handleTourComplete = () => {
    completeTour()
    trackUserAction('tour_completed', { page: currentPage })
    
    // 투어 완료 후 다음 단계 안내 (선택적)
    if (currentPage === 'home') {
      setTimeout(() => {
        // 핫딜 페이지로 이동 제안
        const shouldNavigate = confirm(
          '투어를 완료했습니다! 이제 실제 핫딜을 확인해보시겠어요?'
        )
        if (shouldNavigate) {
          router.push('/hotdeals')
        }
      }, 1000)
    }
  }

  const handleSkip = () => {
    skipOnboarding()
    trackUserAction('onboarding_skipped', { 
      page: currentPage,
      skipCount: state.skipCount + 1
    })
  }

  const contextValue: OnboardingContextType = {
    startWelcome,
    startTour: handleTourStart,
    startHelpMode,
    restartOnboarding,
    resetOnboarding,
    goToStep,
    hasCompletedFullOnboarding,
    isFirstVisit,
    canShowOnboarding
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* 웰컴 모달 */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleWelcomeComplete}
        onStartTour={handleTourStart}
        userLanguage={language}
      />
      
      {/* 투어 */}
      <OnboardingTour
        steps={getPageTourSteps()}
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleSkip}
        showProgress={true}
        darkOverlay={true}
      />
    </OnboardingContext.Provider>
  )
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider')
  }
  return context
}