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
  return useQuery<Payment[]>({
    queryKey: ['payments', userId],
    queryFn: async () => {
      // Deprecated - LocalStorage removed
      console.warn('usePayments is deprecated. Use useSupabaseOrder instead.')
      return [] as Payment[]
    },
    staleTime: 1000 * 60 * 5, // 5분
  })
}

// 특정 결제 조회 훅
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => {
      // Deprecated - LocalStorage removed
      console.warn('usePayment is deprecated. Use useSupabaseOrder instead.')
      return null
    },
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 5,
  })
}

// 주문별 결제 내역 조회 훅
export function usePaymentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => {
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsByOrder is deprecated. Use useSupabaseOrder instead.')
      return []
    },
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
      // Deprecated - LocalStorage removed
      console.warn('useCreatePayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
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
      // Deprecated - LocalStorage removed
      console.warn('useUpdatePaymentStatus is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    }
  })
}

// 결제 취소 훅
export function useCancelPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { paymentId: string; reason: string }) => {
      // Deprecated - LocalStorage removed
      console.warn('useCancelPayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
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
      // Deprecated - LocalStorage removed
      console.warn('useRefundPayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
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
      // Deprecated - LocalStorage removed
      console.warn('usePaymentStats is deprecated. Use useSupabaseOrder instead.')
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
    queryFn: () => {
      // Deprecated - LocalStorage removed
      console.warn('usePaymentStatsByProvider is deprecated. Use useSupabaseOrder instead.')
      return {}
    },
    staleTime: 1000 * 60 * 10,
  })
}

// 사용자별 결제 총액 훅
export function useUserPaymentTotal(userId: string) {
  return useQuery({
    queryKey: ['user-payment-total', userId],
    queryFn: () => {
      // Deprecated - LocalStorage removed
      console.warn('useUserPaymentTotal is deprecated. Use useSupabaseOrder instead.')
      return 0
    },
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
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsLocal is deprecated. Use useSupabaseOrder instead.')
      setPayments([])
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
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsLocal.createPayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    } catch (err) {
      console.error('Failed to create payment:', err)
      throw err
    }
  }, [loadPayments])

  const updatePaymentStatus = useCallback(async (paymentId: string, status: PaymentStatus, metadata?: Record<string, any>) => {
    try {
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsLocal.updatePaymentStatus is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    } catch (err) {
      console.error('Failed to update payment status:', err)
      throw err
    }
  }, [loadPayments])

  const cancelPayment = useCallback(async (paymentId: string, reason: string) => {
    try {
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsLocal.cancelPayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
    } catch (err) {
      console.error('Failed to cancel payment:', err)
      throw err
    }
  }, [loadPayments])

  const refundPayment = useCallback(async (paymentId: string, amount: number, reason: string) => {
    try {
      // Deprecated - LocalStorage removed
      console.warn('usePaymentsLocal.refundPayment is deprecated. Use useSupabaseOrder instead.')
      throw new Error('LocalStorage payments is no longer supported. Please use Supabase.')
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