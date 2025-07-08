'use client'

import { Order } from '@/types/order'
import { CheckCircle, Package, Truck, MapPin } from 'lucide-react'

interface OrderTrackingProps {
  order: Order
}

const ORDER_STEPS = [
  { key: 'confirmed', label: '주문 확인', icon: CheckCircle, description: '주문이 확인되었습니다' },
  { key: 'purchasing', label: '구매 진행', icon: Package, description: '상품을 구매하고 있습니다' },
  { key: 'shipping', label: '배송 중', icon: Truck, description: '배송이 시작되었습니다' },
  { key: 'delivered', label: '배송 완료', icon: MapPin, description: '배송이 완료되었습니다' },
]

const STATUS_MAP: Record<string, number> = {
  'confirmed': 0,
  'purchasing': 1,
  'shipping': 2,
  'delivered': 3,
  'cancelled': -1,
}

export function OrderTracking({ order }: OrderTrackingProps) {
  const currentStepIndex = STATUS_MAP[order.status] ?? -1
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="mt-6">
      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
        
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-5 left-0 h-1 bg-blue-600 z-10 transition-all duration-500"
          style={{ width: `${((currentStepIndex + 1) / ORDER_STEPS.length) * 100}%` }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            const Icon = step.icon
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center z-20
                  ${isCompleted 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                  }
                  ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Cancelled Status */}
      {isCancelled && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">주문이 취소되었습니다</p>
          <p className="text-red-600 text-sm mt-1">
            취소 사유나 환불 관련 문의는 고객센터로 연락주세요.
          </p>
        </div>
      )}

    </div>
  )
}