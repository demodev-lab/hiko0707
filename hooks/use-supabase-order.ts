'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { SupabaseOrderService } from '@/lib/services/supabase-order-service'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'
import { SupabaseAddressService } from '@/lib/services/supabase-address-service'
import type { Database } from '@/database.types'

type ProxyPurchaseRow = Database['public']['Tables']['proxy_purchases_request']['Row']
type ProxyPurchaseInsert = Database['public']['Tables']['proxy_purchases_request']['Insert']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type UserAddressInsert = Database['public']['Tables']['user_addresses']['Insert']

// Query Keys
const QUERY_KEYS = {
  orders: (userId: string) => ['orders', userId],
  orderDetail: (orderId: string) => ['order', orderId],
  orderStats: (userId?: string) => ['order-stats', userId],
  payments: (userId: string) => ['payments', userId],
  paymentStats: (userId?: string) => ['payment-stats', userId],
  userAddresses: (userId: string) => ['user-addresses', userId],
  defaultAddress: (userId: string) => ['default-address', userId]
} as const

/**
 * Buy-for-me 주문 관리 Hook
 */
export function useSupabaseOrders(userId: string, options?: {
  status?: string
  limit?: number
}) {
  const queryClient = useQueryClient()

  // 주문 목록 조회
  const {
    data: orders = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...QUERY_KEYS.orders(userId), options?.status, options?.limit],
    queryFn: () => SupabaseOrderService.getOrdersByUser(userId, options),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!userId
  })

  // 주문 생성
  const createOrderMutation = useMutation({
    mutationFn: (orderData: Omit<ProxyPurchaseInsert, 'created_at' | 'updated_at' | 'order_number'>) =>
      SupabaseOrderService.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderStats(userId) })
    }
  })

  // 주문 상태 업데이트
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status, changedBy, notes }: {
      orderId: string
      status: string
      changedBy: string
      notes?: string
    }) => SupabaseOrderService.updateOrderStatus(orderId, status, changedBy, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderStats(userId) })
    }
  })

  // 실시간 주문 동기화 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`orders-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'proxy_purchases_request',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('주문 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders(userId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderStats(userId) })
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'order_status_history'
        }, (payload) => {
          console.log('주문 상태 이력 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders(userId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderStats(userId) })
        })
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return {
    orders,
    isLoading,
    error,
    refetch,
    createOrder: createOrderMutation.mutate,
    createOrderAsync: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
    createOrderError: createOrderMutation.error,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    updateOrderStatusAsync: updateOrderStatusMutation.mutateAsync,
    isUpdatingOrderStatus: updateOrderStatusMutation.isPending,
    updateOrderStatusError: updateOrderStatusMutation.error
  }
}

/**
 * 주문 상세 정보 Hook
 */
export function useSupabaseOrderDetail(orderId: string) {
  const queryClient = useQueryClient()

  const {
    data: order,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.orderDetail(orderId),
    queryFn: () => SupabaseOrderService.getOrderById(orderId),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!orderId
  })

  // 견적서 생성
  const createQuoteMutation = useMutation({
    mutationFn: (quoteData: Parameters<typeof SupabaseOrderService.createQuote>[0]) =>
      SupabaseOrderService.createQuote(quoteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderDetail(orderId) })
    }
  })

  // 견적서 승인/거부
  const updateQuoteApprovalMutation = useMutation({
    mutationFn: ({ quoteId, approvalState, notes }: {
      quoteId: string
      approvalState: 'approved' | 'rejected'
      notes?: string
    }) => SupabaseOrderService.updateQuoteApproval(quoteId, approvalState, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderDetail(orderId) })
    }
  })

  // 실시간 주문 상세 동기화 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!orderId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`order-detail-${orderId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'proxy_purchases_request',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          console.log('주문 상세 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderDetail(orderId) })
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'proxy_purchase_quotes',
          filter: `request_id=eq.${orderId}`
        }, (payload) => {
          console.log('견적서 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orderDetail(orderId) })
        })
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [orderId, queryClient])

  return {
    order,
    isLoading,
    error,
    refetch,
    createQuote: createQuoteMutation.mutate,
    createQuoteAsync: createQuoteMutation.mutateAsync,
    isCreatingQuote: createQuoteMutation.isPending,
    createQuoteError: createQuoteMutation.error,
    updateQuoteApproval: updateQuoteApprovalMutation.mutate,
    updateQuoteApprovalAsync: updateQuoteApprovalMutation.mutateAsync,
    isUpdatingQuoteApproval: updateQuoteApprovalMutation.isPending,
    updateQuoteApprovalError: updateQuoteApprovalMutation.error
  }
}

/**
 * 주문 통계 Hook
 */
export function useSupabaseOrderStats(userId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.orderStats(userId),
    queryFn: () => SupabaseOrderService.getOrderStats(userId),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!userId
  })
}

/**
 * 사용자 결제 목록 Hook
 */
export function useSupabasePayments(userId: string, options?: {
  status?: string
  limit?: number
}) {
  const queryClient = useQueryClient()

  const {
    data: payments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...QUERY_KEYS.payments(userId), options?.status, options?.limit],
    queryFn: () => SupabasePaymentService.getPaymentsByUser(userId, options),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!userId
  })

  // 결제 생성
  const createPaymentMutation = useMutation({
    mutationFn: (paymentData: Omit<PaymentInsert, 'created_at' | 'updated_at'>) =>
      SupabasePaymentService.createPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentStats(userId) })
    }
  })

  // 결제 상태 업데이트
  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ paymentId, status, externalPaymentId, paidAt }: {
      paymentId: string
      status: string
      externalPaymentId?: string
      paidAt?: string
    }) => SupabasePaymentService.updatePaymentStatus(paymentId, status, externalPaymentId, paidAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentStats(userId) })
    }
  })

  // 실시간 결제 동기화 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`payments-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('결제 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments(userId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentStats(userId) })
        })
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return {
    payments,
    isLoading,
    error,
    refetch,
    createPayment: createPaymentMutation.mutate,
    createPaymentAsync: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    createPaymentError: createPaymentMutation.error,
    updatePaymentStatus: updatePaymentStatusMutation.mutate,
    updatePaymentStatusAsync: updatePaymentStatusMutation.mutateAsync,
    isUpdatingPaymentStatus: updatePaymentStatusMutation.isPending,
    updatePaymentStatusError: updatePaymentStatusMutation.error
  }
}

/**
 * 결제 통계 Hook
 */
export function useSupabasePaymentStats(userId?: string, options?: {
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.paymentStats(userId), options?.start_date, options?.end_date],
    queryFn: () => SupabasePaymentService.getPaymentStats({ ...options, user_id: userId }),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!userId
  })
}

/**
 * 사용자 주소 관리 Hook
 */
export function useSupabaseUserAddresses(userId: string) {
  const queryClient = useQueryClient()

  const {
    data: addresses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.userAddresses(userId),
    queryFn: () => SupabaseAddressService.getUserAddresses(userId),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!userId
  })

  // 기본 주소 조회
  const {
    data: defaultAddress,
    isLoading: isLoadingDefaultAddress
  } = useQuery({
    queryKey: QUERY_KEYS.defaultAddress(userId),
    queryFn: () => SupabaseAddressService.getDefaultAddress(userId),
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!userId
  })

  // 주소 생성
  const createAddressMutation = useMutation({
    mutationFn: (addressData: Omit<UserAddressInsert, 'created_at' | 'updated_at'>) =>
      SupabaseAddressService.createUserAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAddresses(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultAddress(userId) })
    }
  })

  // 주소 업데이트
  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, updates }: {
      addressId: string
      updates: Parameters<typeof SupabaseAddressService.updateUserAddress>[1]
    }) => SupabaseAddressService.updateUserAddress(addressId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAddresses(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultAddress(userId) })
    }
  })

  // 주소 삭제
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => SupabaseAddressService.deleteUserAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAddresses(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultAddress(userId) })
    }
  })

  // 기본 주소 설정
  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => SupabaseAddressService.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAddresses(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultAddress(userId) })
    }
  })

  // 실시간 주소 동기화 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`user-addresses-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_addresses',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('사용자 주소 실시간 업데이트:', payload)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAddresses(userId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultAddress(userId) })
        })
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return {
    addresses,
    defaultAddress,
    isLoading,
    isLoadingDefaultAddress,
    error,
    refetch,
    createAddress: createAddressMutation.mutate,
    createAddressAsync: createAddressMutation.mutateAsync,
    isCreatingAddress: createAddressMutation.isPending,
    createAddressError: createAddressMutation.error,
    updateAddress: updateAddressMutation.mutate,
    updateAddressAsync: updateAddressMutation.mutateAsync,
    isUpdatingAddress: updateAddressMutation.isPending,
    updateAddressError: updateAddressMutation.error,
    deleteAddress: deleteAddressMutation.mutate,
    deleteAddressAsync: deleteAddressMutation.mutateAsync,
    isDeletingAddress: deleteAddressMutation.isPending,
    deleteAddressError: deleteAddressMutation.error,
    setDefaultAddress: setDefaultAddressMutation.mutate,
    setDefaultAddressAsync: setDefaultAddressMutation.mutateAsync,
    isSettingDefaultAddress: setDefaultAddressMutation.isPending,
    setDefaultAddressError: setDefaultAddressMutation.error
  }
}

/**
 * 관리자용 전체 주문 Hook
 */
export function useSupabaseAllOrders(options?: {
  status?: string
  source?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['admin-orders', options?.status, options?.source, options?.limit, options?.offset],
    queryFn: () => SupabaseOrderService.getAllOrders(options),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 관리자용 전체 결제 Hook
 */
export function useSupabaseAllPayments(options?: {
  status?: string
  payment_method?: string
  payment_gateway?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['admin-payments', ...Object.values(options || {})],
    queryFn: () => SupabasePaymentService.getAllPayments(options),
    staleTime: 1000 * 60 * 5, // 5분
  })
}