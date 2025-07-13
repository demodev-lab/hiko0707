/**
 * Purchase Analytics Hook
 * 구매 패턴 분석을 위한 React Hook
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  PurchasePattern,
  PurchaseInsight,
  RecommendationRule,
  UserSegment,
  AnalyticsMetrics,
  CategoryFrequency,
  purchaseAnalyticsService 
} from '@/lib/services/purchase-analytics'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { User } from '@/types/user'
import { toast } from 'sonner'

/**
 * 구매 패턴 분석 Hook
 */
export function usePurchaseAnalytics() {
  const queryClient = useQueryClient()

  // 전체 분석 메트릭 조회
  const {
    data: analyticsMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['purchase-analytics-metrics'],
    queryFn: async () => {
      return purchaseAnalyticsService.getAnalyticsMetrics()
    },
    staleTime: 10 * 60 * 1000, // 10분
    refetchInterval: 30 * 60 * 1000 // 30분마다 자동 새로고침
  })

  // 사용자 세그먼트 조회
  const {
    data: userSegments = [],
    isLoading: isLoadingSegments,
    refetch: refetchSegments
  } = useQuery({
    queryKey: ['purchase-analytics-segments'],
    queryFn: async () => {
      return purchaseAnalyticsService.getUserSegments()
    },
    staleTime: 30 * 60 * 1000 // 30분
  })

  // 추천 규칙 조회
  const {
    data: recommendationRules = [],
    isLoading: isLoadingRules,
    refetch: refetchRules
  } = useQuery({
    queryKey: ['purchase-analytics-rules'],
    queryFn: async () => {
      return purchaseAnalyticsService.getRecommendationRules()
    },
    staleTime: 15 * 60 * 1000 // 15분
  })

  // 전체 패턴 조회
  const {
    data: allPatterns = [],
    isLoading: isLoadingPatterns,
    refetch: refetchPatterns
  } = useQuery({
    queryKey: ['purchase-analytics-patterns'],
    queryFn: async () => {
      return purchaseAnalyticsService.getAllPatterns()
    },
    staleTime: 5 * 60 * 1000 // 5분
  })

  // 사용자 패턴 분석 Mutation
  const analyzeUserPatternMutation = useMutation({
    mutationFn: async ({
      userId,
      purchases,
      timeframe
    }: {
      userId: string
      purchases: BuyForMeRequest[]
      timeframe?: PurchasePattern['timeframe']
    }) => {
      return await purchaseAnalyticsService.analyzeUserPurchases(userId, purchases, timeframe)
    },
    onSuccess: (pattern) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-patterns'] })
      queryClient.invalidateQueries({ queryKey: ['user-purchase-pattern', pattern.userId] })
      toast.success('구매 패턴 분석이 완료되었습니다')
    },
    onError: (error) => {
      console.error('Failed to analyze user pattern:', error)
      toast.error('구매 패턴 분석에 실패했습니다')
    }
  })

  // 전체 메트릭 계산 Mutation
  const calculateMetricsMutation = useMutation({
    mutationFn: async ({
      allPurchases,
      allUsers
    }: {
      allPurchases: BuyForMeRequest[]
      allUsers: User[]
    }) => {
      return await purchaseAnalyticsService.calculateAnalyticsMetrics(allPurchases, allUsers)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-segments'] })
      toast.success('분석 메트릭이 업데이트되었습니다')
    },
    onError: (error) => {
      console.error('Failed to calculate metrics:', error)
      toast.error('메트릭 계산에 실패했습니다')
    }
  })

  // 추천 규칙 추가 Mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: Omit<RecommendationRule, 'id'>) => {
      return purchaseAnalyticsService.addRecommendationRule(rule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-rules'] })
      toast.success('추천 규칙이 추가되었습니다')
    },
    onError: (error) => {
      console.error('Failed to add rule:', error)
      toast.error('규칙 추가에 실패했습니다')
    }
  })

  // 추천 규칙 수정 Mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<RecommendationRule> 
    }) => {
      return purchaseAnalyticsService.updateRecommendationRule(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-rules'] })
      toast.success('추천 규칙이 수정되었습니다')
    },
    onError: (error) => {
      console.error('Failed to update rule:', error)
      toast.error('규칙 수정에 실패했습니다')
    }
  })

  // 추천 규칙 삭제 Mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = purchaseAnalyticsService.deleteRecommendationRule(id)
      if (!success) throw new Error('Rule not found')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-analytics-rules'] })
      toast.success('추천 규칙이 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error)
      toast.error('규칙 삭제에 실패했습니다')
    }
  })

  // 사용자 패턴 분석
  const analyzeUserPattern = useCallback(async (
    userId: string,
    purchases: BuyForMeRequest[],
    timeframe?: PurchasePattern['timeframe']
  ): Promise<PurchasePattern | null> => {
    try {
      const result = await analyzeUserPatternMutation.mutateAsync({
        userId,
        purchases,
        timeframe
      })
      return result
    } catch (error) {
      console.error('Failed to analyze user pattern:', error)
      return null
    }
  }, [analyzeUserPatternMutation])

  // 전체 메트릭 계산
  const calculateMetrics = useCallback(async (
    allPurchases: BuyForMeRequest[],
    allUsers: User[]
  ): Promise<AnalyticsMetrics | null> => {
    try {
      const result = await calculateMetricsMutation.mutateAsync({
        allPurchases,
        allUsers
      })
      return result
    } catch (error) {
      console.error('Failed to calculate metrics:', error)
      return null
    }
  }, [calculateMetricsMutation])

  // 추천 규칙 추가
  const addRule = useCallback(async (
    rule: Omit<RecommendationRule, 'id'>
  ): Promise<RecommendationRule | null> => {
    try {
      const result = await addRuleMutation.mutateAsync(rule)
      return result
    } catch (error) {
      console.error('Failed to add rule:', error)
      return null
    }
  }, [addRuleMutation])

  // 추천 규칙 수정
  const updateRule = useCallback(async (
    id: string,
    updates: Partial<RecommendationRule>
  ): Promise<RecommendationRule | null> => {
    try {
      const result = await updateRuleMutation.mutateAsync({ id, updates })
      return result
    } catch (error) {
      console.error('Failed to update rule:', error)
      return null
    }
  }, [updateRuleMutation])

  // 추천 규칙 삭제
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

  // 통계 요약
  const analyticsOverview = useMemo(() => {
    if (!analyticsMetrics) {
      return {
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        customerLifetimeValue: 0,
        topCategories: [],
        topSites: [],
        activeSegments: 0
      }
    }

    return {
      ...analyticsMetrics.overview,
      topCategories: analyticsMetrics.topPerformers.categories.slice(0, 5),
      topSites: analyticsMetrics.topPerformers.sites.slice(0, 5),
      activeSegments: userSegments.length
    }
  }, [analyticsMetrics, userSegments])

  // 트렌드 분석
  const trendAnalysis = useMemo(() => {
    if (!analyticsMetrics?.trends) {
      return {
        dailyTrends: [],
        weeklyTrends: [],
        monthlyTrends: [],
        recentGrowth: 0,
        orderVelocity: 0
      }
    }

    const dailyTrends = analyticsMetrics.trends.daily
    const recentWeek = dailyTrends.slice(-7)
    const previousWeek = dailyTrends.slice(-14, -7)

    const recentRevenue = recentWeek.reduce((sum, day) => sum + day.revenue, 0)
    const previousRevenue = previousWeek.reduce((sum, day) => sum + day.revenue, 0)
    
    const recentGrowth = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const orderVelocity = recentWeek.reduce((sum, day) => sum + day.orders, 0) / 7

    return {
      dailyTrends,
      weeklyTrends: analyticsMetrics.trends.weekly,
      monthlyTrends: analyticsMetrics.trends.monthly,
      recentGrowth,
      orderVelocity
    }
  }, [analyticsMetrics])

  // 세그먼트 분석
  const segmentAnalysis = useMemo(() => {
    const totalUsers = analyticsOverview.totalUsers
    
    return userSegments.map(segment => ({
      ...segment,
      percentage: totalUsers > 0 ? (segment.size / totalUsers) * 100 : 0,
      averageValue: segment.size > 0 ? analyticsOverview.totalRevenue / segment.size : 0
    }))
  }, [userSegments, analyticsOverview])

  // 인사이트 요약
  const insightsSummary = useMemo(() => {
    const allInsights = allPatterns.flatMap(pattern => pattern.insights)
    
    const insightsByType = allInsights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const criticalInsights = allInsights.filter(insight => 
      insight.importance === 'critical' || insight.importance === 'high'
    )

    const actionableInsights = allInsights.filter(insight => insight.actionable)

    return {
      totalInsights: allInsights.length,
      insightsByType,
      criticalInsights: criticalInsights.length,
      actionableInsights: actionableInsights.length,
      recentInsights: allInsights
        .filter(insight => 
          new Date(insight.generatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        )
        .length
    }
  }, [allPatterns])

  // 추천 성과
  const recommendationPerformance = useMemo(() => {
    const totalRules = recommendationRules.length
    const activeRules = recommendationRules.filter(rule => rule.enabled).length
    const rulesByPriority = recommendationRules.reduce((acc, rule) => {
      const priority = rule.priority >= 8 ? 'high' : rule.priority >= 5 ? 'medium' : 'low'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRules,
      activeRules,
      inactiveRules: totalRules - activeRules,
      rulesByPriority,
      utilizationRate: totalRules > 0 ? (activeRules / totalRules) * 100 : 0
    }
  }, [recommendationRules])

  return {
    // Data
    analyticsMetrics,
    userSegments,
    recommendationRules,
    allPatterns,
    analyticsOverview,
    trendAnalysis,
    segmentAnalysis,
    insightsSummary,
    recommendationPerformance,
    
    // Loading states
    isLoadingMetrics,
    isLoadingSegments,
    isLoadingRules,
    isLoadingPatterns,
    
    // Actions
    analyzeUserPattern,
    calculateMetrics,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchMetrics,
    refetchSegments,
    refetchRules,
    refetchPatterns,
    
    // Mutation states
    isAnalyzing: analyzeUserPatternMutation.isPending,
    isCalculating: calculateMetricsMutation.isPending,
    isAddingRule: addRuleMutation.isPending,
    isUpdatingRule: updateRuleMutation.isPending,
    isDeletingRule: deleteRuleMutation.isPending,
    
    // Utilities
    getUserPattern: (userId: string, timeframe?: PurchasePattern['timeframe']) => 
      purchaseAnalyticsService.getUserPattern(userId, timeframe)
  }
}

/**
 * 특정 사용자의 구매 패턴 Hook
 */
export function useUserPurchasePattern(
  userId?: string, 
  timeframe: PurchasePattern['timeframe'] = 'monthly'
) {
  const { allPatterns, analyzeUserPattern, isAnalyzing } = usePurchaseAnalytics()

  // 특정 사용자의 패턴
  const userPattern = useMemo(() => {
    if (!userId) return null
    return allPatterns.find(pattern => 
      pattern.userId === userId && pattern.timeframe === timeframe
    ) || null
  }, [allPatterns, userId, timeframe])

  // 패턴 분석
  const analyzePattern = useCallback(async (purchases: BuyForMeRequest[]) => {
    if (!userId) return null
    return await analyzeUserPattern(userId, purchases, timeframe)
  }, [userId, timeframe, analyzeUserPattern])

  // 카테고리 선호도
  const categoryPreferences = useMemo(() => {
    if (!userPattern) return []
    return userPattern.patterns.frequentCategories
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }, [userPattern])

  // 구매 타이밍 패턴
  const timingPatterns = useMemo(() => {
    if (!userPattern) return { hourly: [], daily: [], monthly: [] }
    
    const { purchaseTiming } = userPattern.patterns
    
    return {
      hourly: purchaseTiming.filter(p => p.type === 'hourly'),
      daily: purchaseTiming.filter(p => p.type === 'daily'),
      monthly: purchaseTiming.filter(p => p.type === 'monthly')
    }
  }, [userPattern])

  // 인사이트 요약
  const insights = useMemo(() => {
    if (!userPattern) return []
    return userPattern.insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }, [userPattern])

  return {
    userPattern,
    categoryPreferences,
    timingPatterns,
    insights,
    analyzePattern,
    isAnalyzing
  }
}

/**
 * 분석 대시보드 Hook
 */
export function useAnalyticsDashboard() {
  const {
    analyticsOverview,
    trendAnalysis,
    segmentAnalysis,
    insightsSummary,
    recommendationPerformance,
    isLoadingMetrics
  } = usePurchaseAnalytics()

  // 핵심 지표 카드 데이터
  const keyMetrics = useMemo(() => [
    {
      title: '총 주문수',
      value: analyticsOverview.totalOrders.toLocaleString(),
      change: trendAnalysis.recentGrowth,
      icon: 'ShoppingCart',
      color: 'blue'
    },
    {
      title: '총 매출',
      value: `₩${analyticsOverview.totalRevenue.toLocaleString()}`,
      change: trendAnalysis.recentGrowth,
      icon: 'DollarSign',
      color: 'green'
    },
    {
      title: '평균 주문가',
      value: `₩${Math.round(analyticsOverview.averageOrderValue).toLocaleString()}`,
      change: 0, // 간소화
      icon: 'TrendingUp',
      color: 'purple'
    },
    {
      title: '주문 속도',
      value: `${trendAnalysis.orderVelocity.toFixed(1)}/일`,
      change: 0, // 간소화
      icon: 'Zap',
      color: 'orange'
    }
  ], [analyticsOverview, trendAnalysis])

  // 상위 카테고리 성능
  const topCategories = useMemo(() => {
    return analyticsOverview.topCategories.map(category => ({
      ...category,
      percentage: analyticsOverview.totalRevenue > 0 
        ? (category.totalAmount / analyticsOverview.totalRevenue) * 100 
        : 0
    }))
  }, [analyticsOverview])

  // 세그먼트 분포
  const segmentDistribution = useMemo(() => {
    return segmentAnalysis.map(segment => ({
      name: segment.name,
      value: segment.size,
      percentage: segment.percentage,
      color: segment.id === 'segment-premium' ? '#10B981' :
             segment.id === 'segment-regular' ? '#3B82F6' : '#6B7280'
    }))
  }, [segmentAnalysis])

  return {
    keyMetrics,
    topCategories,
    segmentDistribution,
    trendData: trendAnalysis.dailyTrends,
    insightsSummary,
    recommendationPerformance,
    isLoading: isLoadingMetrics
  }
}