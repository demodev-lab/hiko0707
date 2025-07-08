export type OrderStatus = 'pending' | 'confirmed' | 'purchasing' | 'shipping' | 'delivered' | 'cancelled'

export type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'alipay' | 'wechat_pay'

export type ShippingMethod = 'standard' | 'express' | 'economy'

export interface ShippingAddress {
  fullName: string
  phoneNumber: string
  email: string
  country: string
  city: string
  state?: string
  postalCode: string
  addressLine1: string
  addressLine2?: string
  isDefault?: boolean
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
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  
  // Price breakdown
  subtotal: number
  serviceFee: number // 대행 수수료
  koreanShippingFee: number // 한국 내 배송비
  internationalShippingFee: number // 국제 배송비
  taxAndDuties: number // 관세 및 세금
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
    productUrl?: string
    productName: string
    price: number
    quantity: number
    options?: Record<string, string>
    notes?: string
  }>
  shippingAddress: ShippingAddress
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  customerNotes?: string
}

// 서비스 수수료 계산 (10% + 최소 5,000원)
export function calculateServiceFee(subtotal: number): number {
  const percentage = subtotal * 0.1
  return Math.max(5000, Math.round(percentage))
}

// 예상 국제 배송비 계산 (무게 기반)
export function estimateInternationalShipping(
  items: Array<{ quantity: number }>,
  method: ShippingMethod,
  country: string
): number {
  // 간단한 예시 - 실제로는 더 복잡한 계산 필요
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