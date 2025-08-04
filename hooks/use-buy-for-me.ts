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
import { db } from '@/lib/db/database-service'
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
      return db.buyForMeRequests.findByUserId(currentUser.id)
    },
    enabled: !!currentUser,
  })

  // 새로운 Buy for Me 요청 생성
  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateBuyForMeRequestData) => {
      const newRequest: Omit<BuyForMeRequest, 'id'> = {
        ...data,
        status: 'pending_review',
        requestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      return db.buyForMeRequests.create(newRequest)
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
    return db.buyForMeRequests.findById(id)
  }, [])

  // 견적 승인
  const approveQuoteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // 먼저 견적을 승인하고
      const approvedRequest = await db.buyForMeRequests.approveQuote(requestId)
      // 그다음 상태를 payment_pending으로 변경
      if (approvedRequest) {
        return db.buyForMeRequests.updateStatus(requestId, 'payment_pending')
      }
      return approvedRequest
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
      return db.buyForMeRequests.updateStatus(requestId, 'cancelled')
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
    queryFn: () => db.buyForMeRequests.findAll(),
  })

  // 상태별 요청 조회
  const getRequestsByStatus = useCallback(async (status: BuyForMeRequest['status']) => {
    return db.buyForMeRequests.findByStatus(status)
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
      return db.buyForMeRequests.addQuote(requestId, quote)
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
      return db.buyForMeRequests.addOrderInfo(requestId, orderInfo)
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
      return db.buyForMeRequests.updateTrackingInfo(requestId, trackingNumber, trackingUrl)
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
      return db.buyForMeRequests.updateStatus(requestId, status)
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
      return db.buyForMeRequests.update(request.id, request)
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