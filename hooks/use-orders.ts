'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-orders.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseOrder() - 완전한 Supabase 기반 주문 시스템 (proxy_purchases_request, payments, order_status_history 테이블)
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { data: orders } = useOrders(userId, status)
 * 신규: const { orders } = useSupabaseOrder()
 * 
 * 기존: const { mutate: createOrder } = useCreateOrder()
 * 신규: const { createRequestAsync } = useSupabaseBuyForMe()
 * 
 * 기존: const { mutate: updateStatus } = useUpdateOrderStatus()
 * 신규: const { updateStatusAsync } = useSupabaseOrder()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { Order, OrderStatus, OrderFormData } from '@/types/order'

export function useOrders(userId?: string, status?: OrderStatus, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['orders', userId, status, page, limit],
    queryFn: async () => {
      return await db.orders.findWithPagination(page, limit, userId, status)
    },
    staleTime: 5 * 60 * 1000 // 5분
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      return await db.orders.findById(orderId)
    },
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

export function useOrderStats(userId?: string) {
  return useQuery({
    queryKey: ['order-stats', userId],
    queryFn: async () => {
      return await db.orders.getOrderStats(userId)
    },
    staleTime: 5 * 60 * 1000 // 5분
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: OrderFormData & { userId: string }) => {
      const orderNumber = db.orders.generateOrderNumber()
      const now = new Date()
      
      const order: Omit<Order, 'id'> = {
        userId: orderData.userId,
        items: orderData.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          productUrl: item.productUrl,
          productName: item.productName,
          productImage: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
          options: item.options,
          notes: item.notes
        })),
        status: 'pending',
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        subtotal: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        serviceFee: 0, // 계산 후 업데이트
        domesticShippingFee: 0, // 계산 후 업데이트
        totalAmount: 0, // 계산 후 업데이트
        orderNumber,
        customerNotes: orderData.customerNotes,
        createdAt: now,
        updatedAt: now
      }

      // 비용 계산
      const subtotal = order.subtotal
      order.serviceFee = Math.max(3000, Math.round(subtotal * 0.08)) // 8% 수수료 (최소 3000원)
      order.domesticShippingFee = 3000 // 기본값
      order.totalAmount = subtotal + order.serviceFee + order.domesticShippingFee

      return await db.orders.create(order)
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
    }
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      return await db.orders.updateStatus(orderId, status)
    },
    onSuccess: (data) => {
      if (data) {
        // 특정 주문 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ['order', data.id] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      }
    }
  })
}

export function useAddTrackingNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      trackingNumber, 
      type 
    }: { 
      orderId: string
      trackingNumber: string
      type: 'korean' | 'international'
    }) => {
      return await db.orders.addTrackingNumber(orderId, trackingNumber, type)
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['order', data.id] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    }
  })
}

export function useSearchOrders(keyword: string, userId?: string) {
  return useQuery({
    queryKey: ['orders-search', keyword, userId],
    queryFn: async () => {
      if (!keyword.trim()) return []
      return await db.orders.searchOrders(keyword, userId)
    },
    enabled: keyword.length > 0,
    staleTime: 1 * 60 * 1000 // 1분
  })
}

// 국제 배송비 예상 계산 함수
function estimateInternationalShipping(
  items: Array<{ quantity: number }>,
  method: 'standard' | 'express' | 'economy',
  country: string
): number {
  const baseRate = {
    standard: 20000,
    express: 35000,
    economy: 15000
  }
  
  const countryMultiplier = {
    US: 1.2,
    CN: 0.8,
    JP: 0.9,
    VN: 0.7,
    TH: 0.8,
    ID: 0.85,
    default: 1
  }
  
  const base = baseRate[method]
  const multiplier = countryMultiplier[country as keyof typeof countryMultiplier] || countryMultiplier.default
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  return Math.round(base * multiplier * Math.max(1, totalItems * 0.5))
}