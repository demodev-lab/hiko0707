/**
 * Price Verification Hook
 * 가격 확인 및 견적 관리를 위한 React Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  verifyProductPrice, 
  batchVerifyPrices, 
  PriceCheckResult,
  PriceTrackingData,
  calculatePriceChange 
} from '@/lib/services/price-verification'
import {
  createDetailedQuotation,
  updateQuotation,
  sendQuotation,
  validateQuotation
} from '@/lib/services/quotation-service'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { HotDeal } from '@/types/hotdeal'
import { toast } from 'sonner'

/**
 * 개별 상품 가격 확인 Hook
 */
export function usePriceVerification(hotdeal: HotDeal | null, enabled: boolean = true) {
  const queryKey = ['price-verification', hotdeal?.id]
  
  const {
    data: priceResult,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!hotdeal) throw new Error('No hotdeal provided')
      return await verifyProductPrice(hotdeal.originalUrl, hotdeal)
    },
    enabled: enabled && !!hotdeal,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    retry: 2
  })

  const [priceHistory, setPriceHistory] = useState<PriceTrackingData | null>(null)

  // 가격 변동 계산
  const priceChange = priceResult && hotdeal ? 
    calculatePriceChange(
      hotdeal.price || 0,
      priceResult.currentPrice || 0
    ) : null

  // 수동 가격 새로고침
  const refreshPrice = useCallback(async () => {
    try {
      const result = await refetch()
      if (result.data) {
        toast.success('가격이 업데이트되었습니다')
        return result.data
      }
    } catch (error) {
      console.error('Price refresh failed:', error)
      toast.error('가격 업데이트에 실패했습니다')
    }
  }, [refetch])

  return {
    priceResult,
    priceChange,
    priceHistory,
    isLoading,
    error,
    refreshPrice,
    isPriceStale: priceResult ? 
      (Date.now() - priceResult.lastChecked.getTime()) > 30 * 60 * 1000 : false // 30분 이상 경과
  }
}

/**
 * 여러 상품 배치 가격 확인 Hook
 */
export function useBatchPriceVerification(
  items: Array<{ hotdeal: HotDeal; productUrl: string }>,
  enabled: boolean = true
) {
  const queryKey = ['batch-price-verification', items.map(item => item.hotdeal.id).sort()]
  
  const {
    data: batchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (items.length === 0) return new Map()
      return await batchVerifyPrices(items)
    },
    enabled: enabled && items.length > 0,
    staleTime: 10 * 60 * 1000, // 10분간 캐시
    retry: 1
  })

  const getPriceResult = useCallback((hotdealId: string): PriceCheckResult | undefined => {
    return batchResults?.get(hotdealId)
  }, [batchResults])

  const getSuccessfulResults = useCallback((): Map<string, PriceCheckResult> => {
    if (!batchResults) return new Map()
    const successful = new Map()
    for (const [id, result] of batchResults) {
      if (result.success) {
        successful.set(id, result)
      }
    }
    return successful
  }, [batchResults])

  return {
    batchResults,
    isLoading,
    error,
    getPriceResult,
    getSuccessfulResults,
    refetch,
    totalItems: items.length,
    successfulItems: batchResults ? Array.from(batchResults.values()).filter(r => r.success).length : 0,
    failedItems: batchResults ? Array.from(batchResults.values()).filter(r => !r.success).length : 0
  }
}

/**
 * 견적서 관리 Hook
 */
export function useQuotationManagement() {
  const queryClient = useQueryClient()
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map())

  // 견적서 생성 Mutation
  const createQuotationMutation = useMutation({
    mutationFn: async ({
      request,
      adminId,
      options
    }: {
      request: BuyForMeRequest
      adminId: string
      options: any
    }) => {
      return await createDetailedQuotation(request, adminId, options)
    },
    onSuccess: (quotation) => {
      queryClient.setQueryData(['quotation', quotation.id], quotation)
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('견적서가 생성되었습니다')
      
      // 자동 검증
      const validation = validateQuotation(quotation)
      setValidationResults(prev => new Map(prev).set(quotation.id, validation))
      
      if (!validation.isValid) {
        toast.warning(`견적서에 ${validation.errors.length}개의 오류가 있습니다`)
      }
    },
    onError: (error) => {
      console.error('Quotation creation failed:', error)
      toast.error('견적서 생성에 실패했습니다')
    }
  })

  // 견적서 업데이트 Mutation
  const updateQuotationMutation = useMutation({
    mutationFn: async ({
      quotation,
      updates,
      adminId
    }: {
      quotation: any
      updates: any
      adminId: string
    }) => {
      return updateQuotation(quotation, updates, adminId)
    },
    onSuccess: (quotation) => {
      queryClient.setQueryData(['quotation', quotation.id], quotation)
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('견적서가 수정되었습니다')
      
      // 재검증
      const validation = validateQuotation(quotation)
      setValidationResults(prev => new Map(prev).set(quotation.id, validation))
    },
    onError: (error) => {
      console.error('Quotation update failed:', error)
      toast.error('견적서 수정에 실패했습니다')
    }
  })

  // 견적서 발송 Mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async ({
      quotation,
      adminId
    }: {
      quotation: any
      adminId: string
    }) => {
      return sendQuotation(quotation, adminId)
    },
    onSuccess: (quotation) => {
      queryClient.setQueryData(['quotation', quotation.id], quotation)
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('견적서가 고객에게 발송되었습니다')
    },
    onError: (error) => {
      console.error('Quotation send failed:', error)
      toast.error('견적서 발송에 실패했습니다')
    }
  })

  // 견적서 검증 함수
  const validateQuotationById = useCallback((quotation: any): any => {
    const validation = validateQuotation(quotation)
    setValidationResults(prev => new Map(prev).set(quotation.id, validation))
    return validation
  }, [])

  // 견적서 생성 with 가격 확인
  const createQuotationWithPriceCheck = useCallback(async (
    request: BuyForMeRequest,
    adminId: string,
    options?: Partial<any>
  ) => {
    try {
      // 1. 가격 확인
      toast.info('실시간 가격을 확인하고 있습니다...')
      
      const priceVerification = await verifyProductPrice(
        request.productInfo.originalUrl,
        {
          id: request.hotdealId || request.id,
          title: request.productInfo.title,
          price: request.productInfo.discountedPrice.toString(),
          originalPrice: request.productInfo.originalPrice.toString(),
          productUrl: request.productInfo.originalUrl,
          seller: request.productInfo.siteName
        } as any
      )

      // 2. 가격 변동 알림
      if (priceVerification.success && priceVerification.currentPrice) {
        const priceDiff = priceVerification.currentPrice - request.productInfo.discountedPrice
        const diffPercent = (priceDiff / request.productInfo.discountedPrice) * 100
        
        if (Math.abs(diffPercent) > 5) {
          const message = diffPercent > 0 
            ? `실제 가격이 예상보다 ${Math.abs(diffPercent).toFixed(1)}% 높습니다`
            : `실제 가격이 예상보다 ${Math.abs(diffPercent).toFixed(1)}% 낮습니다`
          toast.warning(message)
        }
      }

      // 3. 견적서 생성
      const createOptions: any = {
        requestId: request.id,
        priceVerification,
        ...options
      }

      return await createQuotationMutation.mutateAsync({
        request,
        adminId,
        options: createOptions
      })
    } catch (error) {
      console.error('Failed to create quotation with price check:', error)
      toast.error('견적서 생성 중 오류가 발생했습니다')
      throw error
    }
  }, [createQuotationMutation])

  return {
    // Mutations
    createQuotation: createQuotationMutation.mutateAsync,
    updateQuotation: updateQuotationMutation.mutateAsync,
    sendQuotation: sendQuotationMutation.mutateAsync,
    createQuotationWithPriceCheck,
    
    // Loading states
    isCreating: createQuotationMutation.isPending,
    isUpdating: updateQuotationMutation.isPending,
    isSending: sendQuotationMutation.isPending,
    
    // Validation
    validateQuotation: validateQuotationById,
    validationResults,
    
    // Utilities
    getValidationResult: (quotationId: string) => validationResults.get(quotationId)
  }
}

/**
 * 가격 알림 Hook
 */
export function usePriceAlerts(hotdealIds: string[]) {
  const [alerts, setAlerts] = useState<Map<string, string[]>>(new Map())

  const addPriceAlert = useCallback((hotdealId: string, message: string) => {
    setAlerts(prev => {
      const newAlerts = new Map(prev)
      const existing = newAlerts.get(hotdealId) || []
      newAlerts.set(hotdealId, [...existing, message])
      return newAlerts
    })
  }, [])

  const clearAlerts = useCallback((hotdealId?: string) => {
    if (hotdealId) {
      setAlerts(prev => {
        const newAlerts = new Map(prev)
        newAlerts.delete(hotdealId)
        return newAlerts
      })
    } else {
      setAlerts(new Map())
    }
  }, [])

  const getAlerts = useCallback((hotdealId: string): string[] => {
    return alerts.get(hotdealId) || []
  }, [alerts])

  return {
    alerts,
    addPriceAlert,
    clearAlerts,
    getAlerts,
    hasAlerts: (hotdealId: string) => (alerts.get(hotdealId) || []).length > 0,
    totalAlerts: Array.from(alerts.values()).reduce((sum, arr) => sum + arr.length, 0)
  }
}

/**
 * 가격 비교 헬퍼 Hook
 */
export function usePriceComparison() {
  const comparePrice = useCallback((
    originalPrice: number,
    currentPrice: number,
    threshold: number = 5
  ): {
    difference: number
    percentage: number
    trend: 'higher' | 'lower' | 'same'
    isSignificant: boolean
    message: string
  } => {
    const difference = currentPrice - originalPrice
    const percentage = (difference / originalPrice) * 100
    const isSignificant = Math.abs(percentage) >= threshold
    
    let trend: 'higher' | 'lower' | 'same' = 'same'
    if (percentage > threshold) trend = 'higher'
    else if (percentage < -threshold) trend = 'lower'
    
    let message = ''
    if (isSignificant) {
      if (trend === 'higher') {
        message = `가격이 ${Math.abs(percentage).toFixed(1)}% 상승했습니다`
      } else if (trend === 'lower') {
        message = `가격이 ${Math.abs(percentage).toFixed(1)}% 하락했습니다`
      }
    } else {
      message = '가격 변동이 없습니다'
    }
    
    return {
      difference,
      percentage,
      trend,
      isSignificant,
      message
    }
  }, [])

  return { comparePrice }
}