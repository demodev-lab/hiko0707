import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { HotDeal, HotDealCategory, HotDealSource } from '@/types/hotdeal'

export function useHotDeals(category?: HotDealCategory, page: number = 1, limit: number = 20) {
  const queryKey = category 
    ? ['hotdeals', 'category', category, page, limit]
    : ['hotdeals', 'page', page, limit]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (category) {
        const deals = await db.hotdeals.findActiveByCategory(category)
        const total = deals.length
        const totalPages = Math.ceil(total / limit)
        const start = (page - 1) * limit
        const end = start + limit
        
        return {
          items: deals.slice(start, end),
          total,
          page,
          totalPages
        }
      }
      return db.hotdeals.findWithPagination(page, limit)
    }
  })

  return {
    hotdeals: data?.items || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.page || page,
    isLoading,
    error
  }
}

export function useHotDeal(id: string) {
  const queryKey = ['hotdeal', id]
  
  const { data: hotdeal, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => db.hotdeals.findById(id)
  })

  // 조회수 증가
  const incrementViewCount = useCallback(async () => {
    await db.hotdeals.incrementViewCount(id)
  }, [id])

  return {
    hotdeal,
    isLoading,
    error,
    incrementViewCount
  }
}

export function usePopularHotDeals(limit: number = 10) {
  const { data: hotdeals, isLoading, error } = useQuery({
    queryKey: ['hotdeals', 'popular', limit],
    queryFn: () => db.hotdeals.getPopularDeals(limit)
  })

  return {
    hotdeals: hotdeals || [],
    isLoading,
    error
  }
}

export function useEndingSoonHotDeals(hoursLeft: number = 24) {
  const { data: hotdeals, isLoading, error } = useQuery({
    queryKey: ['hotdeals', 'ending-soon', hoursLeft],
    queryFn: () => db.hotdeals.getEndingSoonDeals(hoursLeft),
    refetchInterval: 60000 // 1분마다 자동 갱신
  })

  return {
    hotdeals: hotdeals || [],
    isLoading,
    error
  }
}

export function useSearchHotDeals() {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<HotDealCategory | null>(null)
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [minDiscount, setMinDiscount] = useState<number | null>(null)

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['hotdeals', 'search', keyword, category, priceRange, minDiscount],
    queryFn: async () => {
      let deals = await db.hotdeals.findActive()
      
      // 키워드 검색
      if (keyword) {
        deals = await db.hotdeals.searchByKeyword(keyword)
      }
      
      // 카테고리 필터
      if (category) {
        deals = deals.filter(d => d.category === category)
      }
      
      // 가격 범위 필터
      if (priceRange) {
        deals = deals.filter(d => 
          d.price >= priceRange.min && d.price <= priceRange.max
        )
      }
      
      // 최소 할인율 필터
      if (minDiscount) {
        deals = deals.filter(d => 
          d.discountRate && d.discountRate >= minDiscount
        )
      }
      
      return deals
    },
    enabled: !!(keyword || category || priceRange || minDiscount)
  })

  return {
    results: results || [],
    isLoading,
    error,
    keyword,
    setKeyword,
    category,
    setCategory,
    priceRange,
    setPriceRange,
    minDiscount,
    setMinDiscount
  }
}

export function useHotDealLike(id: string) {
  const queryClient = useQueryClient()
  const [isLiked, setIsLiked] = useState(false)
  
  const likeMutation = useMutation({
    mutationFn: () => db.hotdeals.incrementLikeCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal', id] })
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
      setIsLiked(true)
    }
  })
  
  const unlikeMutation = useMutation({
    mutationFn: () => db.hotdeals.decrementLikeCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotdeal', id] })
      queryClient.invalidateQueries({ queryKey: ['hotdeals'] })
      setIsLiked(false)
    }
  })

  const toggleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate()
    } else {
      likeMutation.mutate()
    }
  }

  return {
    isLiked,
    toggleLike,
    isLoading: likeMutation.isPending || unlikeMutation.isPending
  }
}

export function useSimilarHotDeals(id: string, limit: number = 4) {
  const { data: hotdeals, isLoading, error } = useQuery({
    queryKey: ['hotdeals', 'similar', id, limit],
    queryFn: () => db.hotdeals.findSimilarDeals(id, limit)
  })

  return {
    hotdeals: hotdeals || [],
    isLoading,
    error
  }
}