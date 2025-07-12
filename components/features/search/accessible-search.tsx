'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { AccessibleButton } from '@/components/common/accessible-button'
import { AccessibleInput } from '@/components/common/accessible-form'
import { useLanguage } from '@/lib/i18n/context'
import { useKeyboardNavigation, useScreenReader } from '@/hooks/use-keyboard-navigation'
import { LiveRegion } from '@/components/common/screen-reader-only'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  text: string
  type: 'query' | 'category' | 'product'
  category?: string
}

interface AccessibleSearchProps {
  placeholder?: string
  suggestions?: SearchSuggestion[]
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  loading?: boolean
  className?: string
  showFilters?: boolean
  onFiltersToggle?: () => void
  value?: string
  autoComplete?: boolean
  maxSuggestions?: number
}

export function AccessibleSearch({
  placeholder,
  suggestions = [],
  onSearch,
  onSuggestionSelect,
  loading = false,
  className,
  showFilters = false,
  onFiltersToggle,
  value = '',
  autoComplete = true,
  maxSuggestions = 8
}: AccessibleSearchProps) {
  const { t } = useLanguage()
  const { announce } = useScreenReader()
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [announceText, setAnnounceText] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const displayedSuggestions = suggestions.slice(0, maxSuggestions)

  const {
    currentIndex,
    isActive,
    moveUp,
    moveDown,
    activate,
    reset,
    focus
  } = useKeyboardNavigation(displayedSuggestions.length, {
    onNavigate: (direction, index) => {
      if (index !== undefined && displayedSuggestions[index]) {
        const suggestion = displayedSuggestions[index]
        setAnnounceText(`${suggestion.text}, ${suggestion.type === 'category' ? '카테고리' : '검색어'}`)
      }
    },
    onActivate: (index) => {
      if (displayedSuggestions[index]) {
        handleSuggestionSelect(displayedSuggestions[index])
      }
    }
  })

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    if (autoComplete && newQuery.trim()) {
      setIsOpen(true)
      focus(0)
    } else {
      setIsOpen(false)
      reset()
    }
  }, [autoComplete, focus, reset])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setIsOpen(false)
      reset()
      announce(`"${query.trim()}" 검색이 시작되었습니다.`)
    }
  }, [query, onSearch, reset, announce])

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
    reset()
    onSuggestionSelect?.(suggestion)
    announce(`"${suggestion.text}"이(가) 선택되었습니다.`)
  }, [onSuggestionSelect, reset, announce])

  const handleClear = useCallback(() => {
    setQuery('')
    setIsOpen(false)
    reset()
    inputRef.current?.focus()
    announce('검색어가 지워졌습니다.')
  }, [reset, announce])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen && suggestions.length > 0) {
          setIsOpen(true)
          focus(0)
        } else {
          moveDown()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        moveUp()
        break
      case 'Enter':
        e.preventDefault()
        if (isActive && currentIndex >= 0) {
          activate()
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        reset()
        inputRef.current?.blur()
        break
      case 'Tab':
        setIsOpen(false)
        reset()
        break
    }
  }, [isOpen, suggestions.length, focus, moveDown, moveUp, isActive, currentIndex, activate, handleSubmit, reset])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        reset()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [reset])

  // 검색 결과 수 변경 시 알림
  useEffect(() => {
    if (isOpen && suggestions.length > 0) {
      setAnnounceText(`${suggestions.length}개의 검색 제안이 있습니다. 화살표 키로 탐색하세요.`)
    }
  }, [isOpen, suggestions.length])

  const searchId = 'accessible-search'
  const listId = `${searchId}-list`
  const inputId = `${searchId}-input`

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* 라이브 리전 */}
      <LiveRegion priority="polite">
        {announceText}
      </LiveRegion>

      <form onSubmit={handleSubmit} role="search" aria-label="핫딜 검색">
        <div className="relative">
          <label htmlFor={inputId} className="sr-only">
            {placeholder || t('common.search')}
          </label>
          
          <AccessibleInput
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('common.search')}
            className={cn(
              'pl-10 pr-20',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            )}
            autoComplete="off"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={isOpen ? listId : undefined}
            aria-activedescendant={
              isActive && currentIndex >= 0 
                ? `${searchId}-option-${currentIndex}` 
                : undefined
            }
            aria-describedby={`${searchId}-description`}
          />
          
          {/* 검색 아이콘 */}
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            aria-hidden="true"
          />
          
          {/* 오른쪽 버튼들 */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <AccessibleButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                aria-label="검색어 지우기"
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-3 h-3" />
              </AccessibleButton>
            )}
            
            {showFilters && (
              <AccessibleButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFiltersToggle}
                aria-label="필터 열기"
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Filter className="w-3 h-3" />
              </AccessibleButton>
            )}
            
            <AccessibleButton
              type="submit"
              variant="ghost"
              size="sm"
              loading={loading}
              loadingText="검색 중"
              aria-label={query ? `"${query}" 검색` : '검색'}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Search className="w-3 h-3" />
            </AccessibleButton>
          </div>
        </div>
        
        {/* 검색 설명 */}
        <div id={`${searchId}-description`} className="sr-only">
          검색어를 입력하고 엔터를 누르거나 검색 버튼을 클릭하세요. 
          화살표 키로 제안된 검색어를 탐색할 수 있습니다.
        </div>
      </form>

      {/* 검색 제안 드롭다운 */}
      {isOpen && displayedSuggestions.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="검색 제안"
          className={cn(
            'absolute top-full left-0 right-0 z-50 mt-1',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-md shadow-lg max-h-60 overflow-auto'
          )}
        >
          {displayedSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${searchId}-option-${index}`}
              role="option"
              aria-selected={currentIndex === index}
              className={cn(
                'px-4 py-2 cursor-pointer flex items-center justify-between',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                currentIndex === index && 'bg-blue-50 dark:bg-blue-900/50'
              )}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <span className="text-sm">{suggestion.text}</span>
              </div>
              
              {suggestion.type === 'category' && (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  카테고리
                </span>
              )}
            </li>
          ))}
          
          {suggestions.length > maxSuggestions && (
            <li className="px-4 py-2 text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
              {suggestions.length - maxSuggestions}개 더 보기...
            </li>
          )}
        </ul>
      )}
    </div>
  )
}