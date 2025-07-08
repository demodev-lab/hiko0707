import { useState, useEffect, useCallback } from 'react'

export interface FilterPreset {
  id: string
  name: string
  filters: {
    category?: string
    source?: string[]
    brands?: string[]
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    tags?: string[]
  }
  createdAt: string
}

const STORAGE_KEY = 'hiko-filter-presets'
const MAX_PRESETS = 10

export function useFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([])

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPresets(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
    }
  }, [])

  // Save preset
  const savePreset = useCallback((name: string, filters: FilterPreset['filters']) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    }

    setPresets(prev => {
      const updated = [newPreset, ...prev].slice(0, MAX_PRESETS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })

    return newPreset
  }, [])

  // Delete preset
  const deletePreset = useCallback((id: string) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Update preset
  const updatePreset = useCallback((id: string, updates: Partial<FilterPreset>) => {
    setPresets(prev => {
      const updated = prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Apply preset (returns the filter object)
  const applyPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id)
    return preset?.filters || null
  }, [presets])

  // Check if current filters match any preset
  const findMatchingPreset = useCallback((currentFilters: FilterPreset['filters']) => {
    return presets.find(preset => {
      const pf = preset.filters
      const cf = currentFilters
      
      return (
        pf.category === cf.category &&
        JSON.stringify(pf.source?.sort()) === JSON.stringify(cf.source?.sort()) &&
        JSON.stringify(pf.brands?.sort()) === JSON.stringify(cf.brands?.sort()) &&
        pf.minPrice === cf.minPrice &&
        pf.maxPrice === cf.maxPrice &&
        pf.sortBy === cf.sortBy &&
        JSON.stringify(pf.tags?.sort()) === JSON.stringify(cf.tags?.sort())
      )
    })
  }, [presets])

  // Get default presets
  const getDefaultPresets = useCallback((): FilterPreset[] => {
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
  }, [])

  return {
    presets,
    savePreset,
    deletePreset,
    updatePreset,
    applyPreset,
    findMatchingPreset,
    getDefaultPresets,
  }
}