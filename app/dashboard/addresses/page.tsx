import { Metadata } from 'next'
import { AddressList } from '@/components/features/address/address-list'

export const metadata: Metadata = {
  title: '주소 관리 | HiKo',
  description: '배송 주소를 관리하세요',
}

export default function AddressesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">주소 관리</h1>
        <p className="text-gray-600">
          배송 주소를 최대 5개까지 등록하고 관리할 수 있습니다.
        </p>
      </div>
      
      <AddressList />
    </div>
  )
}