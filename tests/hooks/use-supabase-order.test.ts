import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock 상태 관리를 위한 전역 변수들
let mockSupabaseOrderServiceResult: any = null
let mockSupabasePaymentServiceResult: any = null
let mockSupabaseAddressServiceResult: any = null
let mockToastCalls: any[] = []
let mockSupabaseRealtime: any = null

// Mock Supabase client 및 실시간 구독
const mockChannel: any = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue({ error: null }),
  unsubscribe: vi.fn().mockResolvedValue({ error: null })
}

const mockSupabase = vi.fn(() => ({
  channel: vi.fn().mockImplementation((channelName: string) => {
    mockSupabaseRealtime = { channelName, calls: [] }
    return mockChannel
  }),
  removeChannel: vi.fn().mockResolvedValue({ error: null })
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock SupabaseOrderService
const mockSupabaseOrderServiceMethods = {
  getOrdersByUser: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.getOrdersByUser || [])
  }),
  getOrderById: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.getOrderById || null)
  }),
  getOrderStats: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.getOrderStats || { totalOrders: 0, totalAmount: 0 })
  }),
  getAllOrders: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.getAllOrders || [])
  }),
  createOrder: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.createOrder || { id: 'new-order-id' })
  }),
  updateOrderStatus: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.updateOrderStatus || { id: 'updated-order-id' })
  }),
  createQuote: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.createQuote || { id: 'new-quote-id' })
  }),
  updateQuoteApproval: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseOrderServiceResult?.updateQuoteApproval || { id: 'updated-quote-id' })
  })
}

vi.mock('@/lib/services/supabase-order-service', () => ({
  SupabaseOrderService: mockSupabaseOrderServiceMethods
}))

// Mock SupabasePaymentService
const mockSupabasePaymentServiceMethods = {
  getPaymentsByUser: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabasePaymentServiceResult?.getPaymentsByUser || [])
  }),
  getPaymentStats: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabasePaymentServiceResult?.getPaymentStats || { totalPayments: 0, totalAmount: 0 })
  }),
  getAllPayments: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabasePaymentServiceResult?.getAllPayments || [])
  }),
  createPayment: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabasePaymentServiceResult?.createPayment || { id: 'new-payment-id' })
  }),
  updatePaymentStatus: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabasePaymentServiceResult?.updatePaymentStatus || { id: 'updated-payment-id' })
  })
}

vi.mock('@/lib/services/supabase-payment-service', () => ({
  SupabasePaymentService: mockSupabasePaymentServiceMethods
}))

// Mock SupabaseAddressService
const mockSupabaseAddressServiceMethods = {
  getUserAddresses: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.getUserAddresses || [])
  }),
  getDefaultAddress: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.getDefaultAddress || null)
  }),
  createUserAddress: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.createUserAddress || { id: 'new-address-id' })
  }),
  updateUserAddress: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.updateUserAddress || { id: 'updated-address-id' })
  }),
  deleteUserAddress: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.deleteUserAddress || true)
  }),
  setDefaultAddress: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockSupabaseAddressServiceResult?.setDefaultAddress || true)
  })
}

vi.mock('@/lib/services/supabase-address-service', () => ({
  SupabaseAddressService: mockSupabaseAddressServiceMethods
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn().mockImplementation((message: string) => {
      mockToastCalls.push({ type: 'success', message })
    }),
    error: vi.fn().mockImplementation((message: string) => {
      mockToastCalls.push({ type: 'error', message })
    })
  }
}))

// Mock document.hidden for visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false
})

// Mock addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener
})
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener
})

// Import hooks after mocking
import {
  useSupabaseOrders,
  useSupabaseOrderDetail,
  useSupabaseOrderStats,
  useSupabasePayments,
  useSupabasePaymentStats,
  useSupabaseUserAddresses,
  useSupabaseAllOrders,
  useSupabaseAllPayments
} from '@/hooks/use-supabase-order'

// Test wrapper component for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useSupabaseOrder hooks', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseOrderServiceResult = null
    mockSupabasePaymentServiceResult = null
    mockSupabaseAddressServiceResult = null
    mockToastCalls = []
    mockSupabaseRealtime = null
    
    // Reset mock service methods
    Object.values(mockSupabaseOrderServiceMethods).forEach(mock => mock.mockClear())
    Object.values(mockSupabasePaymentServiceMethods).forEach(mock => mock.mockClear())
    Object.values(mockSupabaseAddressServiceMethods).forEach(mock => mock.mockClear())
    
    // Reset document event listeners
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
    
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllTimers()
    document.hidden = false
  })

  describe('useSupabaseOrders hook', () => {
    it('should fetch orders when userId is provided', async () => {
      const mockOrders = [
        { id: 'order-1', user_id: 'user-123', product_name: '테스트 상품 1', status: 'pending' },
        { id: 'order-2', user_id: 'user-123', product_name: '테스트 상품 2', status: 'processing' }
      ]

      mockSupabaseOrderServiceResult = {
        getOrdersByUser: mockOrders
      }

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.orders).toEqual(mockOrders)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.getOrdersByUser).toHaveBeenCalledWith('user-123', undefined)
    })

    it('should not fetch orders when userId is empty', () => {
      const { result } = renderHook(() => useSupabaseOrders(''), { wrapper })

      expect(result.current.orders).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(mockSupabaseOrderServiceMethods.getOrdersByUser).not.toHaveBeenCalled()
    })

    it('should handle options parameter correctly', async () => {
      const options = { status: 'pending', limit: 10 }
      mockSupabaseOrderServiceResult = {
        getOrdersByUser: []
      }

      const { result } = renderHook(() => useSupabaseOrders('user-123', options), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.getOrdersByUser).toHaveBeenCalledWith('user-123', options)
    })

    it('should create order successfully', async () => {
      const mockOrder = { id: 'order-1', user_id: 'user-123' }
      const orderData = {
        user_id: 'user-123',
        product_name: '새 상품',
        quantity: 1,
        price: 10000
      }

      mockSupabaseOrderServiceResult = {
        getOrdersByUser: [mockOrder],
        createOrder: { id: 'new-order-id' }
      }

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.orders).toEqual([mockOrder])
      })

      // createOrder 실행
      result.current.createOrder(orderData)

      await waitFor(() => {
        expect(result.current.isCreatingOrder).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.createOrder).toHaveBeenCalledWith(orderData)
    })

    it('should update order status successfully', async () => {
      const mockOrder = { id: 'order-1', user_id: 'user-123', status: 'pending' }
      const updateData = {
        orderId: 'order-1',
        status: 'processing',
        changedBy: 'admin-123',
        notes: '상태 업데이트'
      }

      mockSupabaseOrderServiceResult = {
        getOrdersByUser: [mockOrder],
        updateOrderStatus: { id: 'order-1', status: 'processing' }
      }

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.orders).toEqual([mockOrder])
      })

      // updateOrderStatus 실행
      result.current.updateOrderStatus(updateData)

      await waitFor(() => {
        expect(result.current.isUpdatingOrderStatus).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.updateOrderStatus).toHaveBeenCalledWith(
        'order-1', 'processing', 'admin-123', '상태 업데이트'
      )
    })

    it('should handle real-time subscription setup and cleanup', async () => {
      const { result, unmount } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        // 실시간 구독이 설정되었는지 확인
        expect(mockSupabase).toHaveBeenCalledWith()
        expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      })

      // 컴포넌트 언마운트 시 정리되는지 확인
      unmount()

      await waitFor(() => {
        expect(mockRemoveEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      })
    })

    it('should handle visibility change correctly', async () => {
      renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      })

      // 페이지가 숨겨졌을 때
      document.hidden = true
      const visibilityHandler = mockAddEventListener.mock.calls.find(call => 
        call[0] === 'visibilitychange'
      )?.[1]
      
      if (visibilityHandler) {
        visibilityHandler()
      }

      // 페이지가 다시 보일 때
      document.hidden = false
      if (visibilityHandler) {
        visibilityHandler()
      }

      // 실시간 구독 재설정이 이루어져야 함
      expect(mockSupabase).toHaveBeenCalled()
    })
  })

  describe('useSupabaseOrderDetail hook', () => {
    it('should fetch order detail when orderId is provided', async () => {
      const mockOrderDetail = {
        id: 'order-1',
        user_id: 'user-123',
        product_name: '상세 테스트 상품',
        quotes: [{ id: 'quote-1', amount: 10000 }]
      }

      mockSupabaseOrderServiceResult = {
        getOrderById: mockOrderDetail
      }

      const { result } = renderHook(() => useSupabaseOrderDetail('order-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.order).toEqual(mockOrderDetail)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.getOrderById).toHaveBeenCalledWith('order-1')
    })

    it('should not fetch when orderId is empty', () => {
      const { result } = renderHook(() => useSupabaseOrderDetail(''), { wrapper })

      expect(result.current.order).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(mockSupabaseOrderServiceMethods.getOrderById).not.toHaveBeenCalled()
    })

    it('should create quote successfully', async () => {
      const mockOrder = { id: 'order-1', user_id: 'user-123' }
      const quoteData = {
        request_id: 'order-1',
        amount: 15000,
        notes: '견적서 생성'
      }

      mockSupabaseOrderServiceResult = {
        getOrderById: mockOrder,
        createQuote: { id: 'new-quote-id' }
      }

      const { result } = renderHook(() => useSupabaseOrderDetail('order-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.order).toEqual(mockOrder)
      })

      // createQuote 실행
      result.current.createQuote(quoteData)

      await waitFor(() => {
        expect(result.current.isCreatingQuote).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.createQuote).toHaveBeenCalledWith(quoteData)
    })

    it('should update quote approval successfully', async () => {
      const mockOrder = { id: 'order-1', quotes: [{ id: 'quote-1', status: 'pending' }] }
      const approvalData = {
        quoteId: 'quote-1',
        approvalState: 'approved' as const,
        notes: '승인됨'
      }

      mockSupabaseOrderServiceResult = {
        getOrderById: mockOrder,
        updateQuoteApproval: { id: 'quote-1', status: 'approved' }
      }

      const { result } = renderHook(() => useSupabaseOrderDetail('order-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.order).toEqual(mockOrder)
      })

      // updateQuoteApproval 실행
      result.current.updateQuoteApproval(approvalData)

      await waitFor(() => {
        expect(result.current.isUpdatingQuoteApproval).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.updateQuoteApproval).toHaveBeenCalledWith(
        'quote-1', 'approved', '승인됨'
      )
    })
  })

  describe('useSupabaseOrderStats hook', () => {
    it('should fetch order statistics when userId is provided', async () => {
      const mockStats = {
        totalOrders: 25,
        totalAmount: 500000,
        pendingOrders: 5,
        completedOrders: 20
      }

      mockSupabaseOrderServiceResult = {
        getOrderStats: mockStats
      }

      const { result } = renderHook(() => useSupabaseOrderStats('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.getOrderStats).toHaveBeenCalledWith('user-123')
    })

    it('should not fetch when userId is empty', () => {
      const { result } = renderHook(() => useSupabaseOrderStats(), { wrapper })

      expect(result.current.data).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(mockSupabaseOrderServiceMethods.getOrderStats).not.toHaveBeenCalled()
    })
  })

  describe('useSupabasePayments hook', () => {
    it('should fetch payments when userId is provided', async () => {
      const mockPayments = [
        { id: 'payment-1', user_id: 'user-123', amount: 10000, status: 'completed' },
        { id: 'payment-2', user_id: 'user-123', amount: 20000, status: 'pending' }
      ]

      mockSupabasePaymentServiceResult = {
        getPaymentsByUser: mockPayments
      }

      const { result } = renderHook(() => useSupabasePayments('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.payments).toEqual(mockPayments)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabasePaymentServiceMethods.getPaymentsByUser).toHaveBeenCalledWith('user-123', undefined)
    })

    it('should create payment successfully', async () => {
      const mockPayment = { id: 'payment-1', user_id: 'user-123' }
      const paymentData = {
        user_id: 'user-123',
        amount: 25000,
        payment_method: 'card'
      }

      mockSupabasePaymentServiceResult = {
        getPaymentsByUser: [mockPayment],
        createPayment: { id: 'new-payment-id' }
      }

      const { result } = renderHook(() => useSupabasePayments('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.payments).toEqual([mockPayment])
      })

      // createPayment 실행
      result.current.createPayment(paymentData)

      await waitFor(() => {
        expect(result.current.isCreatingPayment).toBe(false)
      })

      expect(mockSupabasePaymentServiceMethods.createPayment).toHaveBeenCalledWith(paymentData)
    })

    it('should update payment status successfully', async () => {
      const mockPayment = { id: 'payment-1', status: 'pending' }
      const updateData = {
        paymentId: 'payment-1',
        status: 'completed',
        externalPaymentId: 'ext-123',
        paidAt: '2025-08-06T10:00:00Z'
      }

      mockSupabasePaymentServiceResult = {
        getPaymentsByUser: [mockPayment],
        updatePaymentStatus: { id: 'payment-1', status: 'completed' }
      }

      const { result } = renderHook(() => useSupabasePayments('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.payments).toEqual([mockPayment])
      })

      // updatePaymentStatus 실행
      result.current.updatePaymentStatus(updateData)

      await waitFor(() => {
        expect(result.current.isUpdatingPaymentStatus).toBe(false)
      })

      expect(mockSupabasePaymentServiceMethods.updatePaymentStatus).toHaveBeenCalledWith(
        'payment-1', 'completed', 'ext-123', '2025-08-06T10:00:00Z'
      )
    })
  })

  describe('useSupabasePaymentStats hook', () => {
    it('should fetch payment statistics with date filters', async () => {
      const options = {
        start_date: '2025-08-01',
        end_date: '2025-08-31'
      }
      const mockStats = {
        totalPayments: 10,
        totalAmount: 300000,
        successfulPayments: 8,
        failedPayments: 2
      }

      mockSupabasePaymentServiceResult = {
        getPaymentStats: mockStats
      }

      const { result } = renderHook(() => useSupabasePaymentStats('user-123', options), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabasePaymentServiceMethods.getPaymentStats).toHaveBeenCalledWith({
        start_date: '2025-08-01',
        end_date: '2025-08-31',
        user_id: 'user-123'
      })
    })
  })

  describe('useSupabaseUserAddresses hook', () => {
    it('should fetch user addresses and default address', async () => {
      const mockAddresses = [
        { id: 'addr-1', user_id: 'user-123', address: '서울시 강남구', is_default: false },
        { id: 'addr-2', user_id: 'user-123', address: '서울시 서초구', is_default: true }
      ]
      const mockDefaultAddress = mockAddresses[1]

      mockSupabaseAddressServiceResult = {
        getUserAddresses: mockAddresses,
        getDefaultAddress: mockDefaultAddress
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual(mockAddresses)
        expect(result.current.defaultAddress).toEqual(mockDefaultAddress)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseAddressServiceMethods.getUserAddresses).toHaveBeenCalledWith('user-123')
      expect(mockSupabaseAddressServiceMethods.getDefaultAddress).toHaveBeenCalledWith('user-123')
    })

    it('should create address successfully', async () => {
      const addressData = {
        user_id: 'user-123',
        address: '서울시 마포구',
        detail_address: '123-45',
        postal_code: '04000',
        is_default: false
      }

      mockSupabaseAddressServiceResult = {
        getUserAddresses: [],
        createUserAddress: { id: 'new-address-id' }
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual([])
      })

      // createAddress 실행
      result.current.createAddress(addressData)

      await waitFor(() => {
        expect(result.current.isCreatingAddress).toBe(false)
      })

      expect(mockSupabaseAddressServiceMethods.createUserAddress).toHaveBeenCalledWith(addressData)
    })

    it('should update address successfully', async () => {
      const mockAddress = { id: 'addr-1', user_id: 'user-123', address: '서울시 강남구' }
      const updateData = {
        addressId: 'addr-1',
        updates: { address: '서울시 강남구 역삼동' }
      }

      mockSupabaseAddressServiceResult = {
        getUserAddresses: [mockAddress],
        updateUserAddress: { id: 'addr-1', address: '서울시 강남구 역삼동' }
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual([mockAddress])
      })

      // updateAddress 실행
      result.current.updateAddress(updateData)

      await waitFor(() => {
        expect(result.current.isUpdatingAddress).toBe(false)
      })

      expect(mockSupabaseAddressServiceMethods.updateUserAddress).toHaveBeenCalledWith(
        'addr-1', { address: '서울시 강남구 역삼동' }
      )
    })

    it('should delete address successfully', async () => {
      const mockAddress = { id: 'addr-1', user_id: 'user-123' }

      mockSupabaseAddressServiceResult = {
        getUserAddresses: [mockAddress],
        deleteUserAddress: true
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual([mockAddress])
      })

      // deleteAddress 실행
      result.current.deleteAddress('addr-1')

      await waitFor(() => {
        expect(result.current.isDeletingAddress).toBe(false)
      })

      expect(mockSupabaseAddressServiceMethods.deleteUserAddress).toHaveBeenCalledWith('addr-1')
    })

    it('should set default address successfully', async () => {
      const mockAddresses = [
        { id: 'addr-1', user_id: 'user-123', is_default: false },
        { id: 'addr-2', user_id: 'user-123', is_default: true }
      ]

      mockSupabaseAddressServiceResult = {
        getUserAddresses: mockAddresses,
        setDefaultAddress: true
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual(mockAddresses)
      })

      // setDefaultAddress 실행
      result.current.setDefaultAddress('addr-1')

      await waitFor(() => {
        expect(result.current.isSettingDefaultAddress).toBe(false)
      })

      expect(mockSupabaseAddressServiceMethods.setDefaultAddress).toHaveBeenCalledWith('addr-1')
    })
  })

  describe('useSupabaseAllOrders hook (Admin)', () => {
    it('should fetch all orders with options', async () => {
      const options = {
        status: 'pending',
        source: 'web',
        limit: 50,
        offset: 0
      }
      const mockAllOrders = [
        { id: 'order-1', user_id: 'user-123', status: 'pending' },
        { id: 'order-2', user_id: 'user-456', status: 'pending' }
      ]

      mockSupabaseOrderServiceResult = {
        getAllOrders: mockAllOrders
      }

      const { result } = renderHook(() => useSupabaseAllOrders(options), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAllOrders)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabaseOrderServiceMethods.getAllOrders).toHaveBeenCalledWith(options)
    })

    it('should work without options', async () => {
      const mockAllOrders = [
        { id: 'order-1', user_id: 'user-123' }
      ]

      mockSupabaseOrderServiceResult = {
        getAllOrders: mockAllOrders
      }

      const { result } = renderHook(() => useSupabaseAllOrders(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAllOrders)
      })

      expect(mockSupabaseOrderServiceMethods.getAllOrders).toHaveBeenCalledWith(undefined)
    })
  })

  describe('useSupabaseAllPayments hook (Admin)', () => {
    it('should fetch all payments with comprehensive options', async () => {
      const options = {
        status: 'completed',
        payment_method: 'card',
        payment_gateway: 'stripe',
        start_date: '2025-08-01',
        end_date: '2025-08-31',
        limit: 100,
        offset: 0
      }
      const mockAllPayments = [
        { id: 'payment-1', user_id: 'user-123', status: 'completed', payment_method: 'card' },
        { id: 'payment-2', user_id: 'user-456', status: 'completed', payment_method: 'card' }
      ]

      mockSupabasePaymentServiceResult = {
        getAllPayments: mockAllPayments
      }

      const { result } = renderHook(() => useSupabaseAllPayments(options), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAllPayments)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabasePaymentServiceMethods.getAllPayments).toHaveBeenCalledWith(options)
    })
  })

  describe('error handling', () => {
    it('should handle order service errors gracefully', async () => {
      const errorMessage = 'Order service failed'
      mockSupabaseOrderServiceMethods.getOrdersByUser.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // useQuery는 에러를 조용히 처리하고 data는 기본값이 됩니다
      expect(result.current.orders).toEqual([])
    })

    it('should handle mutation errors with error callbacks', async () => {
      const mockOrder = { id: 'order-1', user_id: 'user-123' }
      const errorMessage = 'Create order failed'

      mockSupabaseOrderServiceResult = {
        getOrdersByUser: [mockOrder]
      }
      mockSupabaseOrderServiceMethods.createOrder.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.orders).toEqual([mockOrder])
      })

      // createOrder 실행 (에러 발생 예상)
      result.current.createOrder({ user_id: 'user-123', product_name: '테스트' })

      await waitFor(() => {
        expect(result.current.isCreatingOrder).toBe(false)
      })

      // 에러가 발생해도 적절히 처리되어야 함
      expect(result.current.createOrderError).toBeTruthy()
    })

    it('should handle payment service errors gracefully', async () => {
      const errorMessage = 'Payment service failed'
      mockSupabasePaymentServiceMethods.getPaymentsByUser.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabasePayments('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.payments).toEqual([])
    })

    it('should handle address service errors gracefully', async () => {
      const errorMessage = 'Address service failed'
      mockSupabaseAddressServiceMethods.getUserAddresses.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.addresses).toEqual([])
    })
  })

  describe('loading states', () => {
    it('should show loading states correctly for orders', async () => {
      let resolveOrders: (value: any) => void
      const ordersPromise = new Promise(resolve => { resolveOrders = resolve })
      mockSupabaseOrderServiceMethods.getOrdersByUser.mockReturnValue(ordersPromise)

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      // 초기 로딩 상태 확인
      expect(result.current.isLoading).toBe(true)

      // 요청 완료
      resolveOrders([{ id: 'order-1' }])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.orders).toEqual([{ id: 'order-1' }])
      })
    })

    it('should show individual mutation loading states for addresses', async () => {
      const mockAddresses = [{ id: 'addr-1', user_id: 'user-123' }]

      mockSupabaseAddressServiceResult = {
        getUserAddresses: mockAddresses
      }

      // createAddress 지연
      let resolveCreateAddress: (value: any) => void
      const createAddressPromise = new Promise(resolve => { resolveCreateAddress = resolve })
      mockSupabaseAddressServiceMethods.createUserAddress.mockReturnValue(createAddressPromise)

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual(mockAddresses)
      })

      // createAddress 실행
      result.current.createAddress({ user_id: 'user-123', address: '새 주소' })

      // 로딩 상태 확인
      expect(result.current.isCreatingAddress).toBe(true)
      expect(result.current.isUpdatingAddress).toBe(false)
      expect(result.current.isDeletingAddress).toBe(false)

      // createAddress 완료
      resolveCreateAddress({ id: 'addr-2' })

      await waitFor(() => {
        expect(result.current.isCreatingAddress).toBe(false)
      })
    })
  })

  describe('query invalidation after mutations', () => {
    it('should invalidate order queries after createOrder', async () => {
      const mockOrder = { id: 'order-1', user_id: 'user-123' }

      mockSupabaseOrderServiceResult = {
        getOrdersByUser: [mockOrder],
        createOrder: { id: 'new-order-id' },
        getOrderStats: { totalOrders: 2 }
      }

      const { result } = renderHook(() => useSupabaseOrders('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.orders).toEqual([mockOrder])
      })

      // createOrder 실행
      result.current.createOrder({ user_id: 'user-123', product_name: '새 상품' })

      await waitFor(() => {
        expect(result.current.isCreatingOrder).toBe(false)
      })

      // 성공 후 쿼리 무효화로 인해 재요청이 이루어져야 함
      expect(mockSupabaseOrderServiceMethods.getOrdersByUser).toHaveBeenCalledTimes(2)
    })

    it('should invalidate payment queries after updatePaymentStatus', async () => {
      const mockPayment = { id: 'payment-1', user_id: 'user-123', status: 'pending' }

      mockSupabasePaymentServiceResult = {
        getPaymentsByUser: [mockPayment],
        updatePaymentStatus: { id: 'payment-1', status: 'completed' }
      }

      const { result } = renderHook(() => useSupabasePayments('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.payments).toEqual([mockPayment])
      })

      // updatePaymentStatus 실행
      result.current.updatePaymentStatus({
        paymentId: 'payment-1',
        status: 'completed'
      })

      await waitFor(() => {
        expect(result.current.isUpdatingPaymentStatus).toBe(false)
      })

      // 성공 후 쿼리 무효화로 인해 재요청이 이루어져야 함
      expect(mockSupabasePaymentServiceMethods.getPaymentsByUser).toHaveBeenCalledTimes(2)
    })

    it('should invalidate address queries after all CRUD operations', async () => {
      const mockAddresses = [{ id: 'addr-1', user_id: 'user-123' }]

      mockSupabaseAddressServiceResult = {
        getUserAddresses: mockAddresses,
        getDefaultAddress: null,
        createUserAddress: { id: 'addr-2' },
        updateUserAddress: { id: 'addr-1' },
        deleteUserAddress: true,
        setDefaultAddress: true
      }

      const { result } = renderHook(() => useSupabaseUserAddresses('user-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.addresses).toEqual(mockAddresses)
      })

      // createAddress 실행
      result.current.createAddress({ user_id: 'user-123', address: '새 주소' })

      await waitFor(() => {
        expect(result.current.isCreatingAddress).toBe(false)
      })

      // updateAddress 실행
      result.current.updateAddress({
        addressId: 'addr-1',
        updates: { address: '수정된 주소' }
      })

      await waitFor(() => {
        expect(result.current.isUpdatingAddress).toBe(false)
      })

      // setDefaultAddress 실행
      result.current.setDefaultAddress('addr-1')

      await waitFor(() => {
        expect(result.current.isSettingDefaultAddress).toBe(false)
      })

      // deleteAddress 실행
      result.current.deleteAddress('addr-1')

      await waitFor(() => {
        expect(result.current.isDeletingAddress).toBe(false)
      })

      // 각 mutation 후 쿼리 무효화가 이루어져야 함
      // 초기 로드 + 4번의 mutation으로 총 5번 호출되어야 함
      expect(mockSupabaseAddressServiceMethods.getUserAddresses).toHaveBeenCalledTimes(5)
      expect(mockSupabaseAddressServiceMethods.getDefaultAddress).toHaveBeenCalledTimes(5)
    })
  })
})