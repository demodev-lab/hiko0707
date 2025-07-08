import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSearchSuggestions, useRecentSearches } from '@/hooks/use-search-suggestions'

describe('Search Autocomplete', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useSearchSuggestions', () => {
    it('should return empty suggestions for empty query', async () => {
      const { result } = renderHook(() => useSearchSuggestions(''))
      
      expect(result.current.suggestions).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should return suggestions for matching query', async () => {
      const { result } = renderHook(() => useSearchSuggestions('노'))
      
      // Wait for debounce and async operation
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.suggestions.length).toBeGreaterThan(0)
      expect(result.current.suggestions[0].text).toContain('노')
    })

    it('should debounce search requests', async () => {
      const { result, rerender } = renderHook(
        ({ query }) => useSearchSuggestions(query),
        { initialProps: { query: '' } }
      )
      
      // Rapid query changes
      act(() => {
        rerender({ query: '노' })
        rerender({ query: '노트' })
        rerender({ query: '노트북' })
      })
      
      // Should only process the last query after debounce
      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0)
      })
      
      const suggestions = result.current.suggestions
      expect(suggestions.some(s => s.text.includes('노트북'))).toBe(true)
    })
  })

  describe('useRecentSearches', () => {
    it('should initialize with empty recent searches', () => {
      const { result } = renderHook(() => useRecentSearches())
      expect(result.current.recentSearches).toEqual([])
    })

    it('should add recent search', () => {
      const { result } = renderHook(() => useRecentSearches())
      
      act(() => {
        result.current.addRecentSearch('노트북')
      })
      
      expect(result.current.recentSearches).toContain('노트북')
      expect(localStorage.getItem('recentSearches')).toContain('노트북')
    })

    it('should not duplicate recent searches', () => {
      const { result } = renderHook(() => useRecentSearches())
      
      act(() => {
        result.current.addRecentSearch('노트북')
        result.current.addRecentSearch('노트북')
      })
      
      expect(result.current.recentSearches).toEqual(['노트북'])
    })

    it('should maintain max 10 recent searches', () => {
      const { result } = renderHook(() => useRecentSearches())
      
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addRecentSearch(`search-${i}`)
        }
      })
      
      expect(result.current.recentSearches.length).toBe(10)
      expect(result.current.recentSearches[0]).toBe('search-14') // Most recent
    })

    it('should remove specific recent search', () => {
      const { result } = renderHook(() => useRecentSearches())
      
      act(() => {
        result.current.addRecentSearch('노트북')
        result.current.addRecentSearch('마우스')
        result.current.removeRecentSearch('노트북')
      })
      
      expect(result.current.recentSearches).toEqual(['마우스'])
    })

    it('should clear all recent searches', () => {
      const { result } = renderHook(() => useRecentSearches())
      
      act(() => {
        result.current.addRecentSearch('노트북')
        result.current.addRecentSearch('마우스')
        result.current.clearRecentSearches()
      })
      
      expect(result.current.recentSearches).toEqual([])
      expect(localStorage.getItem('recentSearches')).toBeNull()
    })
  })
})