import { supabase as getSupabaseClient } from '@/lib/supabase/client'
import type { FilterPreset } from '@/hooks/use-filter-presets'

// User preferences structure
export interface UserPreferences {
  recent_searches?: string[]
  filter_presets?: FilterPreset[]
  search_suggestions_enabled?: boolean
  max_recent_searches?: number
  max_filter_presets?: number
}

export class SupabasePreferencesService {
  /**
   * Get user preferences
   */
  static async getPreferences(userId: string): Promise<UserPreferences> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.error('Failed to get preferences:', error)
      return this.getDefaultPreferences()
    }

    return data.preferences || this.getDefaultPreferences()
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences | null> {
    const supabase = getSupabaseClient()
    
    // Get existing preferences
    const existing = await this.getPreferences(userId)
    const updated = { ...existing, ...preferences }

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        preferences: updated,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('preferences')
      .single()

    if (error || !data) {
      console.error('Failed to update preferences:', error)
      return null
    }

    return data.preferences || this.getDefaultPreferences()
  }

  /**
   * Add a recent search
   */
  static async addRecentSearch(userId: string, search: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    const maxSearches = preferences.max_recent_searches || 10
    
    const recentSearches = preferences.recent_searches || []
    const filtered = recentSearches.filter(s => s !== search)
    const updated = [search, ...filtered].slice(0, maxSearches)

    await this.updatePreferences(userId, {
      recent_searches: updated
    })
  }

  /**
   * Remove a recent search
   */
  static async removeRecentSearch(userId: string, search: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    const recentSearches = preferences.recent_searches || []
    const updated = recentSearches.filter(s => s !== search)

    await this.updatePreferences(userId, {
      recent_searches: updated
    })
  }

  /**
   * Clear all recent searches
   */
  static async clearRecentSearches(userId: string): Promise<void> {
    await this.updatePreferences(userId, {
      recent_searches: []
    })
  }

  /**
   * Save a filter preset
   */
  static async saveFilterPreset(
    userId: string, 
    preset: FilterPreset
  ): Promise<FilterPreset | null> {
    const preferences = await this.getPreferences(userId)
    const maxPresets = preferences.max_filter_presets || 10
    
    const filterPresets = preferences.filter_presets || []
    const updated = [preset, ...filterPresets].slice(0, maxPresets)

    const result = await this.updatePreferences(userId, {
      filter_presets: updated
    })

    return result ? preset : null
  }

  /**
   * Delete a filter preset
   */
  static async deleteFilterPreset(userId: string, presetId: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    const filterPresets = preferences.filter_presets || []
    const updated = filterPresets.filter(p => p.id !== presetId)

    await this.updatePreferences(userId, {
      filter_presets: updated
    })
  }

  /**
   * Update a filter preset
   */
  static async updateFilterPreset(
    userId: string, 
    presetId: string, 
    updates: Partial<FilterPreset>
  ): Promise<FilterPreset | null> {
    const preferences = await this.getPreferences(userId)
    const filterPresets = preferences.filter_presets || []
    
    const updated = filterPresets.map(p => 
      p.id === presetId ? { ...p, ...updates } : p
    )

    const result = await this.updatePreferences(userId, {
      filter_presets: updated
    })

    return result ? updated.find(p => p.id === presetId) || null : null
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      recent_searches: [],
      filter_presets: this.getDefaultFilterPresets(),
      search_suggestions_enabled: true,
      max_recent_searches: 10,
      max_filter_presets: 10
    }
  }

  /**
   * Get default filter presets
   */
  private static getDefaultFilterPresets(): FilterPreset[] {
    return [
      {
        id: 'default-electronics',
        name: '전자제품 핫딜',
        filters: {
          category: 'electronics',
          minPrice: 50000,
          maxPrice: 500000,
          sortBy: 'discount',
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'default-budget',
        name: '1만원 이하',
        filters: {
          maxPrice: 10000,
          sortBy: 'price_low',
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'default-premium',
        name: '프리미엄 상품',
        filters: {
          minPrice: 1000000,
          sortBy: 'popular',
        },
        createdAt: new Date().toISOString(),
      },
    ]
  }
}