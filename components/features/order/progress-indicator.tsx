'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  FileText, 
  CreditCard, 
  Package2, 
  Truck, 
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { BuyForMeRequest } from '@/types/buy-for-me'

interface ProgressStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending' | 'cancelled'
  estimatedDuration?: string
}

interface ProgressIndicatorProps {
  currentStatus: BuyForMeRequest['status']
  className?: string
}

const stepDefinitions: Record<BuyForMeRequest['status'], ProgressStep[]> = {
  pending_review: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인하고 있습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '1-2시간'
    },
    {
      id: 'quote',
      title: '견적서 발송',
      description: '정확한 가격과 배송비를 포함한 견적서를 보내드립니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'payment',
      title: '결제 진행',
      description: '견적서 승인 후 결제를 진행합니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'delivery',
      title: '배송',
      description: '구매 완료 후 안전하게 배송해드립니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'pending'
    }
  ],
  quote_sent: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 발송',
      description: '정확한 가격과 배송비를 포함한 견적서를 보내드렸습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '고객 승인 대기'
    },
    {
      id: 'payment',
      title: '결제 진행',
      description: '견적서 승인 후 결제를 진행합니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'delivery',
      title: '배송',
      description: '구매 완료 후 안전하게 배송해드립니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'pending'
    }
  ],
  quote_approved: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 대기',
      description: '결제 안내를 확인하여 주세요',
      icon: <Package2 className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '결제 완료 시까지'
    },
    {
      id: 'delivery',
      title: '배송',
      description: '결제 완료 후 바로 구매를 시작합니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'pending'
    }
  ],
  payment_pending: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 대기',
      description: '결제를 진행해주세요',
      icon: <Package2 className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '결제 완료 시까지'
    },
    {
      id: 'delivery',
      title: '배송',
      description: '결제 완료 후 바로 구매를 시작합니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'pending'
    }
  ],
  payment_completed: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 완료',
      description: '결제가 정상적으로 완료되었습니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'delivery',
      title: '구매 진행',
      description: '쇼핑몰에서 상품을 구매하고 있습니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '1-3일'
    }
  ],
  purchasing: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 완료',
      description: '결제가 정상적으로 완료되었습니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'delivery',
      title: '구매 진행',
      description: '쇼핑몰에서 상품을 구매하고 있습니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '1-3일'
    }
  ],
  shipping: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 완료',
      description: '결제가 정상적으로 완료되었습니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'delivery',
      title: '배송 중',
      description: '상품이 배송 중입니다',
      icon: <Truck className="w-4 h-4" />,
      status: 'current',
      estimatedDuration: '2-5일'
    }
  ],
  delivered: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'review',
      title: '요청 검토',
      description: '관리자가 상품 정보를 확인했습니다',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'quote',
      title: '견적서 승인',
      description: '견적서를 승인해주셨습니다',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'payment',
      title: '결제 완료',
      description: '결제가 정상적으로 완료되었습니다',
      icon: <Package2 className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'delivery',
      title: '배송 완료',
      description: '상품이 성공적으로 배송되었습니다',
      icon: <CheckCircle2 className="w-4 h-4" />,
      status: 'completed'
    }
  ],
  cancelled: [
    {
      id: 'request',
      title: '구매 요청',
      description: '고객님의 구매 요청을 접수했습니다',
      icon: <ShoppingBag className="w-4 h-4" />,
      status: 'completed'
    },
    {
      id: 'cancelled',
      title: '주문 취소',
      description: '주문이 취소되었습니다',
      icon: <XCircle className="w-4 h-4" />,
      status: 'cancelled'
    }
  ]
}

export function ProgressIndicator({ currentStatus, className = '' }: ProgressIndicatorProps) {
  const steps = stepDefinitions[currentStatus] || []
  const currentStep = steps.find(step => step.status === 'current')

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 현재 상태 요약 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">주문 진행 상황</h3>
              {currentStep && (
                <p className="text-xs text-muted-foreground mt-1">
                  현재: {currentStep.title}
                  {currentStep.estimatedDuration && (
                    <span className="ml-2 text-blue-600">
                      (예상: {currentStep.estimatedDuration})
                    </span>
                  )}
                </p>
              )}
            </div>
            <StatusBadge status={currentStatus} />
          </div>

          {/* 진행 단계 표시 */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* 아이콘과 연결선 */}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                    ${step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                      step.status === 'current' ? 'bg-blue-500 border-blue-500 text-white' :
                      step.status === 'cancelled' ? 'bg-red-500 border-red-500 text-white' :
                      'bg-gray-100 border-gray-300 text-gray-400'}
                  `}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step.status === 'current' ? (
                      <Clock className="w-4 h-4" />
                    ) : step.status === 'cancelled' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-0.5 h-6 mt-1 transition-colors
                      ${step.status === 'completed' ? 'bg-green-500' :
                        step.status === 'current' ? 'bg-blue-500' :
                        'bg-gray-300'}
                    `} />
                  )}
                </div>

                {/* 단계 정보 */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className={`
                      text-sm font-medium
                      ${step.status === 'completed' ? 'text-green-700' :
                        step.status === 'current' ? 'text-blue-700' :
                        step.status === 'cancelled' ? 'text-red-700' :
                        'text-gray-500'}
                    `}>
                      {step.title}
                    </h4>
                    {step.status === 'current' && step.estimatedDuration && (
                      <Badge variant="secondary" className="text-xs">
                        {step.estimatedDuration}
                      </Badge>
                    )}
                  </div>
                  <p className={`
                    text-xs mt-1
                    ${step.status === 'completed' ? 'text-green-600' :
                      step.status === 'current' ? 'text-blue-600' :
                      step.status === 'cancelled' ? 'text-red-600' :
                      'text-gray-400'}
                  `}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 다음 단계 안내 */}
          {currentStep && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">다음 단계</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {getNextStepGuidance(currentStatus)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: BuyForMeRequest['status'] }) {
  const statusConfig = {
    pending_review: { label: '검토 대기', variant: 'secondary' as const },
    quote_sent: { label: '견적 발송', variant: 'default' as const },
    quote_approved: { label: '견적 승인', variant: 'secondary' as const },
    payment_pending: { label: '결제 대기', variant: 'secondary' as const },
    payment_completed: { label: '결제 완료', variant: 'default' as const },
    purchasing: { label: '구매 진행', variant: 'default' as const },
    shipping: { label: '배송 중', variant: 'default' as const },
    delivered: { label: '배송 완료', variant: 'default' as const },
    cancelled: { label: '취소됨', variant: 'destructive' as const }
  }

  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function getNextStepGuidance(status: BuyForMeRequest['status']): string {
  const guidance = {
    pending_review: '관리자가 상품 정보를 확인한 후 정확한 견적서를 보내드립니다. 보통 1-2시간 내에 완료됩니다.',
    quote_sent: '마이페이지에서 견적서를 확인하시고 승인해주세요. 견적서 승인 후 결제를 진행할 수 있습니다.',
    quote_approved: '결제 안내에 따라 결제를 완료해주세요. 결제 완료 후 바로 상품 구매를 시작합니다.',
    payment_pending: '결제를 완료해주세요. 결제 완료 후 바로 상품 구매를 시작합니다.',
    payment_completed: '쇼핑몰에서 상품을 구매하고 있습니다. 구매 완료 후 배송 정보를 업데이트해드립니다.',
    purchasing: '쇼핑몰에서 상품을 구매하고 있습니다. 구매 완료 후 배송 정보를 업데이트해드립니다.',
    shipping: '상품이 배송 중입니다. 배송 추적 정보를 확인하여 배송 상태를 확인하실 수 있습니다.',
    delivered: '상품이 성공적으로 배송되었습니다. 이용해주셔서 감사합니다!',
    cancelled: '주문이 취소되었습니다. 추가 문의사항이 있으시면 고객센터로 연락해주세요.'
  }

  return guidance[status] || '진행 상황을 업데이트하고 있습니다.'
}