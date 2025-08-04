'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-payments.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseOrder() - Supabase 기반 결제 시스템 (payments 테이블 포함)
 * - useSupabaseBuyForMe() - 대리구매 결제 처리
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { data: payments } = usePayments(userId)
 * 신규: const { payments } = useSupabaseOrder()
 * 
 * 기존: const { mutate: createPayment } = useCreatePayment()
 * 신규: 주문 시스템과 통합된 결제 처리 사용
 * 
 * 기존: const { mutate: updateStatus } = useUpdatePaymentStatus()
 * 신규: const { updatePaymentStatusAsync } = useSupabaseOrder()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { 
  Payment, 
  PaymentRequest, 
  PaymentFormData, 
  PaymentStatus,
  PaymentMethod as PaymentMethodType
} from '@/types/payment'
import { paymentService } from '@/lib/services/payment-service'

// 결제 내역 조회 훅
export function usePayments(userId?: string) {
  return useQuery({
    queryKey: ['payments', userId],
    queryFn: async () => {
      if (userId) {
        return db.payments.findByUserId(userId)
      }
      return db.payments.findAll()
    },
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 특정 결제 조회 훅
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => db.payments.findById(paymentId),
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 5,
  })
}

// 주문별 결제 내역 조회 훅
export function usePaymentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => db.payments.findByOrderId(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
  })
}

// 결제 생성 훅
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      orderId: string
      userId: string
      amount: number
      currency: string
      paymentMethodId: string
      customerInfo: {
        name: string
        email: string
        phone?: string
      }
      returnUrl?: string
      cancelUrl?: string
      metadata?: Record<string, any>
    }) => {
      // 결제 요청 생성
      const paymentRequest: Omit<PaymentRequest, 'id' | 'createdAt'> = {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        provider: 'card', // 기본값, 실제로는 paymentMethodId로부터 결정
        paymentMethodId: data.paymentMethodId,
        description: `Order ${data.orderId} payment`,
        customerInfo: data.customerInfo,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        metadata: data.metadata,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30분 후 만료
      }

      // 결제 요청 저장
      const createdRequest = await paymentService.createPaymentRequest(paymentRequest)
      await db.paymentRequests.create(createdRequest)

      // 결제 처리
      const payment = await paymentService.processPayment(createdRequest)
      
      // 결제 저장
      const savedPayment = await db.payments.create(payment)
      
      return savedPayment
    },
    onSuccess: (payment) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'order', payment.orderId] })
      queryClient.invalidateQueries({ queryKey: ['payments', payment.userId] })
    },
    onError: (error) => {
      console.error('Payment creation failed:', error)
    }
  })
}

// 결제 상태 업데이트 훅
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      paymentId: string
      status: PaymentStatus
      metadata?: Record<string, any>
    }) => {
      const updatedPayment = await db.payments.updateStatus(
        data.paymentId,
        data.status,
        data.metadata
      )
      
      if (!updatedPayment) {
        throw new Error('Payment not found')
      }
      
      return updatedPayment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', payment.id] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'order', payment.orderId] })
      queryClient.invalidateQueries({ queryKey: ['payments', payment.userId] })
    }
  })
}

// 결제 취소 훅
export function useCancelPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { paymentId: string; reason: string }) => {
      const cancelledPayment = await paymentService.cancelPayment(data.paymentId, data.reason)
      
      // DB 업데이트
      await db.payments.cancelPayment(data.paymentId, data.reason)
      
      return cancelledPayment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', payment.id] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'order', payment.orderId] })
      queryClient.invalidateQueries({ queryKey: ['payments', payment.userId] })
    }
  })
}

// 환불 처리 훅
export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { 
      paymentId: string 
      amount: number 
      reason: string 
    }) => {
      const refundedPayment = await paymentService.refundPayment(
        data.paymentId,
        data.amount,
        data.reason
      )
      
      // DB 업데이트
      await db.payments.processRefund(data.paymentId, data.amount, data.reason)
      
      return refundedPayment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', payment.id] })
      queryClient.invalidateQueries({ queryKey: ['payments', 'order', payment.orderId] })
      queryClient.invalidateQueries({ queryKey: ['payments', payment.userId] })
    }
  })
}

// 결제 방법 조회 훅
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentService.getAvailablePaymentMethods(),
    staleTime: 1000 * 60 * 10, // 10분
  })
}

// 결제 통계 훅
export function usePaymentStats(dateFrom?: Date, dateTo?: Date) {
  return useQuery({
    queryKey: ['payment-stats', dateFrom, dateTo],
    queryFn: () => {
      if (dateFrom && dateTo) {
        return db.payments.getPaymentStatsByDateRange(dateFrom, dateTo)
      }
      return null
    },
    enabled: !!(dateFrom && dateTo),
    staleTime: 1000 * 60 * 5,
  })
}

// 결제 방법별 통계 훅
export function usePaymentStatsByProvider() {
  return useQuery({
    queryKey: ['payment-stats-by-provider'],
    queryFn: () => db.payments.getPaymentStatsByProvider(),
    staleTime: 1000 * 60 * 10,
  })
}

// 사용자별 결제 총액 훅
export function useUserPaymentTotal(userId: string) {
  return useQuery({
    queryKey: ['user-payment-total', userId],
    queryFn: () => db.payments.getTotalPaidAmountByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

// 로컬 상태 기반 결제 관리 훅 (React Query 미사용)
export function usePaymentsLocal(userId?: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true)
      const data = userId 
        ? await db.payments.findByUserId(userId)
        : await db.payments.findAll()
      setPayments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load payments:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPayment = await db.payments.create({
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      await loadPayments()
      return newPayment
    } catch (err) {
      console.error('Failed to create payment:', err)
      throw err
    }
  }, [loadPayments])

  const updatePaymentStatus = useCallback(async (paymentId: string, status: PaymentStatus, metadata?: Record<string, any>) => {
    try {
      const updatedPayment = await db.payments.updateStatus(paymentId, status, metadata)
      await loadPayments()
      return updatedPayment
    } catch (err) {
      console.error('Failed to update payment status:', err)
      throw err
    }
  }, [loadPayments])

  const cancelPayment = useCallback(async (paymentId: string, reason: string) => {
    try {
      const result = await db.payments.cancelPayment(paymentId, reason)
      await loadPayments()
      return result
    } catch (err) {
      console.error('Failed to cancel payment:', err)
      throw err
    }
  }, [loadPayments])

  const refundPayment = useCallback(async (paymentId: string, amount: number, reason: string) => {
    try {
      const result = await db.payments.processRefund(paymentId, amount, reason)
      await loadPayments()
      return result
    } catch (err) {
      console.error('Failed to refund payment:', err)
      throw err
    }
  }, [loadPayments])

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePaymentStatus,
    cancelPayment,
    refundPayment,
    refetch: loadPayments
  }
}