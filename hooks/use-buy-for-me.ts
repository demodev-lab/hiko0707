'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-buy-for-me.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseBuyForMe() - 완전한 Supabase 기반 대리구매 시스템
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { requests, createRequest, cancelRequest } = useBuyForMe()
 * 신규: const { requests, createRequest, cancelRequest } = useSupabaseBuyForMe()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BuyForMeRequest, CreateBuyForMeRequestData } from '@/types/buy-for-me'
import { useAuth } from './use-auth'
import { toast } from 'sonner'
import { notificationService } from '@/lib/notifications/notification-service'

export function useBuyForMe() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()

  // 현재 사용자의 Buy for Me 요청 목록 조회
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['buyForMeRequests', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return []
      // Deprecated - LocalStorage removed
      console.warn('useBuyForMe is deprecated. Use useSupabaseBuyForMe instead.')
      return []
    },
    enabled: !!currentUser,
  })

  // 새로운 Buy for Me 요청 생성
  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateBuyForMeRequestData) => {
      // Deprecated - LocalStorage removed
      console.warn('useBuyForMe.createRequest is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('대리 구매 요청 성공! 관리자가 검토 후 견적서를 보내드립니다.')
      // 관리자에게 알림 발송
      notificationService.notifyNewRequest(newRequest)
    },
    onError: (error) => {
      toast.error('요청 실패. 다시 시도해주세요.')
    },
  })

  // 특정 요청 조회
  const getRequest = useCallback(async (id: string) => {
    console.warn('useBuyForMe.getRequest is deprecated. Use useSupabaseBuyForMe instead.')
    return null
  }, [])

  // 견적 승인
  const approveQuoteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.warn('useBuyForMe.approveQuote is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('견적 승인 완료! 결제 방법에 대한 안내를 확인해주세요.')
      // 관리자에게 견적 승인 알림
      if (request) {
        notificationService.notifyQuoteApproved(request)
      }
    },
  })

  // 요청 취소
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.warn('useBuyForMe.cancelRequest is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('대리 구매 요청이 취소되었습니다.')
    },
  })

  return {
    requests,
    isLoading,
    createRequest: createRequestMutation.mutate,
    isCreating: createRequestMutation.isPending,
    getRequest,
    approveQuote: approveQuoteMutation.mutate,
    isApproving: approveQuoteMutation.isPending,
    cancelRequest: cancelRequestMutation.mutate,
    isCancelling: cancelRequestMutation.isPending,
  }
}

// 관리자용 Hook
export function useBuyForMeAdmin() {
  const queryClient = useQueryClient()

  // 모든 Buy for Me 요청 조회
  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['buyForMeRequests', 'admin'],
    queryFn: () => {
      console.warn('useBuyForMeAdmin is deprecated. Use useSupabaseBuyForMe instead.')
      return []
    },
  })

  // 상태별 요청 조회
  const getRequestsByStatus = useCallback(async (status: BuyForMeRequest['status']) => {
    console.warn('useBuyForMeAdmin.getRequestsByStatus is deprecated. Use useSupabaseBuyForMe instead.')
    return []
  }, [])

  // 견적서 작성
  const createQuoteMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      quote 
    }: { 
      requestId: string
      quote: BuyForMeRequest['quote'] 
    }) => {
      console.warn('useBuyForMeAdmin.createQuote is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('견적서 발송 완료! 사용자에게 견적서가 전송되었습니다.')
      // 사용자에게 견적서 알림
      if (request) {
        notificationService.notifyQuoteSent(request)
      }
    },
  })

  // 주문 정보 업데이트
  const updateOrderInfoMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      orderInfo 
    }: { 
      requestId: string
      orderInfo: BuyForMeRequest['orderInfo'] 
    }) => {
      console.warn('useBuyForMeAdmin.updateOrderInfo is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('주문 정보가 성공적으로 업데이트되었습니다.')
    },
  })

  // 배송 정보 업데이트
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      trackingNumber,
      trackingUrl 
    }: { 
      requestId: string
      trackingNumber: string
      trackingUrl?: string 
    }) => {
      console.warn('useBuyForMeAdmin.updateTracking is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('트래킹 번호가 성공적으로 업데이트되었습니다.')
      // 사용자에게 배송 시작 알림
      if (request) {
        notificationService.notifyOrderShipped(request)
      }
    },
  })

  // 상태 업데이트
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status 
    }: { 
      requestId: string
      status: BuyForMeRequest['status'] 
    }) => {
      console.warn('useBuyForMeAdmin.updateStatus is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: (request, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
      toast.success('요청 상태가 성공적으로 업데이트되었습니다.')
      // 상태에 따른 알림 발송
      if (request) {
        if (variables.status === 'payment_completed') {
          notificationService.notifyPaymentConfirmed(request)
        } else if (variables.status === 'delivered') {
          notificationService.notifyOrderDelivered(request)
        }
      }
    },
  })

  // 전체 요청 업데이트 (견적서 작성 시 사용)
  const updateRequestMutation = useMutation({
    mutationFn: async (request: BuyForMeRequest) => {
      console.warn('useBuyForMeAdmin.updateRequest is deprecated. Use useSupabaseBuyForMe instead.')
      throw new Error('LocalStorage BuyForMe is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyForMeRequests'] })
    },
    onError: (error) => {
      toast.error('요청 업데이트 중 오류가 발생했습니다.')
    },
  })

  return {
    allRequests,
    isLoading,
    getRequestsByStatus,
    createQuote: createQuoteMutation.mutate,
    isCreatingQuote: createQuoteMutation.isPending,
    updateOrderInfo: updateOrderInfoMutation.mutate,
    isUpdatingOrderInfo: updateOrderInfoMutation.isPending,
    updateTracking: updateTrackingMutation.mutate,
    isUpdatingTracking: updateTrackingMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateRequest: updateRequestMutation.mutateAsync,
  }
}