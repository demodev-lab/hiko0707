export interface Address {
  id: string
  userId: string
  name: string // 주소 별칭 (예: '집', '회사', '부모님 댁')
  recipientName: string // 수취인 이름
  phoneNumber: string
  postalCode: string
  address: string // 기본 주소
  detailAddress: string // 상세 주소
  isDefault: boolean // 기본 배송지 여부
  createdAt: Date
  updatedAt: Date
}

export interface CreateAddressInput {
  name: string
  recipientName: string
  phoneNumber: string
  postalCode: string
  address: string
  detailAddress: string
  isDefault?: boolean
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {
  id: string
}