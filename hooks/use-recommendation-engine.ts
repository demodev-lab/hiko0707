/**
 * Recommendation Engine Hook
 * 맞춤 추천 시스템을 위한 React Hook
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UserRecommendation,
  RecommendationItem,
  RecommendationConfig,
  RecommendationStats,
  recommendationEngineService 
} from '@/lib/services/recommendation-engine'
import { toast } from 'sonner'

/**
 * 추천 엔진 Hook
 */
export function useRecommendationEngine(userId?: string) {
  const queryClient = useQueryClient()

  // 사용자 추천 조회
  const {
    data: userRecommendations = [],
    isLoading: isLoadingRecommendations,
    refetch: refetchRecommendations
  } = useQuery({
    queryKey: ['user-recommendations', userId],
    queryFn: async () => {
      if (!userId) return []
      return recommendationEngineService.getUserRecommendations(userId)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 15 * 60 * 1000 // 15분마다 자동 새로고침
  })

  // 추천 통계 조회
  const {
    data: recommendationStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['recommendation-stats'],
    queryFn: async () => {
      return recommendationEngineService.getStats('weekly')
    },
    staleTime: 10 * 60 * 1000, // 10분
    refetchInterval: 30 * 60 * 1000 // 30분마다 자동 새로고침
  })

  // 추천 생성 Mutation
  const generateRecommendationsMutation = useMutation({
    mutationFn: async ({
      userId,
      config
    }: {
      userId: string
      config?: Partial<RecommendationConfig>
    }) => {
      return await recommendationEngineService.generateRecommendations(userId, config)
    },
    onSuccess: (recommendations) => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
      toast.success(`${recommendations.length}개의 새로운 추천을 생성했습니다`)
    },
    onError: (error) => {
      console.error('Failed to generate recommendations:', error)
      toast.error('추천 생성에 실패했습니다')
    }
  })

  // 클릭 기록 Mutation
  const recordClickMutation = useMutation({
    mutationFn: async ({
      recommendationId,
      itemId
    }: {
      recommendationId: string
      itemId?: string
    }) => {
      return await recommendationEngineService.recordClick(recommendationId, itemId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-stats'] })
    },
    onError: (error) => {
      console.error('Failed to record click:', error)
    }
  })

  // 적용 기록 Mutation
  const recordApplicationMutation = useMutation({
    mutationFn: async ({
      recommendationId,
      orderId
    }: {
      recommendationId: string
      orderId?: string
    }) => {
      return await recommendationEngineService.recordApplication(recommendationId, orderId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-stats'] })
      toast.success('추천이 성공적으로 적용되었습니다')
    },
    onError: (error) => {
      console.error('Failed to record application:', error)
      toast.error('적용 기록에 실패했습니다')
    }
  })

  // 피드백 기록 Mutation
  const recordFeedbackMutation = useMutation({
    mutationFn: async ({
      recommendationId,
      feedback
    }: {
      recommendationId: string
      feedback: UserRecommendation['feedback']
    }) => {
      return await recommendationEngineService.recordFeedback(recommendationId, feedback)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation-stats'] })
      toast.success('피드백이 기록되었습니다')
    },
    onError: (error) => {
      console.error('Failed to record feedback:', error)
      toast.error('피드백 기록에 실패했습니다')
    }
  })

  // 만료된 추천 정리 Mutation
  const clearExpiredMutation = useMutation({
    mutationFn: async () => {
      return recommendationEngineService.clearExpiredRecommendations()
    },
    onSuccess: (clearedCount) => {
      queryClient.invalidateQueries({ queryKey: ['user-recommendations'] })
      if (clearedCount > 0) {
        toast.success(`${clearedCount}개의 만료된 추천을 정리했습니다`)
      }
    },
    onError: (error) => {
      console.error('Failed to clear expired recommendations:', error)
      toast.error('만료된 추천 정리에 실패했습니다')
    }
  })

  // 추천 생성
  const generateRecommendations = useCallback(async (
    targetUserId: string,
    config?: Partial<RecommendationConfig>
  ): Promise<UserRecommendation[] | null> => {
    try {
      const result = await generateRecommendationsMutation.mutateAsync({
        userId: targetUserId,
        config
      })
      return result
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return null
    }
  }, [generateRecommendationsMutation])

  // 클릭 기록
  const recordClick = useCallback(async (
    recommendationId: string,
    itemId?: string
  ): Promise<void> => {
    try {
      await recordClickMutation.mutateAsync({ recommendationId, itemId })
    } catch (error) {
      console.error('Failed to record click:', error)
    }
  }, [recordClickMutation])

  // 적용 기록
  const recordApplication = useCallback(async (
    recommendationId: string,
    orderId?: string
  ): Promise<void> => {
    try {
      await recordApplicationMutation.mutateAsync({ recommendationId, orderId })
    } catch (error) {
      console.error('Failed to record application:', error)
    }
  }, [recordApplicationMutation])

  // 피드백 기록
  const recordFeedback = useCallback(async (
    recommendationId: string,
    feedback: UserRecommendation['feedback']
  ): Promise<void> => {
    try {
      await recordFeedbackMutation.mutateAsync({ recommendationId, feedback })
    } catch (error) {
      console.error('Failed to record feedback:', error)
    }
  }, [recordFeedbackMutation])

  // 만료된 추천 정리
  const clearExpired = useCallback(async (): Promise<number> => {
    try {
      const result = await clearExpiredMutation.mutateAsync()
      return result
    } catch (error) {
      console.error('Failed to clear expired recommendations:', error)
      return 0
    }
  }, [clearExpiredMutation])

  // 타입별 추천 분류
  const recommendationsByType = useMemo(() => {
    const types: Record<UserRecommendation['type'], UserRecommendation[]> = {
      hotdeal: [],
      category: [],
      price_range: [],
      timing: [],
      site: [],
      custom: []
    }

    userRecommendations.forEach(rec => {
      types[rec.type].push(rec)
    })

    return types
  }, [userRecommendations])

  // 우선순위별 추천 분류
  const recommendationsByPriority = useMemo(() => {
    const high = userRecommendations.filter(rec => rec.priority >= 8)
    const medium = userRecommendations.filter(rec => rec.priority >= 5 && rec.priority < 8)
    const low = userRecommendations.filter(rec => rec.priority < 5)

    return { high, medium, low }
  }, [userRecommendations])

  // 상호작용 상태별 추천
  const recommendationsByStatus = useMemo(() => {
    const fresh = userRecommendations.filter(rec => !rec.clicked && !rec.applied)
    const clicked = userRecommendations.filter(rec => rec.clicked && !rec.applied)
    const applied = userRecommendations.filter(rec => rec.applied)
    const withFeedback = userRecommendations.filter(rec => rec.feedback)

    return { fresh, clicked, applied, withFeedback }
  }, [userRecommendations])

  // 추천 요약 통계
  const recommendationSummary = useMemo(() => {
    const total = userRecommendations.length
    const highPriority = recommendationsByPriority.high.length
    const clicked = userRecommendations.filter(rec => rec.clicked).length
    const applied = userRecommendations.filter(rec => rec.applied).length
    const avgConfidence = total > 0 
      ? userRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / total 
      : 0

    // 만료 임박 추천 (24시간 이내)
    const expiringSoon = userRecommendations.filter(rec => {
      const hoursUntilExpiry = (rec.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
      return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24
    }).length

    return {
      total,
      highPriority,
      clicked,
      applied,
      avgConfidence: Math.round(avgConfidence),
      expiringSoon,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      applicationRate: total > 0 ? (applied / total) * 100 : 0
    }
  }, [userRecommendations, recommendationsByPriority])

  // 최근 추천 (24시간 이내)
  const recentRecommendations = useMemo(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return userRecommendations.filter(rec => rec.createdAt > yesterday)
  }, [userRecommendations])

  // 만료 임박 추천 (24시간 이내)
  const expiringSoonRecommendations = useMemo(() => {
    const now = Date.now()
    const tomorrow = now + 24 * 60 * 60 * 1000
    
    return userRecommendations.filter(rec => {
      const expiryTime = rec.expiresAt.getTime()
      return expiryTime > now && expiryTime <= tomorrow
    })
  }, [userRecommendations])

  return {
    // Data
    userRecommendations,
    recommendationStats,
    recommendationsByType,
    recommendationsByPriority,
    recommendationsByStatus,
    recommendationSummary,
    recentRecommendations,
    expiringSoonRecommendations,
    
    // Loading states
    isLoadingRecommendations,
    isLoadingStats,
    
    // Actions
    generateRecommendations,
    recordClick,
    recordApplication,
    recordFeedback,
    clearExpired,
    refetchRecommendations,
    refetchStats,
    
    // Mutation states
    isGenerating: generateRecommendationsMutation.isPending,
    isRecordingClick: recordClickMutation.isPending,
    isRecordingApplication: recordApplicationMutation.isPending,
    isRecordingFeedback: recordFeedbackMutation.isPending,
    isClearingExpired: clearExpiredMutation.isPending,
    
    // Utilities
    getRecommendationsByType: (type: UserRecommendation['type']) => 
      recommendationEngineService.getRecommendationsByType(userId || '', type),
    
    getRecommendationStats: (timeframe?: 'daily' | 'weekly' | 'monthly') =>
      recommendationEngineService.getStats(timeframe)
  }
}

/**
 * 특정 타입의 추천 Hook
 */
export function useRecommendationsByType(
  userId?: string,
  type?: UserRecommendation['type']
) {
  const { recommendationsByType, isLoadingRecommendations, recordClick, recordApplication } = 
    useRecommendationEngine(userId)

  const typeRecommendations = useMemo(() => {
    if (!type) return []
    return recommendationsByType[type] || []
  }, [recommendationsByType, type])

  const topRecommendation = useMemo(() => {
    return typeRecommendations.sort((a, b) => 
      b.priority - a.priority || b.confidence - a.confidence
    )[0] || null
  }, [typeRecommendations])

  return {
    recommendations: typeRecommendations,
    topRecommendation,
    count: typeRecommendations.length,
    isLoading: isLoadingRecommendations,
    recordClick,
    recordApplication
  }
}

/**
 * 추천 대시보드 Hook
 */
export function useRecommendationDashboard() {
  const {
    recommendationStats,
    recommendationSummary,
    recommendationsByType,
    recommendationsByPriority,
    recentRecommendations,
    expiringSoonRecommendations,
    isLoadingStats
  } = useRecommendationEngine()

  // 성과 지표
  const performanceMetrics = useMemo(() => {
    if (!recommendationStats) {
      return {
        totalRecommendations: 0,
        clickRate: 0,
        applicationRate: 0,
        feedbackRate: 0,
        userEngagement: 0
      }
    }

    return {
      totalRecommendations: recommendationStats.totalRecommendations,
      clickRate: recommendationStats.clickRate,
      applicationRate: recommendationStats.applicationRate,
      feedbackRate: recommendationStats.feedbackRate,
      userEngagement: recommendationStats.userEngagement.averageClicksPerUser
    }
  }, [recommendationStats])

  // 타입별 성과
  const typePerformance = useMemo(() => {
    if (!recommendationStats) return []
    
    return recommendationStats.performanceByType
      .sort((a, b) => b.clickRate - a.clickRate)
      .map(perf => ({
        ...perf,
        color: perf.type === 'hotdeal' ? '#EF4444' :
               perf.type === 'category' ? '#10B981' :
               perf.type === 'price_range' ? '#3B82F6' :
               perf.type === 'timing' ? '#F59E0B' :
               perf.type === 'site' ? '#8B5CF6' : '#6B7280'
      }))
  }, [recommendationStats])

  // 카테고리 분포
  const categoryDistribution = useMemo(() => {
    if (!recommendationStats) return []
    
    return recommendationStats.topCategories.map(cat => ({
      name: cat.category,
      value: cat.count,
      clickRate: cat.clickRate,
      color: cat.category === 'electronics' ? '#3B82F6' :
             cat.category === 'fashion' ? '#EC4899' :
             cat.category === 'home' ? '#10B981' : '#6B7280'
    }))
  }, [recommendationStats])

  // 알림이 필요한 항목들
  const alertItems = useMemo(() => {
    const alerts = []
    
    // 만료 임박 추천
    if (expiringSoonRecommendations.length > 0) {
      alerts.push({
        type: 'expiring',
        title: '만료 임박 추천',
        count: expiringSoonRecommendations.length,
        severity: 'medium'
      })
    }
    
    // 클릭률이 낮은 추천 타입
    const lowPerformingTypes = typePerformance.filter(t => t.clickRate < 10)
    if (lowPerformingTypes.length > 0) {
      alerts.push({
        type: 'low_performance',
        title: '저조한 성과 타입',
        count: lowPerformingTypes.length,
        severity: 'low'
      })
    }

    return alerts
  }, [expiringSoonRecommendations, typePerformance])

  return {
    performanceMetrics,
    typePerformance,
    categoryDistribution,
    alertItems,
    recentActivity: {
      recentRecommendations: recentRecommendations.length,
      expiringSoon: expiringSoonRecommendations.length,
      highPriority: recommendationsByPriority.high.length
    },
    isLoading: isLoadingStats
  }
}