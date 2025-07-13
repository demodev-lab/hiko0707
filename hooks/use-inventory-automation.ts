/**
 * Inventory Automation Hook
 * 재고 자동화를 위한 React Hook
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  InventoryStatus,
  InventoryAlert,
  InventoryRule,
  StockCheckResult,
  inventoryAutomationService 
} from '@/lib/services/inventory-automation'
import { toast } from 'sonner'

/**
 * 재고 자동화 Hook
 */
export function useInventoryAutomation() {
  const queryClient = useQueryClient()

  // 모든 재고 상태 조회
  const {
    data: inventoryStatuses = [],
    isLoading: isLoadingInventory,
    refetch: refetchInventory
  } = useQuery({
    queryKey: ['inventory-automation-statuses'],
    queryFn: async () => {
      return inventoryAutomationService.getAllInventoryStatuses()
    },
    staleTime: 2 * 60 * 1000, // 2분
    refetchInterval: 5 * 60 * 1000 // 5분마다 자동 새로고침
  })

  // 알림 목록 조회
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['inventory-automation-alerts'],
    queryFn: async () => {
      return inventoryAutomationService.getAlerts()
    },
    staleTime: 1 * 60 * 1000, // 1분
    refetchInterval: 2 * 60 * 1000 // 2분마다 자동 새로고침
  })

  // 자동화 규칙 조회
  const {
    data: rules = [],
    isLoading: isLoadingRules,
    refetch: refetchRules
  } = useQuery({
    queryKey: ['inventory-automation-rules'],
    queryFn: async () => {
      return inventoryAutomationService.getRules()
    },
    staleTime: 10 * 60 * 1000 // 10분
  })

  // 새 재고 모니터링 등록 Mutation
  const registerInventoryMutation = useMutation({
    mutationFn: async ({
      productUrl,
      productTitle,
      site,
      metadata
    }: {
      productUrl: string
      productTitle: string
      site: string
      metadata?: {
        variant?: string
        seller?: string
        category?: string
        brand?: string
      }
    }) => {
      return await inventoryAutomationService.registerInventoryTracking(
        productUrl,
        productTitle,
        site,
        metadata
      )
    },
    onSuccess: (newInventory) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-statuses'] })
      toast.success(`재고 모니터링이 등록되었습니다 (${newInventory.productTitle})`)
    },
    onError: (error) => {
      console.error('Failed to register inventory tracking:', error)
      toast.error('재고 모니터링 등록에 실패했습니다')
    }
  })

  // 재고 상태 확인 Mutation
  const checkInventoryMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await inventoryAutomationService.checkInventoryStatus(productId)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-statuses'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-alerts'] })
      
      if (result?.checkSuccessful) {
        toast.success('재고 정보가 업데이트되었습니다')
      } else {
        toast.error('재고 확인에 실패했습니다')
      }
    },
    onError: (error) => {
      console.error('Failed to check inventory:', error)
      toast.error('재고 확인에 실패했습니다')
    }
  })

  // 전체 재고 강제 확인 Mutation
  const forceCheckAllMutation = useMutation({
    mutationFn: async () => {
      return await inventoryAutomationService.forceCheckAll()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-statuses'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-alerts'] })
      toast.success('모든 재고 정보가 업데이트되었습니다')
    },
    onError: (error) => {
      console.error('Failed to force check all inventories:', error)
      toast.error('재고 일괄 확인에 실패했습니다')
    }
  })

  // 알림 확인 Mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ alertId, acknowledgedBy }: { alertId: string, acknowledgedBy: string }) => {
      return await inventoryAutomationService.acknowledgeAlert(alertId, acknowledgedBy)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-alerts'] })
      toast.success('알림이 확인되었습니다')
    },
    onError: (error) => {
      console.error('Failed to acknowledge alert:', error)
      toast.error('알림 확인에 실패했습니다')
    }
  })

  // 규칙 추가 Mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<InventoryRule, 'id'>) => {
      return inventoryAutomationService.addRule(rule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-rules'] })
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
      updates: Partial<InventoryRule> 
    }) => {
      return inventoryAutomationService.updateRule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-rules'] })
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
      const success = inventoryAutomationService.deleteRule(id)
      if (!success) throw new Error('Rule not found')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-automation-rules'] })
      toast.success('자동화 규칙이 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error)
      toast.error('규칙 삭제에 실패했습니다')
    }
  })

  // 재고 모니터링 등록
  const registerInventoryTracking = useCallback(async (
    productUrl: string,
    productTitle: string,
    site: string,
    metadata?: {
      variant?: string
      seller?: string
      category?: string
      brand?: string
    }
  ): Promise<InventoryStatus | null> => {
    try {
      const result = await registerInventoryMutation.mutateAsync({
        productUrl,
        productTitle,
        site,
        metadata
      })
      return result
    } catch (error) {
      console.error('Failed to register inventory tracking:', error)
      return null
    }
  }, [registerInventoryMutation])

  // 재고 상태 확인
  const checkInventoryStatus = useCallback(async (productId: string): Promise<StockCheckResult | null> => {
    try {
      const result = await checkInventoryMutation.mutateAsync(productId)
      return result
    } catch (error) {
      console.error('Failed to check inventory status:', error)
      return null
    }
  }, [checkInventoryMutation])

  // 전체 재고 강제 확인
  const forceCheckAll = useCallback(async (): Promise<void> => {
    try {
      await forceCheckAllMutation.mutateAsync()
    } catch (error) {
      console.error('Failed to force check all inventories:', error)
    }
  }, [forceCheckAllMutation])

  // 알림 확인
  const acknowledgeAlert = useCallback(async (alertId: string, acknowledgedBy: string): Promise<boolean> => {
    try {
      await acknowledgeAlertMutation.mutateAsync({ alertId, acknowledgedBy })
      return true
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
      return false
    }
  }, [acknowledgeAlertMutation])

  // 규칙 추가
  const addRule = useCallback(async (
    rule: Omit<InventoryRule, 'id'>
  ): Promise<InventoryRule | null> => {
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
    updates: Partial<InventoryRule>
  ): Promise<InventoryRule | null> => {
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

  // 재고 통계
  const inventoryStats = useMemo(() => {
    if (inventoryStatuses.length === 0) {
      return {
        totalItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        unknown: 0,
        sitesStats: {},
        categoryStats: {}
      }
    }

    const stats = {
      totalItems: inventoryStatuses.length,
      inStock: inventoryStatuses.filter(item => item.stockLevel === 'in_stock').length,
      lowStock: inventoryStatuses.filter(item => item.stockLevel === 'low_stock').length,
      outOfStock: inventoryStatuses.filter(item => item.stockLevel === 'out_of_stock').length,
      unknown: inventoryStatuses.filter(item => item.stockLevel === 'unknown').length,
      sitesStats: {} as Record<string, number>,
      categoryStats: {} as Record<string, number>
    }

    // 사이트별 통계
    inventoryStatuses.forEach(item => {
      stats.sitesStats[item.site] = (stats.sitesStats[item.site] || 0) + 1
    })

    // 카테고리별 통계
    inventoryStatuses.forEach(item => {
      const category = item.metadata?.category || 'unknown'
      stats.categoryStats[category] = (stats.categoryStats[category] || 0) + 1
    })

    return stats
  }, [inventoryStatuses])

  // 알림 통계
  const alertStats = useMemo(() => {
    if (alerts.length === 0) {
      return {
        totalAlerts: 0,
        unacknowledged: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        typeStats: {}
      }
    }

    const stats = {
      totalAlerts: alerts.length,
      unacknowledged: alerts.filter(alert => !alert.acknowledged).length,
      critical: alerts.filter(alert => alert.severity === 'critical').length,
      high: alerts.filter(alert => alert.severity === 'high').length,
      medium: alerts.filter(alert => alert.severity === 'medium').length,
      low: alerts.filter(alert => alert.severity === 'low').length,
      typeStats: {} as Record<string, number>
    }

    // 알림 타입별 통계
    alerts.forEach(alert => {
      stats.typeStats[alert.alertType] = (stats.typeStats[alert.alertType] || 0) + 1
    })

    return stats
  }, [alerts])

  // 규칙 통계
  const ruleStats = useMemo(() => {
    const totalRules = rules.length
    const activeRules = rules.filter(rule => rule.enabled).length
    const rulesByPriority = rules.reduce((acc, rule) => {
      const priority = rule.priority >= 8 ? 'high' : rule.priority >= 5 ? 'medium' : 'low'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRules,
      activeRules,
      inactiveRules: totalRules - activeRules,
      rulesByPriority
    }
  }, [rules])

  // 긴급 알림 (미확인된 critical/high 심각도 알림)
  const urgentAlerts = useMemo(() => {
    return alerts.filter(alert => 
      !alert.acknowledged && 
      (alert.severity === 'critical' || alert.severity === 'high')
    )
  }, [alerts])

  // 최근 재고 변화
  const recentChanges = useMemo(() => {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    return inventoryStatuses.filter(item => 
      item.lastChecked > last24Hours && 
      (item.priceChanged || item.currentStock !== item.previousStock)
    )
  }, [inventoryStatuses])

  return {
    // Data
    inventoryStatuses,
    alerts,
    urgentAlerts,
    rules,
    inventoryStats,
    alertStats,
    ruleStats,
    recentChanges,
    
    // Loading states
    isLoadingInventory,
    isLoadingAlerts,
    isLoadingRules,
    
    // Actions
    registerInventoryTracking,
    checkInventoryStatus,
    forceCheckAll,
    acknowledgeAlert,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchInventory,
    refetchAlerts,
    refetchRules,
    
    // Mutation states
    isRegistering: registerInventoryMutation.isPending,
    isChecking: checkInventoryMutation.isPending,
    isForceChecking: forceCheckAllMutation.isPending,
    isAcknowledging: acknowledgeAlertMutation.isPending,
    isAddingRule: addRuleMutation.isPending,
    isUpdatingRule: updateRuleMutation.isPending,
    isDeletingRule: deleteRuleMutation.isPending,
    
    // Utilities
    getInventoryStatus: (productId: string) => 
      inventoryAutomationService.getInventoryStatus(productId),
    
    getUnacknowledgedAlerts: () => 
      inventoryAutomationService.getAlerts(false),
    
    getAcknowledgedAlerts: () => 
      inventoryAutomationService.getAlerts(true)
  }
}

/**
 * 특정 상품의 재고 모니터링 Hook
 */
export function useProductInventory(productId?: string) {
  const { inventoryStatuses, alerts, checkInventoryStatus, isChecking } = useInventoryAutomation()

  // 특정 상품의 재고 상태
  const productInventory = useMemo(() => {
    if (!productId) return null
    return inventoryStatuses.find(item => item.productId === productId) || null
  }, [inventoryStatuses, productId])

  // 특정 상품 관련 알림
  const productAlerts = useMemo(() => {
    if (!productInventory) return []
    return alerts.filter(alert => alert.inventoryId === productInventory.id)
  }, [alerts, productInventory])

  // 재고 확인
  const checkStatus = useCallback(async () => {
    if (!productId) return null
    return await checkInventoryStatus(productId)
  }, [productId, checkInventoryStatus])

  return {
    productInventory,
    productAlerts,
    checkStatus,
    isChecking
  }
}