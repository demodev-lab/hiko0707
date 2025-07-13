/**
 * Quote Automation Hook
 * 견적서 자동화를 위한 React Hook
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  AutoQuoteRule,
  QuoteAutomationResult,
  quoteAutomationService 
} from '@/lib/services/quote-automation'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { PriceCheckResult } from '@/lib/services/price-verification'
import { toast } from 'sonner'

/**
 * 견적서 자동화 Hook
 */
export function useQuoteAutomation() {
  const queryClient = useQueryClient()
  const [isGenerating, setIsGenerating] = useState(false)

  // 자동화 규칙 조회
  const {
    data: rules = [],
    isLoading: isLoadingRules,
    error: rulesError,
    refetch: refetchRules
  } = useQuery({
    queryKey: ['quote-automation-rules'],
    queryFn: async () => {
      return quoteAutomationService.getRules()
    },
    staleTime: 5 * 60 * 1000 // 5분
  })

  // 템플릿 조회
  const {
    data: templates = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['quote-templates'],
    queryFn: async () => {
      return quoteAutomationService.getTemplates()
    },
    staleTime: 10 * 60 * 1000 // 10분
  })

  // 자동 견적서 생성 Mutation
  const generateQuoteMutation = useMutation({
    mutationFn: async ({ 
      request, 
      priceCheck 
    }: { 
      request: BuyForMeRequest
      priceCheck?: PriceCheckResult 
    }) => {
      return await quoteAutomationService.generateAutoQuote(request, priceCheck)
    },
    onSuccess: (result) => {
      toast.success(`자동 견적서가 생성되었습니다 (신뢰도: ${result.confidence}%)`)
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(warning)
        })
      }
    },
    onError: (error) => {
      console.error('Failed to generate auto quote:', error)
      toast.error('자동 견적서 생성에 실패했습니다')
    }
  })

  // 규칙 추가 Mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<AutoQuoteRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      return quoteAutomationService.addRule(rule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-automation-rules'] })
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
      updates: Partial<AutoQuoteRule> 
    }) => {
      return quoteAutomationService.updateRule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-automation-rules'] })
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
      const success = quoteAutomationService.deleteRule(id)
      if (!success) throw new Error('Rule not found')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-automation-rules'] })
      toast.success('자동화 규칙이 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error)
      toast.error('규칙 삭제에 실패했습니다')
    }
  })

  // 자동 견적서 생성
  const generateAutoQuote = useCallback(async (
    request: BuyForMeRequest,
    priceCheck?: PriceCheckResult
  ): Promise<QuoteAutomationResult | null> => {
    try {
      setIsGenerating(true)
      const result = await generateQuoteMutation.mutateAsync({ request, priceCheck })
      return result
    } catch (error) {
      console.error('Failed to generate auto quote:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [generateQuoteMutation])

  // 규칙 추가
  const addRule = useCallback(async (
    rule: Omit<AutoQuoteRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AutoQuoteRule | null> => {
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
    updates: Partial<AutoQuoteRule>
  ): Promise<AutoQuoteRule | null> => {
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
    const result = await updateRule(id, { enabled })
    return !!result
  }, [updateRule])

  // 통계 계산
  const stats = useMemo(() => {
    const totalRules = rules.length
    const activeRules = rules.filter(rule => rule.enabled).length
    const highPriorityRules = rules.filter(rule => rule.priority >= 8).length
    
    return {
      totalRules,
      activeRules,
      inactiveRules: totalRules - activeRules,
      highPriorityRules,
      automationCoverage: totalRules > 0 ? Math.round((activeRules / totalRules) * 100) : 0
    }
  }, [rules])

  // 적용 가능한 규칙 찾기
  const getApplicableRules = useCallback((request: BuyForMeRequest): AutoQuoteRule[] => {
    return rules
      .filter(rule => rule.enabled)
      .filter(rule => {
        // 간단한 조건 검사 (실제로는 서비스에서 처리)
        return rule.conditions.length > 0
      })
      .sort((a, b) => b.priority - a.priority)
  }, [rules])

  // 자동화 가능 여부 확인
  const canAutomate = useCallback((request: BuyForMeRequest): boolean => {
    const applicableRules = getApplicableRules(request)
    return applicableRules.length > 0
  }, [getApplicableRules])

  // 예상 자동화 수준 계산
  const estimateAutomationLevel = useCallback((request: BuyForMeRequest): 'full' | 'partial' | 'manual' => {
    const applicableRules = getApplicableRules(request)
    
    if (applicableRules.length >= 3) return 'full'
    if (applicableRules.length >= 1) return 'partial'
    return 'manual'
  }, [getApplicableRules])

  return {
    // Data
    rules,
    templates,
    stats,
    
    // Loading states
    isLoadingRules,
    isLoadingTemplates,
    isGenerating,
    
    // Actions
    generateAutoQuote,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchRules,
    
    // Utilities
    getApplicableRules,
    canAutomate,
    estimateAutomationLevel,
    
    // Mutation states
    isAddingRule: addRuleMutation.isPending,
    isUpdatingRule: updateRuleMutation.isPending,
    isDeletingRule: deleteRuleMutation.isPending,
    
    // Errors
    rulesError
  }
}

/**
 * 견적서 자동화 분석 Hook
 */
export function useQuoteAutomationAnalytics() {
  const [dateRange, setDateRange] = useState<{
    start: Date
    end: Date
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30일 전
    end: new Date()
  })

  // 자동화 성능 통계 조회
  const {
    data: analytics,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ['quote-automation-analytics', dateRange],
    queryFn: async () => {
      // 실제 구현에서는 API 호출
      return {
        totalQuotes: 245,
        automatedQuotes: 208,
        manualQuotes: 37,
        automationRate: 85,
        averageProcessingTime: 2.3,
        successRate: 94,
        errorRate: 6,
        timeSaved: 156, // hours
        costSaved: 780000, // KRW
        mostUsedRules: [
          { id: 'rule-1', name: '고액 상품 할인', usage: 45 },
          { id: 'rule-2', name: '전자제품 추가 수수료', usage: 38 },
          { id: 'rule-3', name: '다량 주문 할인', usage: 25 }
        ],
        dailyStats: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          automated: Math.floor(Math.random() * 15) + 5,
          manual: Math.floor(Math.random() * 5) + 1,
          errors: Math.floor(Math.random() * 3)
        }))
      }
    },
    staleTime: 5 * 60 * 1000 // 5분
  })

  const updateDateRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end })
  }, [])

  // 성능 지표 계산
  const performanceMetrics = useMemo(() => {
    if (!analytics) return null

    const efficiency = analytics.timeSaved / (analytics.totalQuotes * 0.5) // 평균 수동 처리 시간 0.5시간 가정
    const roi = analytics.costSaved / (analytics.totalQuotes * 1000) // 개발 비용 가정

    return {
      efficiency: Math.min(efficiency * 100, 100),
      roi: roi * 100,
      qualityScore: (analytics.successRate + (100 - analytics.errorRate)) / 2
    }
  }, [analytics])

  return {
    // Data
    analytics,
    performanceMetrics,
    dateRange,
    
    // Loading state
    isLoadingAnalytics,
    
    // Actions
    updateDateRange
  }
}

/**
 * 실시간 견적서 자동화 Hook
 */
export function useRealtimeQuoteAutomation() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string
    type: 'rule_triggered' | 'quote_generated' | 'manual_intervention'
    ruleId?: string
    requestId: string
    timestamp: Date
    result: 'success' | 'warning' | 'error'
    message: string
  }>>([])

  // 실시간 모니터링 시작/중지
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev)
    
    if (!isMonitoring) {
      // 실제 구현에서는 WebSocket 연결
      toast.success('실시간 모니터링이 시작되었습니다')
    } else {
      toast.info('실시간 모니터링이 중지되었습니다')
    }
  }, [isMonitoring])

  // 활동 로그 추가 (모의)
  const addActivity = useCallback((activity: Omit<typeof recentActivities[0], 'id' | 'timestamp'>) => {
    const newActivity = {
      ...activity,
      id: `activity-${Date.now()}`,
      timestamp: new Date()
    }
    
    setRecentActivities(prev => [newActivity, ...prev].slice(0, 50)) // 최근 50개만 유지
  }, [])

  // 통계
  const activityStats = useMemo(() => {
    const last24h = recentActivities.filter(
      activity => Date.now() - activity.timestamp.getTime() < 24 * 60 * 60 * 1000
    )
    
    return {
      total: last24h.length,
      success: last24h.filter(a => a.result === 'success').length,
      warnings: last24h.filter(a => a.result === 'warning').length,
      errors: last24h.filter(a => a.result === 'error').length
    }
  }, [recentActivities])

  return {
    // State
    isMonitoring,
    recentActivities,
    activityStats,
    
    // Actions
    toggleMonitoring,
    addActivity
  }
}