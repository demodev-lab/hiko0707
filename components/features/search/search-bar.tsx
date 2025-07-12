'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSearchSuggestions, useRecentSearches } from '@/hooks/use-search-suggestions'
import { highlightText } from '@/lib/search-utils'
import { useLanguage } from '@/lib/i18n/context'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

const POPULAR_SEARCHES = [
  '노트북',
  '에어팟',
  '갤럭시',
  '아이폰',
  '게이밍 마우스',
  '키보드',
  '모니터',
  '의자',
]

export function SearchBar({ 
  defaultValue = '', 
  placeholder,
  className = '',
  showSuggestions = true
}: SearchBarProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Update query when defaultValue changes
  useEffect(() => {
    setQuery(defaultValue)
  }, [defaultValue])
  
  const { suggestions, isLoading } = useSearchSuggestions(query)
  const { recentSearches, addRecentSearch, removeRecentSearch } = useRecentSearches()
  
  const allSuggestions = query ? suggestions : []

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      addRecentSearch(finalQuery)
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`)
      setIsFocused(false)
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const handleClear = () => {
    setQuery('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSuggestions = allSuggestions.length
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalSuggestions)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalSuggestions) % totalSuggestions)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < totalSuggestions) {
          handleSuggestionClick(allSuggestions[selectedIndex].text)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }
  
  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder || t('common.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 py-2 sm:py-3 text-sm sm:text-base"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search suggestions dropdown */}
      {showSuggestions && isFocused && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50 max-h-[400px] overflow-y-auto"
        >
          {/* Autocomplete suggestions */}
          {query && allSuggestions.length > 0 && (
            <div className="p-2">
              {allSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div 
                        className="text-sm font-medium"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(suggestion.text, query) 
                        }}
                      />
                      {suggestion.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.category}
                        </div>
                      )}
                    </div>
                  </div>
                  {suggestion.count && (
                    <span className="text-xs text-gray-400">
                      {suggestion.count.toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Loading state */}
          {query && isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('common.loading')}...
            </div>
          )}
          
          {/* No results */}
          {query && !isLoading && allSuggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('search.noSuggestions')}
            </div>
          )}
          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('search.recentSearches')}
                </h3>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search) => (
                  <div key={search} className="flex items-center justify-between group">
                    <button
                      onClick={() => handleSuggestionClick(search)}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>{search}</span>
                    </button>
                    <button
                      onClick={() => removeRecentSearch(search)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches */}
          {!query && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('search.popularSearches')}
              </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handleSuggestionClick(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}