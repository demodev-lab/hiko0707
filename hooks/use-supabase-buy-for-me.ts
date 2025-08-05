'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { SupabaseOrderService } from '@/lib/services/supabase-order-service'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'
import { SupabaseAddressService } from '@/lib/services/supabase-address-service'
import { SupabaseNotificationService } from '@/lib/services/supabase-notification-service'
import { SupabaseAdminLogService } from '@/lib/services/supabase-admin-log-service'
import type { Database } from '@/database.types'
import type { BuyForMeRequest, CreateBuyForMeRequestData, BuyForMeStatus } from '@/types/buy-for-me'
import { useSupabaseUser } from './use-supabase-user'
import { toast } from 'sonner'

// Supabase 테이블 타입 정의
type ProxyPurchaseRequestRow = Database['public']['Tables']['proxy_purchases_request']['Row']
type ProxyPurchaseRequestInsert = Database['public']['Tables']['proxy_purchases_request']['Insert']
type PaymentRow = Database['public']['Tables']['payments']['Row']
type UserAddressRow = Database['public']['Tables']['user_addresses']['Row']
type ProxyPurchaseQuoteRow = Database['public']['Tables']['proxy_purchase_quotes']['Row']
type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row']

// 참고: proxy_purchase_addresses 테이블은 레거시 테이블로 현재 사용하지 않음
// 현재 아키텍처: proxy_purchases_request.shipping_address_id -> user_addresses.id

/**
 * order_status_history에서 orderInfo 추출 함수
 */
function extractOrderInfoFromHistory(statusHistory: OrderStatusHistoryRow[]): BuyForMeRequest['orderInfo'] {
  if (!statusHistory || statusHistory.length === 0) return undefined
  
  // 'purchasing', 'shipping', 'delivered' 상태 중 가장 최근의 기록 찾기
  const orderRelatedHistory = statusHistory
    .filter(history => ['purchasing', 'shipping', 'delivered'].includes(history.to_status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  if (orderRelatedHistory.length === 0) return undefined
  
  const latestOrderHistory = orderRelatedHistory[0]
  
  // metadata에서 주문 정보 추출
  const metadata = latestOrderHistory.metadata as any
  if (!metadata) return undefined
  
  return {
    actualOrderId: metadata.actualOrderId || metadata.order_id || '',
    orderDate: new Date(latestOrderHistory.created_at),
    trackingNumber: metadata.trackingNumber || metadata.tracking_number,
    trackingUrl: metadata.trackingUrl || metadata.tracking_url
  }
}

/**
 * LocalStorage BuyForMeRequest를 Supabase 테이블 구조로 매핑하는 함수들
 */
function mapSupabaseToLocalFormat(
  proxyRequest: ProxyPurchaseRequestRow,
  payment?: PaymentRow | null,
  address?: UserAddressRow | null,
  quote?: ProxyPurchaseQuoteRow | null,
  statusHistory?: OrderStatusHistoryRow[]
): BuyForMeRequest {
  const productInfo = proxyRequest.product_info as any

  return {
    id: proxyRequest.id,
    userId: proxyRequest.user_id,
    hotdealId: proxyRequest.hot_deal_id,
    productInfo: {
      title: productInfo?.title || '',
      originalPrice: productInfo?.original_price || 0,
      discountedPrice: productInfo?.discounted_price || 0,
      discountRate: productInfo?.discount_rate || 0,
      shippingFee: productInfo?.shipping_fee || 0,
      imageUrl: productInfo?.image_url,
      originalUrl: productInfo?.original_url || '',
      siteName: productInfo?.site_name || ''
    },
    quantity: proxyRequest.quantity,
    productOptions: proxyRequest.option || undefined,
    shippingInfo: address ? {
      name: address.name,
      phone: address.phone,
      email: '', // user_addresses 테이블에 email 필드 없음 - users 테이블에서 가져와야 함
      postalCode: address.post_code,
      address: address.address,
      detailAddress: address.address_detail || ''
    } : {
      name: '',
      phone: '',
      email: '',
      postalCode: '',
      address: '',
      detailAddress: ''
    },
    specialRequests: proxyRequest.special_requests || undefined,
    status: proxyRequest.status as BuyForMeStatus,
    requestDate: new Date(proxyRequest.created_at),
    estimatedServiceFee: payment?.amount ? payment.amount * 0.08 : 0, // 8% 수수료
    estimatedTotalAmount: payment?.amount || 0,
    // 견적 정보 매핑
    quote: quote ? {
      finalProductPrice: quote.product_cost,
      serviceFee: quote.fee,
      domesticShippingFee: quote.domestic_shipping,
      totalAmount: quote.total_amount,
      paymentMethod: quote.payment_method,
      paymentLink: quote.notification || undefined, // notification 필드를 paymentLink로 사용
      quoteSentDate: new Date(quote.created_at),
      quoteApprovedDate: quote.approved_at ? new Date(quote.approved_at) : undefined,
      notes: quote.notes || undefined
    } : undefined,
    // 주문 정보는 order_status_history 테이블에서 추출
    orderInfo: extractOrderInfoFromHistory(statusHistory || []),
    createdAt: new Date(proxyRequest.created_at),
    updatedAt: new Date(proxyRequest.updated_at)
  }
}

function mapLocalToSupabaseFormat(data: CreateBuyForMeRequestData): {
  proxyRequest: ProxyPurchaseRequestInsert
  addressData: {
    name: string
    phone: string
    post_code: string
    address: string
    address_detail: string
  }
} {
  return {
    proxyRequest: {
      user_id: data.userId,
      hot_deal_id: data.hotdealId,
      order_number: `BFM-${Date.now()}`, // 임시 주문번호 생성
      product_info: {
        title: data.productInfo.title,
        original_price: data.productInfo.originalPrice,
        discounted_price: data.productInfo.discountedPrice,
        discount_rate: data.productInfo.discountRate,
        shipping_fee: data.productInfo.shippingFee,
        image_url: data.productInfo.imageUrl,
        original_url: data.productInfo.originalUrl,
        site_name: data.productInfo.siteName
      },
      quantity: data.quantity,
      option: data.productOptions || null,
      special_requests: data.specialRequests || null,
      status: 'pending_review'
    },
    addressData: {
      name: data.shippingInfo.name,
      phone: data.shippingInfo.phone,
      post_code: data.shippingInfo.postalCode,
      address: data.shippingInfo.address,
      address_detail: data.shippingInfo.detailAddress
    }
  }
}

export function useSupabaseBuyForMe() {
  const { user: currentUser } = useSupabaseUser()
  const queryClient = useQueryClient()

  // 현재 사용자의 Buy for Me 요청 목록 조회
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['supabaseBuyForMeRequests', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return []
      
      const proxyRequests = await SupabaseOrderService.getOrdersByUser(currentUser.id)
      
      // 각 요청에 대한 상세 정보 조회 (quote 정보 포함)
      const requestsWithDetails = await Promise.all(
        proxyRequests.map(async (request) => {
          // getOrderById로 quote 정보까지 포함된 상세 정보 조회
          const fullRequest = await SupabaseOrderService.getOrderById(request.id)
          if (!fullRequest) return null
          
          const [payment, address] = await Promise.all([
            SupabasePaymentService.getPaymentsByRequest(request.id),
            request.shipping_address_id 
              ? SupabaseAddressService.getUserAddressById(request.shipping_address_id)
              : null
          ])
          
          // quotes와 status_history는 현재 Supabase 스키마에 없음
          const quote = null
          const statusHistory: any[] = []
          
          return mapSupabaseToLocalFormat(fullRequest, payment?.[0] || null, address, quote, statusHistory)
        })
      )
      
      return requestsWithDetails.filter(request => request !== null)
    },
    enabled: !!currentUser,
    staleTime: 10 * 60 * 1000, // 10 minutes - 주문 요청은 자주 변경되지 않음
    gcTime: 20 * 60 * 1000, // 20 minutes - 메모리에 더 오래 보관
  })

  // 실시간 구독 설정 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!currentUser) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`buy-for-me-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'proxy_purchases_request',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('주문 요청 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_status_history'
          },
          (payload) => {
            console.log('주문 상태 이력 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('결제 정보 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'proxy_purchase_quotes'
          },
          (payload) => {
            console.log('견적 정보 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
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
  }, [currentUser?.id, queryClient])

  // 새로운 Buy for Me 요청 생성
  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateBuyForMeRequestData) => {
      if (!currentUser) throw new Error('로그인이 필요합니다.')

      const { proxyRequest, addressData } = mapLocalToSupabaseFormat(data)
      
      // 1. 주소 정보 생성
      const address = await SupabaseAddressService.createUserAddress({
        user_id: currentUser.id,
        ...addressData
      })
      
      if (!address) throw new Error('주소 정보 생성에 실패했습니다.')

      // 2. 대리구매 요청 생성 (주소 ID 포함)
      const createdRequest = await SupabaseOrderService.createOrder({
        ...proxyRequest,
        shipping_address_id: address.id
      })
      
      if (!createdRequest) throw new Error('대리구매 요청 생성에 실패했습니다.')

      // 3. 결제 정보 생성 (초기 견적)
      await SupabasePaymentService.createPayment({
        user_id: currentUser.id,
        request_id: createdRequest.id,
        amount: data.estimatedTotalAmount,
        currency: 'KRW',
        payment_method: 'pending',
        status: 'pending'
      })

      // 4. 관리자에게 알림 발송 (관리자 목록은 별도 서비스로 조회)
      // TODO: 관리자 사용자 조회 서비스 메서드 필요
      // const adminUsers = await SupabaseUserService.getAdminUsers()
      
      // 5. 관리자 로그 기록 (임시로 currentUser ID 사용)
      await SupabaseAdminLogService.createAdminLog({
        admin_id: currentUser.id, // 임시로 현재 사용자 ID 사용
        action: 'new_proxy_purchase_request',
        action_category: 'proxy_purchase',
        entity_type: 'proxy_purchases_request',
        entity_id: createdRequest.id,
        details: {
          product_title: data.productInfo.title,
          estimated_amount: data.estimatedTotalAmount,
          user_id: currentUser.id
        }
      })

      return mapSupabaseToLocalFormat(createdRequest, null, address, null, [])
    },
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
      toast.success('대리 구매 요청 성공! 관리자가 검토 후 견적서를 보내드립니다.')
    },
    onError: (error) => {
      console.error('대리구매 요청 생성 실패:', error)
      toast.error('요청 실패. 다시 시도해주세요.')
    },
  })

  // 특정 요청 조회
  const getRequest = useCallback(async (requestId: string): Promise<BuyForMeRequest | null> => {
    const proxyRequest = await SupabaseOrderService.getOrderById(requestId)
    if (!proxyRequest) return null

    const [payment, address] = await Promise.all([
      SupabasePaymentService.getPaymentsByRequest(requestId),
      proxyRequest.shipping_address_id 
        ? SupabaseAddressService.getUserAddressById(proxyRequest.shipping_address_id)
        : null
    ])

    // quotes와 status_history는 현재 Supabase 스키마에 없음
    const quote = null
    const statusHistory: any[] = []

    return mapSupabaseToLocalFormat(proxyRequest, payment?.[0] || null, address, quote, statusHistory)
  }, [])

  // 견적 승인
  const approveQuoteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // 견적 승인은 proxy_purchase_quotes 테이블에서 처리
      // 여기서는 상태만 업데이트
      const updatedRequest = await SupabaseOrderService.updateOrderStatus(
        requestId, 
        'payment_pending',
        currentUser?.id || 'system'
      )
      
      if (!updatedRequest) throw new Error('견적 승인에 실패했습니다.')

      // 사용자에게 알림 발송
      await SupabaseNotificationService.createNotification(
        updatedRequest.user_id,
        '견적 승인 완료',
        '견적이 승인되었습니다. 결제를 진행해주세요.'
      )

      return updatedRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
      toast.success('견적 승인 완료! 결제 방법에 대한 안내를 확인해주세요.')
    },
    onError: (error) => {
      console.error('견적 승인 실패:', error)
      toast.error('견적 승인에 실패했습니다.')
    }
  })

  // 요청 취소
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const updatedRequest = await SupabaseOrderService.updateOrderStatus(
        requestId, 
        'cancelled',
        currentUser?.id || 'system'
      )
      
      if (!updatedRequest) throw new Error('요청 취소에 실패했습니다.')

      // TODO: 관리자에게 알림 발송 기능 구현 필요
      // 관리자 사용자 조회 서비스 메서드가 필요함

      return updatedRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
      toast.success('대리 구매 요청이 취소되었습니다.')
    },
    onError: (error) => {
      console.error('요청 취소 실패:', error)
      toast.error('요청 취소에 실패했습니다.')
    }
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
export function useSupabaseBuyForMeAdmin() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useSupabaseUser()

  // 모든 Buy for Me 요청 조회
  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['supabaseBuyForMeRequests', 'admin'],
    queryFn: async () => {
      const proxyRequests = await SupabaseOrderService.getAllOrders()
      
      // 각 요청에 대한 상세 정보 조회 (quote 정보 포함)
      const requestsWithDetails = await Promise.all(
        proxyRequests.map(async (request) => {
          const [payments, address] = await Promise.all([
            SupabasePaymentService.getPaymentsByRequest(request.id),
            request.shipping_address_id 
              ? SupabaseAddressService.getUserAddressById(request.shipping_address_id)
              : null
          ])
          
          // payments 배열에서 첫 번째 payment 선택 (가장 최신)
          const payment = payments.length > 0 ? payments[0] : null
          
          // quotes 배열에서 첫 번째 quote 가져오기 (가장 최신)
          const quote = null
          
          // status_history는 getAllOrders에서 조회하지 않으므로 빈 배열로 처리
          // 필요시 개별적으로 getOrderById를 호출해야 함
          const statusHistory: OrderStatusHistoryRow[] = []
          
          return mapSupabaseToLocalFormat(request, payment, address, quote, statusHistory)
        })
      )
      
      return requestsWithDetails
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - 관리자는 더 자주 확인
    gcTime: 15 * 60 * 1000, // 15 minutes
  })

  // 실시간 구독 설정 - 관리자용 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!currentUser) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`buy-for-me-admin`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'proxy_purchases_request'
          },
          (payload) => {
            console.log('관리자 - 주문 요청 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests', 'admin'] })
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_status_history'
          },
          (payload) => {
            console.log('관리자 - 주문 상태 이력 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests', 'admin'] })
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          (payload) => {
            console.log('관리자 - 결제 정보 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests', 'admin'] })
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'proxy_purchase_quotes'
          },
          (payload) => {
            console.log('관리자 - 견적 정보 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests', 'admin'] })
            queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
          }
        )
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
  }, [currentUser?.id, queryClient])

  // 상태별 요청 조회
  const getRequestsByStatus = useCallback(async (status: BuyForMeStatus) => {
    const proxyRequests = await SupabaseOrderService.getAllOrders({ status })
    
    const requestsWithDetails = await Promise.all(
      proxyRequests.map(async (request) => {
        const [payments, address] = await Promise.all([
          SupabasePaymentService.getPaymentsByRequest(request.id),
          request.shipping_address_id 
            ? SupabaseAddressService.getUserAddressById(request.shipping_address_id)
            : null
        ])
        
        // payments 배열에서 첫 번째 payment 선택 (가장 최신)
        const payment = payments.length > 0 ? payments[0] : null
        
        // quotes는 Supabase에서 별도로 조회해야 함 (현재는 null로 처리)
        const quote = null
        
        // status_history는 getAllOrders에서 조회하지 않으므로 빈 배열로 처리
        const statusHistory: OrderStatusHistoryRow[] = []
        
        return mapSupabaseToLocalFormat(request, payment, address, quote, statusHistory)
      })
    )
    
    return requestsWithDetails
  }, [])

  // 견적서 작성 (현재는 단순 상태 업데이트만)
  const createQuoteMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      quote 
    }: { 
      requestId: string
      quote: BuyForMeRequest['quote'] 
    }) => {
      // 상태를 quote_sent로 업데이트
      const updatedRequest = await SupabaseOrderService.updateOrderStatus(
        requestId, 
        'quote_sent',
        currentUser?.id || 'system'
      )
      
      if (!updatedRequest) throw new Error('견적서 작성에 실패했습니다.')

      // 사용자에게 알림 발송
      await SupabaseNotificationService.createNotification(
        updatedRequest.user_id,
        '견적서 발송',
        '요청하신 상품의 견적서가 발송되었습니다.'
      )

      // 관리자 로그 기록
      if (currentUser) {
        await SupabaseAdminLogService.createAdminLog({
          admin_id: currentUser.id,
          action: 'create_quote',
          action_category: 'proxy_purchase',
          entity_type: 'proxy_purchases_request',
          entity_id: requestId,
          details: {
            quote_amount: quote?.totalAmount || 0,
            payment_method: quote?.paymentMethod || 'unknown'
          }
        })
      }

      return updatedRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
      toast.success('견적서 발송 완료! 사용자에게 견적서가 전송되었습니다.')
    },
    onError: (error) => {
      console.error('견적서 작성 실패:', error)
      toast.error('견적서 작성에 실패했습니다.')
    }
  })

  // 상태 업데이트
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status 
    }: { 
      requestId: string
      status: BuyForMeStatus 
    }) => {
      const updatedRequest = await SupabaseOrderService.updateOrderStatus(
        requestId, 
        status,
        currentUser?.id || 'system'
      )
      
      if (!updatedRequest) throw new Error('상태 업데이트에 실패했습니다.')

      // 상태 변경 알림 발송
      const statusMessages: Record<string, string> = {
        payment_completed: '결제가 확인되었습니다.',
        purchasing: '상품 구매를 진행하고 있습니다.',
        shipping: '상품이 발송되었습니다.',
        delivered: '상품이 배송 완료되었습니다.'
      }

      const message = statusMessages[status]
      if (message) {
        await SupabaseNotificationService.createNotification(
          updatedRequest.user_id,
          '주문 상태 업데이트',
          message
        )
      }

      // 관리자 로그 기록
      if (currentUser) {
        await SupabaseAdminLogService.createAdminLog({
          admin_id: currentUser.id,
          action: 'update_request_status',
          action_category: 'proxy_purchase',
          entity_type: 'proxy_purchases_request',
          entity_id: requestId,
          old_value: { status: 'previous_status' }, // 실제로는 이전 상태를 조회해야 함
          new_value: { status }
        })
      }

      return updatedRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabaseBuyForMeRequests'] })
      toast.success('요청 상태가 성공적으로 업데이트되었습니다.')
    },
    onError: (error) => {
      console.error('상태 업데이트 실패:', error)
      toast.error('상태 업데이트에 실패했습니다.')
    }
  })

  return {
    allRequests,
    isLoading,
    getRequestsByStatus,
    createQuote: createQuoteMutation.mutate,
    isCreatingQuote: createQuoteMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
  }
}