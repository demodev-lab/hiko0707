export type OrderStatus = 'pending' | 'confirmed' | 'purchasing' | 'shipping' | 'delivered' | 'cancelled'

export type PaymentMethod = 'card' | 'bank_transfer'

export type ShippingMethod = 'standard' | 'express' | 'economy'

export interface ShippingAddress {
  fullName: string
  phone: string
  email: string
  post_code: string
  address: string
  address_detail?: string
  is_default?: boolean
}

export interface OrderItem {
  id: string
  hotdealId?: string
  productUrl?: string
  productName: string
  productImage?: string
  price: number
  quantity: number
  options?: Record<string, string> // size, color, etc.
  notes?: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  status: OrderStatus
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  
  // Price breakdown
  subtotal: number
  serviceFee: number // 대행 수수료 (8%)
  domesticShippingFee: number // 국내 배송비
  totalAmount: number
  
  // Tracking
  orderNumber: string
  koreanTrackingNumber?: string
  internationalTrackingNumber?: string
  
  // Communication
  customerNotes?: string
  adminNotes?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  purchasedAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
  cancelledAt?: Date
}

export interface OrderFormData {
  items: Array<{
    productUrl: string
    productName: string
    price: number
    quantity: number
    options?: Record<string, string>
    notes?: string
    imageUrl?: string
  }>
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  customerNotes?: string
}

// 서비스 수수료 계산 (8%)
export function calculateServiceFee(subtotal: number): number {
  return Math.round(subtotal * 0.08)
}

