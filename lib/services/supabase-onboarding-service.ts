// TypeScript interface for onboarding state
export interface ClientOnboardingState {
  hasSeenWelcome: boolean
  hasCompletedTour: boolean
  currentStep: number
  skipCount: number
  lastVisit: string
  settingsViewed: boolean
  profileCompleted: boolean
}

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  ONBOARDING_STATE: 'hiko_onboarding_state',
} as const

export class SupabaseOnboardingService {
  /**
   * Get onboarding state (localStorage only)
   */
  static async getOnboardingState(userId?: string): Promise<ClientOnboardingState> {
    // Always use localStorage for onboarding state
    // This is a UI preference that doesn't need server sync
    return this.getOnboardingStateFromStorage()
  }

  /**
   * Update onboarding state (localStorage only)
   */
  static async updateOnboardingState(
    updates: Partial<ClientOnboardingState>,
    userId?: string
  ): Promise<ClientOnboardingState> {
    const current = await this.getOnboardingState(userId)
    const updated = { ...current, ...updates, lastVisit: new Date().toISOString() }

    // Save to localStorage only
    this.saveOnboardingStateToStorage(updated)
    return updated
  }

  /**
   * Reset onboarding state
   */
  static async resetOnboarding(userId?: string): Promise<ClientOnboardingState> {
    const defaultState = this.getDefaultOnboardingState()
    
    // Save to localStorage only
    this.saveOnboardingStateToStorage(defaultState)
    return defaultState
  }

  /**
   * Mark welcome as seen
   */
  static async markWelcomeSeen(userId?: string): Promise<void> {
    await this.updateOnboardingState({ hasSeenWelcome: true }, userId)
  }

  /**
   * Mark tour as completed
   */
  static async markTourCompleted(userId?: string): Promise<void> {
    await this.updateOnboardingState({ 
      hasCompletedTour: true,
      currentStep: 0 
    }, userId)
  }

  /**
   * Update current step
   */
  static async updateCurrentStep(step: number, userId?: string): Promise<void> {
    await this.updateOnboardingState({ currentStep: step }, userId)
  }

  /**
   * Increment skip count
   */
  static async incrementSkipCount(userId?: string): Promise<void> {
    const current = await this.getOnboardingState(userId)
    await this.updateOnboardingState({ 
      skipCount: current.skipCount + 1 
    }, userId)
  }

  /**
   * Mark settings as viewed
   */
  static async markSettingsViewed(userId?: string): Promise<void> {
    await this.updateOnboardingState({ settingsViewed: true }, userId)
  }

  /**
   * Mark profile as completed
   */
  static async markProfileCompleted(userId?: string): Promise<void> {
    await this.updateOnboardingState({ profileCompleted: true }, userId)
  }

  /**
   * Check if onboarding should be shown
   */
  static async shouldShowOnboarding(userId?: string): Promise<boolean> {
    const state = await this.getOnboardingState(userId)
    return !state.hasSeenWelcome || (!state.hasCompletedTour && state.skipCount < 3)
  }


  /**
   * Get onboarding state from localStorage
   */
  private static getOnboardingStateFromStorage(): ClientOnboardingState {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...this.getDefaultOnboardingState(), ...parsed }
      }
    } catch (error) {
      console.error('Failed to parse onboarding state from localStorage:', error)
    }
    return this.getDefaultOnboardingState()
  }

  /**
   * Save onboarding state to localStorage
   */
  private static saveOnboardingStateToStorage(state: ClientOnboardingState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save onboarding state to localStorage:', error)
    }
  }


  /**
   * Get default onboarding state
   */
  private static getDefaultOnboardingState(): ClientOnboardingState {
    return {
      hasSeenWelcome: false,
      hasCompletedTour: false,
      currentStep: 0,
      skipCount: 0,
      lastVisit: new Date().toISOString(),
      settingsViewed: false,
      profileCompleted: false,
    }
  }
}