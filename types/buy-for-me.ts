export type BuyForMeStatus = 
  | 'pending_review'      // 관리자 검토 대기
  | 'quote_sent'         // 견적서 발송됨
  | 'quote_approved'     // 견적 승인됨
  | 'payment_pending'    // 결제 대기
  | 'payment_completed'  // 결제 완료
  | 'purchasing'         // 구매 진행 중
  | 'shipping'          // 배송 중
  | 'delivered'         // 배송 완료
  | 'cancelled'         // 취소됨

export interface BuyForMeRequest {
  id: string
  userId: string
  hotdealId: string
  productInfo: {
    title: string
    originalPrice: number
    discountedPrice: number
    discountRate: number
    shippingFee: number
    imageUrl?: string
    originalUrl: string
    siteName: string
  }
  quantity: number
  productOptions?: string
  shippingInfo: {
    name: string
    phone: string
    email: string
    postalCode: string
    address: string
    detailAddress: string
  }
  specialRequests?: string
  status: BuyForMeStatus
  requestDate: Date
  
  // 비용 관련
  estimatedServiceFee: number
  estimatedTotalAmount: number
  
  // 견적 관련 (관리자가 작성)
  quote?: {
    finalProductPrice: number
    serviceFee: number
    domesticShippingFee: number
    totalAmount: number
    paymentMethod: string
    paymentLink?: string         // 온라인 결제 링크
    quoteSentDate: Date
    quoteApprovedDate?: Date
    notes?: string               // 추가 안내사항
  }
  
  // 주문 관련
  orderInfo?: {
    actualOrderId: string      // 실제 쇼핑몰 주문번호
    orderDate: Date
    trackingNumber?: string
    trackingUrl?: string
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface CreateBuyForMeRequestData {
  userId: string
  hotdealId: string
  productInfo: BuyForMeRequest['productInfo']
  quantity: number
  productOptions?: string
  shippingInfo: BuyForMeRequest['shippingInfo']
  specialRequests?: string
  estimatedServiceFee: number
  estimatedTotalAmount: number
}