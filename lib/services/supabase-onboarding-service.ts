import { supabase as getSupabaseClient } from '@/lib/supabase/client'

// Onboarding state structure
export interface OnboardingState {
  has_seen_welcome?: boolean
  has_completed_tour?: boolean
  current_step?: number
  skip_count?: number
  last_visit?: string
  settings_viewed?: boolean
  profile_completed?: boolean
}

// TypeScript interface with camelCase for client-side use
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
   * Get onboarding state with dual support (Supabase + localStorage fallback)
   */
  static async getOnboardingState(userId?: string): Promise<ClientOnboardingState> {
    // If user is authenticated, try Supabase first
    if (userId) {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('user_id', userId)
          .single()

        if (!error && data && data.preferences?.onboarding) {
          return this.convertToClientFormat(data.preferences.onboarding)
        }
      } catch (error) {
        console.error('Failed to get onboarding state from Supabase:', error)
      }
    }

    // Fallback to localStorage
    return this.getOnboardingStateFromStorage()
  }

  /**
   * Update onboarding state with dual support
   */
  static async updateOnboardingState(
    updates: Partial<ClientOnboardingState>,
    userId?: string
  ): Promise<ClientOnboardingState> {
    const current = await this.getOnboardingState(userId)
    const updated = { ...current, ...updates, lastVisit: new Date().toISOString() }

    // If user is authenticated, update Supabase
    if (userId) {
      try {
        const dbFormat = this.convertToDbFormat(updated)
        await this.updateOnboardingStateInSupabase(userId, dbFormat)
      } catch (error) {
        console.error('Failed to update onboarding state in Supabase:', error)
      }
    }

    // Always update localStorage as fallback/cache
    this.saveOnboardingStateToStorage(updated)
    return updated
  }

  /**
   * Reset onboarding state
   */
  static async resetOnboarding(userId?: string): Promise<ClientOnboardingState> {
    const defaultState = this.getDefaultOnboardingState()

    if (userId) {
      try {
        const dbFormat = this.convertToDbFormat(defaultState)
        await this.updateOnboardingStateInSupabase(userId, dbFormat)
      } catch (error) {
        console.error('Failed to reset onboarding state in Supabase:', error)
      }
    }

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
   * Update onboarding state in Supabase
   */
  private static async updateOnboardingStateInSupabase(
    userId: string,
    onboardingState: OnboardingState
  ): Promise<void> {
    const supabase = getSupabaseClient()
    
    // Get existing preferences
    const { data: existingData } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    const existingPreferences = existingData?.preferences || {}
    const updatedPreferences = {
      ...existingPreferences,
      onboarding: onboardingState
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update onboarding state: ${error.message}`)
    }
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
   * Convert database format (snake_case) to client format (camelCase)
   */
  private static convertToClientFormat(dbState: OnboardingState): ClientOnboardingState {
    return {
      hasSeenWelcome: dbState.has_seen_welcome || false,
      hasCompletedTour: dbState.has_completed_tour || false,
      currentStep: dbState.current_step || 0,
      skipCount: dbState.skip_count || 0,
      lastVisit: dbState.last_visit || new Date().toISOString(),
      settingsViewed: dbState.settings_viewed || false,
      profileCompleted: dbState.profile_completed || false,
    }
  }

  /**
   * Convert client format (camelCase) to database format (snake_case)
   */
  private static convertToDbFormat(clientState: ClientOnboardingState): OnboardingState {
    return {
      has_seen_welcome: clientState.hasSeenWelcome,
      has_completed_tour: clientState.hasCompletedTour,
      current_step: clientState.currentStep,
      skip_count: clientState.skipCount,
      last_visit: clientState.lastVisit,
      settings_viewed: clientState.settingsViewed,
      profile_completed: clientState.profileCompleted,
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