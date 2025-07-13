'use client'

import { Badge } from '@/components/ui/badge'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { 
  ShoppingBag, 
  FileText, 
  CreditCard, 
  Package2, 
  Truck, 
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'

interface StatusProgressBarProps {
  status: BuyForMeRequest['status']
  className?: string
}

const statusConfig = {
  pending_review: {
    label: '검토 대기',
    progress: 20,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: <Clock className="w-3 h-3" />,
    nextStep: '견적서 발송 예정'
  },
  quote_sent: {
    label: '견적 발송',
    progress: 40,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: <FileText className="w-3 h-3" />,
    nextStep: '고객 승인 대기'
  },
  quote_approved: {
    label: '견적 승인',
    progress: 50,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    icon: <FileText className="w-3 h-3" />,
    nextStep: '결제 대기'
  },
  payment_pending: {
    label: '결제 대기',
    progress: 60,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: <CreditCard className="w-3 h-3" />,
    nextStep: '결제 완료 시 구매 시작'
  },
  payment_completed: {
    label: '결제 완료',
    progress: 70,
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: <CreditCard className="w-3 h-3" />,
    nextStep: '구매 진행 중'
  },
  purchasing: {
    label: '구매 진행',
    progress: 80,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: <Package2 className="w-3 h-3" />,
    nextStep: '배송 준비 중'
  },
  shipping: {
    label: '배송 중',
    progress: 90,
    color: 'bg-cyan-500',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    icon: <Truck className="w-3 h-3" />,
    nextStep: '배송 완료 예정'
  },
  delivered: {
    label: '배송 완료',
    progress: 100,
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: <CheckCircle2 className="w-3 h-3" />,
    nextStep: '주문 완료'
  },
  cancelled: {
    label: '취소됨',
    progress: 0,
    color: 'bg-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: <XCircle className="w-3 h-3" />,
    nextStep: '주문 취소'
  }
}

export function StatusProgressBar({ status, className = '' }: StatusProgressBarProps) {
  const config = statusConfig[status]
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* 상태 배지와 다음 단계 */}
      <div className="flex items-center justify-between">
        <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
        <span className="text-xs text-muted-foreground">
          {config.nextStep}
        </span>
      </div>
      
      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${config.color}`}
          style={{ width: `${config.progress}%` }}
        />
      </div>
      
      {/* 진행률 퍼센트 */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">진행률</span>
        <span className={`font-medium ${config.textColor}`}>
          {config.progress}%
        </span>
      </div>
    </div>
  )
}