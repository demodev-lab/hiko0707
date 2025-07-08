import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

interface SearchSuggestion {
  id: string
  text: string
  category?: string
  count?: number
}

export function useSearchSuggestions(query: string, delay = 300) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock suggestions data - in production, this would come from an API
  const mockSuggestions: Record<string, SearchSuggestion[]> = {
    '노': [
      { id: '1', text: '노트북', category: '전자제품', count: 1523 },
      { id: '2', text: '노트북 거치대', category: '액세서리', count: 342 },
      { id: '3', text: '노스페이스', category: '의류', count: 892 },
      { id: '4', text: '노트북 가방', category: '액세서리', count: 234 },
    ],
    '아': [
      { id: '5', text: '아이폰', category: '전자제품', count: 2341 },
      { id: '6', text: '아이패드', category: '전자제품', count: 1232 },
      { id: '7', text: '아이폰 케이스', category: '액세서리', count: 892 },
      { id: '8', text: '아디다스', category: '의류', count: 1122 },
    ],
    '갤': [
      { id: '9', text: '갤럭시', category: '전자제품', count: 1892 },
      { id: '10', text: '갤럭시 버즈', category: '전자제품', count: 723 },
      { id: '11', text: '갤럭시 워치', category: '전자제품', count: 512 },
      { id: '12', text: '갤럭시탭', category: '전자제품', count: 432 },
    ],
    '에': [
      { id: '13', text: '에어팟', category: '전자제품', count: 1623 },
      { id: '14', text: '에어팟 프로', category: '전자제품', count: 892 },
      { id: '15', text: '에어프라이어', category: '가전제품', count: 723 },
      { id: '16', text: '에어컨', category: '가전제품', count: 512 },
    ],
    '마': [
      { id: '17', text: '마우스', category: '전자제품', count: 923 },
      { id: '18', text: '마우스패드', category: '액세서리', count: 412 },
      { id: '19', text: '마스크', category: '생활용품', count: 2123 },
      { id: '20', text: '마이크', category: '전자제품', count: 312 },
    ],
    '키': [
      { id: '21', text: '키보드', category: '전자제품', count: 1123 },
      { id: '22', text: '키보드 커버', category: '액세서리', count: 234 },
      { id: '23', text: '키링', category: '액세서리', count: 412 },
      { id: '24', text: '키홀더', category: '액세서리', count: 312 },
    ],
    'ip': [
      { id: '25', text: 'iphone', category: 'Electronics', count: 2341 },
      { id: '26', text: 'ipad', category: 'Electronics', count: 1232 },
      { id: '27', text: 'iphone case', category: 'Accessories', count: 892 },
      { id: '28', text: 'iphone charger', category: 'Accessories', count: 523 },
    ],
    'sa': [
      { id: '29', text: 'samsung', category: 'Electronics', count: 1892 },
      { id: '30', text: 'samsung galaxy', category: 'Electronics', count: 1523 },
      { id: '31', text: 'samsung tv', category: 'Electronics', count: 892 },
      { id: '32', text: 'samsung monitor', category: 'Electronics', count: 612 },
    ],
  }

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 1) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))

      // Find matching suggestions
      const lowerQuery = searchQuery.toLowerCase()
      let matchingSuggestions: SearchSuggestion[] = []

      // Check each mock data key
      Object.entries(mockSuggestions).forEach(([key, values]) => {
        if (lowerQuery.startsWith(key.toLowerCase())) {
          matchingSuggestions = [...matchingSuggestions, ...values]
        }
      })

      // Also search within text
      Object.values(mockSuggestions).forEach(suggestions => {
        suggestions.forEach(suggestion => {
          if (
            suggestion.text.toLowerCase().includes(lowerQuery) &&
            !matchingSuggestions.find(s => s.id === suggestion.id)
          ) {
            matchingSuggestions.push(suggestion)
          }
        })
      })

      // Sort by count (popularity) and limit to top 8
      matchingSuggestions.sort((a, b) => (b.count || 0) - (a.count || 0))
      setSuggestions(matchingSuggestions.slice(0, 8))
      setIsLoading(false)
    }, delay),
    [delay]
  )

  useEffect(() => {
    fetchSuggestions(query)
  }, [query, fetchSuggestions])

  return { suggestions, isLoading }
}

// Recent searches management
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
  }, [])

  const addRecentSearch = useCallback((search: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search)
      const updated = [search, ...filtered].slice(0, 10) // Keep last 10 searches
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeRecentSearch = useCallback((search: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== search)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }, [])

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }
}