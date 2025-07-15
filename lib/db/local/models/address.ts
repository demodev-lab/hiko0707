export interface Address {
  id: string
  userId: string
  name: string // 배송지 이름 (집, 회사 등)
  recipientName: string // 수령인 이름
  phoneNumber: string
  email: string
  postalCode: string
  address: string
  detailAddress?: string
  isDefault: boolean // 기본 배송지 여부
  createdAt: Date
  updatedAt: Date
}