'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

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

export function useSupabaseFilterPresets() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  // Fetch filter presets from localStorage only
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['filter-presets', user?.id],
    queryFn: async () => {
      // Always use localStorage for filter presets
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : getDefaultPresets()
      } catch (error) {
        console.error('Failed to load filter presets:', error)
        return getDefaultPresets()
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: FilterPreset['filters'] }) => {
      const newPreset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name,
        filters,
        createdAt: new Date().toISOString(),
      }

      // Always save to localStorage
      const current = presets
      const updated = [newPreset, ...current].slice(0, MAX_PRESETS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newPreset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id] })
      toast.success('필터 프리셋이 저장되었습니다.')
    },
    onError: (error) => {
      toast.error('필터 프리셋 저장 중 오류가 발생했습니다.')
      console.error('Filter preset save error:', error)
    },
  })

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      // Always delete from localStorage
      const updated = presets.filter((p: FilterPreset) => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id] })
      toast.success('필터 프리셋이 삭제되었습니다.')
    },
    onError: (error) => {
      toast.error('필터 프리셋 삭제 중 오류가 발생했습니다.')
      console.error('Filter preset delete error:', error)
    },
  })

  // Update preset mutation
  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FilterPreset> }) => {
      // Always update in localStorage
      const updated = presets.map((p: FilterPreset) => 
        p.id === id ? { ...p, ...updates } : p
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated.find((p: FilterPreset) => p.id === id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id] })
      toast.success('필터 프리셋이 업데이트되었습니다.')
    },
    onError: (error) => {
      toast.error('필터 프리셋 업데이트 중 오류가 발생했습니다.')
      console.error('Filter preset update error:', error)
    },
  })

  // Apply preset (returns the filter object)
  const applyPreset = useCallback((id: string) => {
    const preset = presets.find((p: FilterPreset) => p.id === id)
    return preset?.filters || null
  }, [presets])

  // Check if current filters match any preset
  const findMatchingPreset = useCallback((currentFilters: FilterPreset['filters']) => {
    return presets.find((preset: FilterPreset) => {
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

  return {
    presets,
    isLoading,
    savePreset: savePresetMutation.mutate,
    deletePreset: deletePresetMutation.mutate,
    updatePreset: updatePresetMutation.mutate,
    applyPreset,
    findMatchingPreset,
    isSavingPreset: savePresetMutation.isPending,
    isDeletingPreset: deletePresetMutation.isPending,
    isUpdatingPreset: updatePresetMutation.isPending,
  }
}

// Get default presets
function getDefaultPresets(): FilterPreset[] {
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