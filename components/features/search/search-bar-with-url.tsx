'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { useSearchQuery } from '@/hooks/use-url-sync'
import { cn } from '@/lib/utils'

interface SearchBarWithUrlProps {
  className?: string
  placeholder?: string
  showPopularKeywords?: boolean
  onSearch?: (query: string) => void
}

const POPULAR_KEYWORDS = [
  '갤럭시',
  '아이폰',
  '에어팟',
  '노트북',
  '게이밍',
  '스마트워치',
  '태블릿',
  '키보드'
]

export function SearchBarWithUrl({
  className,
  placeholder,
  showPopularKeywords = true,
  onSearch
}: SearchBarWithUrlProps) {
  const { t } = useLanguage()
  const { query, setQuery, setQueryDebounced } = useSearchQuery()
  const [localQuery, setLocalQuery] = useState(query)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local state with URL query
  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setLocalQuery(searchQuery)
    setQueryDebounced(searchQuery)
    onSearch?.(searchQuery)
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(localQuery)
    onSearch?.(localQuery)
  }

  // Clear search
  const handleClear = () => {
    setLocalQuery('')
    setQuery('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  // Handle keyword click
  const handleKeywordClick = (keyword: string) => {
    setLocalQuery(keyword)
    setQuery(keyword)
    onSearch?.(keyword)
  }

  // Simulate search state
  useEffect(() => {
    if (query) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 500)
      return () => clearTimeout(timer)
    }
  }, [query])

  return (
    <div className={cn("space-y-4", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder || t('common.search')}
            className="pl-10 pr-10"
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </form>

      {/* Popular Keywords */}
      {showPopularKeywords && !query && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{t('search.popularKeywords')}</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_KEYWORDS.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {query && !isSearching && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">&ldquo;{query}&rdquo;</span> {t('search.searchResults')}
        </div>
      )}
    </div>
  )
}