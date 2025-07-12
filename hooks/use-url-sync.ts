'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useDebounce } from './use-debounce'

interface UrlSyncConfig {
  key: string
  defaultValue?: string | string[]
  debounce?: number
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export function useUrlSync<T = string>({
  key,
  defaultValue,
  debounce = 300,
  serialize = (v) => String(v),
  deserialize = (v) => v as any
}: UrlSyncConfig) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current value from URL
  const urlValue = searchParams.get(key)
  const currentValue = urlValue ? deserialize(urlValue) : defaultValue

  // Update URL with new value
  const setValue = useCallback((value: T | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === undefined || value === defaultValue || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      params.delete(key)
    } else {
      params.set(key, serialize(value))
    }

    const search = params.toString()
    const query = search ? `?${search}` : ''
    
    router.push(`${pathname}${query}`, { scroll: false })
  }, [key, defaultValue, pathname, router, searchParams, serialize])

  // Debounced version for text inputs
  const debouncedSetValue = useDebounce(setValue, debounce)

  return [currentValue as T, setValue, debouncedSetValue] as const
}

// Multiple URL parameters sync
interface UrlSyncMultipleConfig {
  params: Record<string, any>
  defaultValues?: Record<string, any>
  debounce?: number
}

export function useUrlSyncMultiple({
  params,
  defaultValues = {},
  debounce = 300
}: UrlSyncMultipleConfig) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get all current values from URL
  const currentValues = Object.keys(params).reduce((acc, key) => {
    const urlValue = searchParams.get(key)
    acc[key] = urlValue || defaultValues[key] || ''
    return acc
  }, {} as Record<string, any>)

  // Update multiple URL parameters at once
  const setValues = useCallback((updates: Partial<typeof params>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === defaultValues[key] || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
    })

    const search = newParams.toString()
    const query = search ? `?${search}` : ''
    
    router.push(`${pathname}${query}`, { scroll: false })
  }, [defaultValues, pathname, router, searchParams])

  // Clear all parameters
  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  // Debounced version
  const debouncedSetValues = useDebounce(setValues, debounce)

  return {
    values: currentValues,
    setValues,
    debouncedSetValues,
    clearAll
  }
}

// Specialized hooks for common use cases
export function useSearchQuery() {
  const [query, setQuery, setQueryDebounced] = useUrlSync({
    key: 'q',
    defaultValue: '',
    debounce: 500
  })

  return {
    query: query || '',
    setQuery,
    setQueryDebounced
  }
}

export function useCategoryFilter() {
  const [category, setCategory] = useUrlSync({
    key: 'category',
    defaultValue: 'all'
  })

  return {
    category: category || 'all',
    setCategory
  }
}

export function usePriceRangeFilter() {
  const [minPrice, setMinPrice] = useUrlSync({
    key: 'minPrice',
    defaultValue: '',
    serialize: (v) => String(v),
    deserialize: (v) => v ? parseInt(v) : undefined
  })

  const [maxPrice, setMaxPrice] = useUrlSync({
    key: 'maxPrice',
    defaultValue: '',
    serialize: (v) => String(v),
    deserialize: (v) => v ? parseInt(v) : undefined
  })

  return {
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    setMinPrice,
    setMaxPrice
  }
}

export function useSortFilter() {
  const [sort, setSort] = useUrlSync({
    key: 'sort',
    defaultValue: 'latest'
  })

  return {
    sort: sort || 'latest',
    setSort
  }
}

// Combined filter hook for hot deals
export function useHotDealFilters() {
  const { query, setQuery, setQueryDebounced } = useSearchQuery()
  const { category, setCategory } = useCategoryFilter()
  const { minPrice, maxPrice, setMinPrice, setMaxPrice } = usePriceRangeFilter()
  const { sort, setSort } = useSortFilter()
  
  const [status, setStatus] = useUrlSync({
    key: 'status',
    defaultValue: 'all'
  })

  const [freeShipping, setFreeShipping] = useUrlSync({
    key: 'freeShipping',
    defaultValue: '',
    serialize: (v) => v ? 'true' : '',
    deserialize: (v) => v === 'true'
  })

  const [store, setStore] = useUrlSync({
    key: 'store',
    defaultValue: 'all'
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  // Check if any filter is active
  const hasActiveFilters = 
    query !== '' ||
    category !== 'all' ||
    status !== 'all' ||
    store !== 'all' ||
    freeShipping ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    sort !== 'latest'

  return {
    filters: {
      query,
      category,
      status: status || 'all',
      store: store || 'all',
      freeShipping: freeShipping || false,
      minPrice,
      maxPrice,
      sort
    },
    setters: {
      setQuery,
      setQueryDebounced,
      setCategory,
      setStatus,
      setStore,
      setFreeShipping,
      setMinPrice,
      setMaxPrice,
      setSort
    },
    clearFilters,
    hasActiveFilters
  }
}