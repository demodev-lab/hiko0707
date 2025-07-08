'use client'

import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Payment, PaymentStatus as PaymentStatusType } from '@/types/payment'
import { useLanguage } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'

interface PaymentStatusProps {
  payment: Payment
  onRetry?: () => void
  onGoBack?: () => void
  onCancel?: () => void
}

export function PaymentStatus({ payment, onRetry, onGoBack, onCancel }: PaymentStatusProps) {
  const { t } = useLanguage()

  const getStatusIcon = (status: PaymentStatusType) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-gray-500" />
      case 'refunded':
        return <RefreshCw className="w-16 h-16 text-blue-500" />
      case 'processing':
        return <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />
      case 'pending':
      default:
        return <AlertCircle className="w-16 h-16 text-orange-500" />
    }
  }

  const getStatusTitle = (status: PaymentStatusType) => {
    switch (status) {
      case 'completed':
        return '결제 완료'
      case 'failed':
        return '결제 실패'
      case 'cancelled':
        return '결제 취소'
      case 'refunded':
        return '환불 완료'
      case 'processing':
        return '결제 처리 중'
      case 'pending':
      default:
        return '결제 대기 중'
    }
  }

  const getStatusMessage = (status: PaymentStatusType) => {
    switch (status) {
      case 'completed':
        return '결제가 성공적으로 완료되었습니다.'
      case 'failed':
        return '결제 처리 중 오류가 발생했습니다.'
      case 'cancelled':
        return '결제가 취소되었습니다.'
      case 'refunded':
        return '결제 금액이 환불되었습니다.'
      case 'processing':
        return '결제를 처리하고 있습니다. 잠시만 기다려주세요.'
      case 'pending':
      default:
        return '결제 승인을 기다리고 있습니다.'
    }
  }

  const getStatusVariant = (status: PaymentStatusType) => {
    switch (status) {
      case 'completed':
        return 'default' as const
      case 'failed':
        return 'destructive' as const
      case 'cancelled':
        return 'secondary' as const
      case 'refunded':
        return 'outline' as const
      case 'processing':
        return 'default' as const
      case 'pending':
      default:
        return 'secondary' as const
    }
  }

  const formatAmount = (amount: number, currency: string = 'KRW') => {
    const symbol = currency === 'KRW' ? '₩' : '$'
    return `${symbol}${amount.toLocaleString()}`
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* 상태 표시 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {getStatusIcon(payment.status)}
            <div>
              <h2 className="text-2xl font-bold">{getStatusTitle(payment.status)}</h2>
              <p className="text-gray-600 mt-2">{getStatusMessage(payment.status)}</p>
            </div>
            <Badge variant={getStatusVariant(payment.status)} className="text-sm">
              {getStatusTitle(payment.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">결제 ID</span>
            <span className="font-mono text-sm">{payment.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">주문 ID</span>
            <span className="font-mono text-sm">{payment.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-semibold">{formatAmount(payment.amount, payment.currency)}</span>
          </div>
          {payment.fees && payment.fees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">수수료</span>
              <span className="text-sm">{formatAmount(payment.fees, payment.currency)}</span>
            </div>
          )}
          {payment.paidAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">실제 결제 금액</span>
              <span className="font-semibold">{formatAmount(payment.paidAmount, payment.currency)}</span>
            </div>
          )}
          {payment.refundAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">환불 금액</span>
              <span className="font-semibold text-blue-600">
                {formatAmount(payment.refundAmount, payment.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">결제 방법</span>
            <span>{payment.provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">결제 요청 시간</span>
            <span className="text-sm">{formatDate(payment.createdAt)}</span>
          </div>
          {payment.paidAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">결제 완료 시간</span>
              <span className="text-sm">{formatDate(payment.paidAt)}</span>
            </div>
          )}
          {payment.failedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">실패 시간</span>
              <span className="text-sm">{formatDate(payment.failedAt)}</span>
            </div>
          )}
          {payment.cancelledAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">취소 시간</span>
              <span className="text-sm">{formatDate(payment.cancelledAt)}</span>
            </div>
          )}
          {payment.refundedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">환불 시간</span>
              <span className="text-sm">{formatDate(payment.refundedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 실패/취소 사유 */}
      {(payment.failureReason || payment.cancelReason || payment.refundReason) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {payment.failureReason && '실패 사유'}
              {payment.cancelReason && '취소 사유'}
              {payment.refundReason && '환불 사유'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {payment.failureReason || payment.cancelReason || payment.refundReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 외부 거래 정보 */}
      {payment.externalTransactionId && (
        <Card>
          <CardHeader>
            <CardTitle>거래 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">외부 거래 ID</span>
              <span className="font-mono text-sm break-all">{payment.externalTransactionId}</span>
            </div>
            {payment.externalPaymentId && (
              <div className="flex justify-between">
                <span className="text-gray-600">외부 결제 ID</span>
                <span className="font-mono text-sm break-all">{payment.externalPaymentId}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼들 */}
      <div className="space-y-3">
        {payment.status === 'failed' && onRetry && (
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}

        {payment.status === 'processing' && onCancel && (
          <Button onClick={onCancel} variant="outline" className="w-full">
            결제 취소
          </Button>
        )}

        {payment.status === 'completed' && (
          <div className="text-center text-sm text-gray-600">
            결제가 완료되었습니다. 주문 상태를 확인해보세요.
          </div>
        )}

        {onGoBack && (
          <Button onClick={onGoBack} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전으로
          </Button>
        )}
      </div>

      {/* 고객센터 안내 */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-center text-sm text-gray-600">
            <p>결제 관련 문의사항이 있으시면</p>
            <p className="font-medium">고객센터 1588-1234로 연락해주세요</p>
            <p className="text-xs mt-1">평일 09:00 - 18:00 (주말 및 공휴일 제외)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}