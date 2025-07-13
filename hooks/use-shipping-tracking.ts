/**
 * Shipping Tracking Hook
 * 배송 추적을 위한 React Hook
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShippingTracking,
  ShippingProvider,
  AutoTrackingRule,
  shippingAutomationService 
} from '@/lib/services/shipping-automation'
import { toast } from 'sonner'

/**
 * 배송 추적 Hook
 */
export function useShippingTracking(orderId?: string) {
  const queryClient = useQueryClient()

  // 특정 주문의 배송 추적 정보 조회
  const {
    data: tracking,
    isLoading: isLoadingTracking,
    error: trackingError,
    refetch: refetchTracking
  } = useQuery({
    queryKey: ['shipping-tracking', orderId],
    queryFn: async () => {
      if (!orderId) return null
      return shippingAutomationService.getTrackingByOrderId(orderId)
    },
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000, // 2분
    refetchInterval: 5 * 60 * 1000 // 5분마다 자동 새로고침
  })

  // 모든 활성 추적 정보 조회
  const {
    data: allActiveTrackings = [],
    isLoading: isLoadingAllTrackings,
    refetch: refetchAllTrackings
  } = useQuery({
    queryKey: ['shipping-tracking-all'],
    queryFn: async () => {
      return shippingAutomationService.getAllActiveTrackings()
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 10 * 60 * 1000 // 10분마다 자동 새로고침
  })

  // 배송업체 목록 조회
  const {
    data: providers = [],
    isLoading: isLoadingProviders
  } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: async () => {
      return shippingAutomationService.getProviders()
    },
    staleTime: 60 * 60 * 1000 // 1시간
  })

  // 새 배송 추적 등록 Mutation
  const registerTrackingMutation = useMutation({
    mutationFn: async ({
      orderId,
      trackingNumber,
      providerId,
      recipientInfo,
      metadata
    }: {
      orderId: string
      trackingNumber: string
      providerId: string
      recipientInfo: {
        name: string
        phone?: string
        address: string
      }
      metadata?: {
        weight?: number
        dimensions?: string
        value?: number
        insurance?: boolean
      }
    }) => {
      return await shippingAutomationService.registerTracking(
        orderId,
        trackingNumber,
        providerId,
        recipientInfo,
        metadata
      )
    },
    onSuccess: (newTracking) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-tracking', newTracking.orderId] })
      queryClient.invalidateQueries({ queryKey: ['shipping-tracking-all'] })
      toast.success(`배송 추적이 등록되었습니다 (${newTracking.trackingNumber})`)
    },
    onError: (error) => {
      console.error('Failed to register tracking:', error)
      toast.error('배송 추적 등록에 실패했습니다')
    }
  })

  // 추적 정보 업데이트 Mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (trackingId: string) => {
      return await shippingAutomationService.updateTrackingInfo(trackingId)
    },
    onSuccess: (updatedTracking) => {
      if (updatedTracking) {
        queryClient.invalidateQueries({ queryKey: ['shipping-tracking', updatedTracking.orderId] })
        queryClient.invalidateQueries({ queryKey: ['shipping-tracking-all'] })
        toast.success('배송 정보가 업데이트되었습니다')
      }
    },
    onError: (error) => {
      console.error('Failed to update tracking:', error)
      toast.error('배송 정보 업데이트에 실패했습니다')
    }
  })

  // 모든 추적 정보 일괄 업데이트 Mutation
  const updateAllTrackingsMutation = useMutation({
    mutationFn: async () => {
      return await shippingAutomationService.updateAllTrackings()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-tracking-all'] })
      toast.success('모든 배송 정보가 업데이트되었습니다')
    },
    onError: (error) => {
      console.error('Failed to update all trackings:', error)
      toast.error('배송 정보 일괄 업데이트에 실패했습니다')
    }
  })

  // 배송 추적 등록
  const registerTracking = useCallback(async (
    orderId: string,
    trackingNumber: string,
    providerId: string,
    recipientInfo: {
      name: string
      phone?: string
      address: string
    },
    metadata?: {
      weight?: number
      dimensions?: string
      value?: number
      insurance?: boolean
    }
  ): Promise<ShippingTracking | null> => {
    try {
      const result = await registerTrackingMutation.mutateAsync({
        orderId,
        trackingNumber,
        providerId,
        recipientInfo,
        metadata
      })
      return result
    } catch (error) {
      console.error('Failed to register tracking:', error)
      return null
    }
  }, [registerTrackingMutation])

  // 추적 정보 새로고침
  const refreshTracking = useCallback(async (trackingId: string): Promise<ShippingTracking | null> => {
    try {
      const result = await updateTrackingMutation.mutateAsync(trackingId)
      return result
    } catch (error) {
      console.error('Failed to refresh tracking:', error)
      return null
    }
  }, [updateTrackingMutation])

  // 모든 추적 정보 새로고침
  const refreshAllTrackings = useCallback(async (): Promise<void> => {
    try {
      await updateAllTrackingsMutation.mutateAsync()
    } catch (error) {
      console.error('Failed to refresh all trackings:', error)
    }
  }, [updateAllTrackingsMutation])

  // 배송업체별 통계
  const providerStats = useMemo(() => {
    if (allActiveTrackings.length === 0) return {}

    const stats: Record<string, {
      total: number
      inTransit: number
      delivered: number
      averageDeliveryDays: number
    }> = {}

    allActiveTrackings.forEach(tracking => {
      const providerId = tracking.provider.id
      if (!stats[providerId]) {
        stats[providerId] = {
          total: 0,
          inTransit: 0,
          delivered: 0,
          averageDeliveryDays: 0
        }
      }

      stats[providerId].total++
      
      if (tracking.isDelivered) {
        stats[providerId].delivered++
      } else {
        stats[providerId].inTransit++
      }
    })

    return stats
  }, [allActiveTrackings])

  // 배송 상태별 통계
  const statusStats = useMemo(() => {
    if (allActiveTrackings.length === 0) return {}

    const stats: Record<string, number> = {}

    allActiveTrackings.forEach(tracking => {
      const status = tracking.currentStatus
      stats[status] = (stats[status] || 0) + 1
    })

    return stats
  }, [allActiveTrackings])

  // 지연된 배송 찾기
  const delayedTrackings = useMemo(() => {
    const now = new Date()
    return allActiveTrackings.filter(tracking => {
      if (tracking.isDelivered) return false
      
      const estimatedDelivery = tracking.estimatedDelivery
      if (!estimatedDelivery) return false
      
      return now > estimatedDelivery
    })
  }, [allActiveTrackings])

  return {
    // Data
    tracking,
    allActiveTrackings,
    providers,
    providerStats,
    statusStats,
    delayedTrackings,
    
    // Loading states
    isLoadingTracking,
    isLoadingAllTrackings,
    isLoadingProviders,
    
    // Actions
    registerTracking,
    refreshTracking,
    refreshAllTrackings,
    refetchTracking,
    refetchAllTrackings,
    
    // Mutation states
    isRegistering: registerTrackingMutation.isPending,
    isUpdating: updateTrackingMutation.isPending,
    isUpdatingAll: updateAllTrackingsMutation.isPending,
    
    // Utilities
    getTrackingUrl: (tracking: ShippingTracking) => 
      shippingAutomationService.getTrackingUrl(tracking),
    
    // Errors
    trackingError
  }
}

/**
 * 배송 자동화 규칙 관리 Hook
 */
export function useShippingAutomationRules() {
  const queryClient = useQueryClient()

  // 자동화 규칙 조회
  const {
    data: rules = [],
    isLoading: isLoadingRules,
    refetch: refetchRules
  } = useQuery({
    queryKey: ['shipping-automation-rules'],
    queryFn: async () => {
      return shippingAutomationService.getAutomationRules()
    },
    staleTime: 10 * 60 * 1000 // 10분
  })

  // 규칙 추가 Mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AutoTrackingRule, 'id'>) => {
      return shippingAutomationService.addAutomationRule(rule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-automation-rules'] })
      toast.success('자동화 규칙이 추가되었습니다')
    },
    onError: (error) => {
      console.error('Failed to add rule:', error)
      toast.error('규칙 추가에 실패했습니다')
    }
  })

  // 규칙 수정 Mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<AutoTrackingRule> 
    }) => {
      return shippingAutomationService.updateAutomationRule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-automation-rules'] })
      toast.success('자동화 규칙이 수정되었습니다')
    },
    onError: (error) => {
      console.error('Failed to update rule:', error)
      toast.error('규칙 수정에 실패했습니다')
    }
  })

  // 규칙 삭제 Mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = shippingAutomationService.deleteAutomationRule(id)
      if (!success) throw new Error('Rule not found')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-automation-rules'] })
      toast.success('자동화 규칙이 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error)
      toast.error('규칙 삭제에 실패했습니다')
    }
  })

  // 규칙 추가
  const addRule = useCallback(async (
    rule: Omit<AutoTrackingRule, 'id'>
  ): Promise<AutoTrackingRule | null> => {
    try {
      const result = await addRuleMutation.mutateAsync(rule)
      return result
    } catch (error) {
      console.error('Failed to add rule:', error)
      return null
    }
  }, [addRuleMutation])

  // 규칙 수정
  const updateRule = useCallback(async (
    id: string,
    updates: Partial<AutoTrackingRule>
  ): Promise<AutoTrackingRule | null> => {
    try {
      const result = await updateRuleMutation.mutateAsync({ id, updates })
      return result
    } catch (error) {
      console.error('Failed to update rule:', error)
      return null
    }
  }, [updateRuleMutation])

  // 규칙 삭제
  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteRuleMutation.mutateAsync(id)
      return true
    } catch (error) {
      console.error('Failed to delete rule:', error)
      return false
    }
  }, [deleteRuleMutation])

  // 규칙 활성화/비활성화
  const toggleRule = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
    try {
      await updateRule(id, { enabled })
      return true
    } catch (error) {
      return false
    }
  }, [updateRule])

  // 규칙 통계
  const ruleStats = useMemo(() => {
    const totalRules = rules.length
    const activeRules = rules.filter(rule => rule.enabled).length
    const rulesByType = rules.reduce((acc, rule) => {
      const key = rule.conditions.statuses.join(',') || 'general'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRules,
      activeRules,
      inactiveRules: totalRules - activeRules,
      rulesByType
    }
  }, [rules])

  return {
    // Data
    rules,
    ruleStats,
    
    // Loading state
    isLoadingRules,
    
    // Actions
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchRules,
    
    // Mutation states
    isAddingRule: addRuleMutation.isPending,
    isUpdatingRule: updateRuleMutation.isPending,
    isDeletingRule: deleteRuleMutation.isPending
  }
}

/**
 * 배송 분석 Hook
 */
export function useShippingAnalytics() {
  const { allActiveTrackings } = useShippingTracking()

  // 배송 성능 분석
  const analytics = useMemo(() => {
    if (allActiveTrackings.length === 0) {
      return {
        totalShipments: 0,
        deliveredShipments: 0,
        deliveryRate: 0,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0,
        delayedShipments: 0,
        performanceByProvider: {}
      }
    }

    const totalShipments = allActiveTrackings.length
    const deliveredShipments = allActiveTrackings.filter(t => t.isDelivered).length
    const deliveryRate = (deliveredShipments / totalShipments) * 100

    // 배송업체별 성능
    const performanceByProvider: Record<string, {
      name: string
      total: number
      delivered: number
      averageTime: number
      onTimeRate: number
    }> = {}

    allActiveTrackings.forEach(tracking => {
      const providerId = tracking.provider.id
      if (!performanceByProvider[providerId]) {
        performanceByProvider[providerId] = {
          name: tracking.provider.nameKo,
          total: 0,
          delivered: 0,
          averageTime: 0,
          onTimeRate: 0
        }
      }

      performanceByProvider[providerId].total++
      if (tracking.isDelivered) {
        performanceByProvider[providerId].delivered++
      }
    })

    // 평균 배송 시간 계산
    const deliveredWithTime = allActiveTrackings.filter(t => 
      t.isDelivered && t.actualDelivery && t.events.length > 0
    )

    const averageDeliveryTime = deliveredWithTime.length > 0 
      ? deliveredWithTime.reduce((sum, tracking) => {
          const startTime = tracking.events[0].timestamp.getTime()
          const endTime = tracking.actualDelivery!.getTime()
          return sum + (endTime - startTime)
        }, 0) / deliveredWithTime.length / (1000 * 60 * 60 * 24) // 일 단위
      : 0

    return {
      totalShipments,
      deliveredShipments,
      deliveryRate,
      averageDeliveryTime,
      onTimeDeliveryRate: 85, // 모의 데이터
      delayedShipments: allActiveTrackings.filter(t => {
        return t.estimatedDelivery && new Date() > t.estimatedDelivery && !t.isDelivered
      }).length,
      performanceByProvider
    }
  }, [allActiveTrackings])

  return analytics
}