'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  Download,
  CalendarIcon,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Payment, PaymentStatus } from '@/types/payment'
// import { usePayments, useCancelPayment, useRefundPayment } from '@/hooks/use-payments' // DEPRECATED - 제거됨
import { useLanguage } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface PaymentHistoryProps {
  userId?: string
  orderId?: string
  onViewPayment?: (paymentId: string) => void
}

export function PaymentHistory({ userId, orderId, onViewPayment }: PaymentHistoryProps) {
  const { t } = useLanguage()
  // const { data: payments = [], isLoading, refetch } = usePayments(userId) // DEPRECATED - 제거됨
  // const cancelPayment = useCancelPayment() // DEPRECATED - 제거됨
  // const refundPayment = useRefundPayment() // DEPRECATED - 제거됨
  
  const payments: Payment[] = [] // 빈 배열로 대체
  const isLoading = false

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])

  // 필터링된 결제 목록
  const filteredPayments = payments.filter(payment => {
    // 주문 ID 필터
    if (orderId && payment.orderId !== orderId) return false
    
    // 상태 필터
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false
    
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        payment.id.toLowerCase().includes(searchLower) ||
        payment.orderId.toLowerCase().includes(searchLower) ||
        payment.provider.toLowerCase().includes(searchLower) ||
        (payment.externalTransactionId && payment.externalTransactionId.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      completed: 'default',
      failed: 'destructive',
      cancelled: 'secondary',
      refunded: 'outline',
      processing: 'default',
      pending: 'secondary'
    }

    const labels: Record<PaymentStatus, string> = {
      completed: '완료',
      failed: '실패',
      cancelled: '취소',
      refunded: '환불',
      processing: '처리중',
      pending: '대기'
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const formatAmount = (amount: number, currency: string = 'KRW') => {
    const symbol = currency === 'KRW' ? '₩' : '$'
    return `${symbol}${amount.toLocaleString()}`
  }

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      card: '신용카드',
      kakao_pay: '카카오페이',
      naver_pay: '네이버페이',
      toss_pay: '토스페이',
      bank_transfer: '계좌이체',
      paypal: 'PayPal',
      alipay: 'Alipay',
      wechat_pay: 'WeChat Pay'
    }
    return names[provider] || provider
  }

  const handleCancelPayment = async (paymentId: string) => {
    try {
      // DEPRECATED: LocalStorage 기반 결제 시스템은 제거됨
      // TODO: Supabase 기반 결제 시스템으로 교체 필요
      console.warn('결제 취소 기능은 현재 개발 중입니다. Supabase 마이그레이션 필요')
      toast.error('결제 취소 기능은 현재 개발 중입니다')
    } catch (error) {
      toast.error('결제 취소에 실패했습니다')
    }
  }

  const handleRefundPayment = async (payment: Payment) => {
    try {
      // DEPRECATED: LocalStorage 기반 결제 시스템은 제거됨  
      // TODO: Supabase 기반 결제 시스템으로 교체 필요
      console.warn('환불 기능은 현재 개발 중입니다. Supabase 마이그레이션 필요')
      toast.error('환불 기능은 현재 개발 중입니다')
    } catch (error) {
      toast.error('환불 요청에 실패했습니다')
    }
  }

  const exportPayments = () => {
    const csvContent = [
      ['결제ID', '주문ID', '금액', '통화', '결제방법', '상태', '생성일시', '완료일시'].join(','),
      ...filteredPayments.map(payment => [
        payment.id,
        payment.orderId,
        payment.amount,
        payment.currency,
        getProviderName(payment.provider),
        payment.status,
        formatDate(payment.createdAt),
        payment.paidAt ? formatDate(payment.paidAt) : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>결제 내역을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">결제 내역</h2>
          <p className="text-gray-600">총 {filteredPayments.length}건의 결제 내역</p>
        </div>
        <Button onClick={exportPayments} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          내보내기
        </Button>
      </div>

      {/* 필터 영역 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="결제 ID, 주문 ID, 거래 ID로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="processing">처리중</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                  <SelectItem value="refunded">환불</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결제 목록 */}
      <Card>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">결제 내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>결제 정보</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제방법</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">주문 #{payment.orderId}</div>
                          <div className="text-sm text-gray-500">결제 ID: {payment.id}</div>
                          {payment.externalTransactionId && (
                            <div className="text-xs text-gray-400">
                              거래 ID: {payment.externalTransactionId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatAmount(payment.amount, payment.currency)}
                          </div>
                          {payment.fees && payment.fees > 0 && (
                            <div className="text-sm text-gray-500">
                              수수료: {formatAmount(payment.fees, payment.currency)}
                            </div>
                          )}
                          {payment.paidAmount && payment.paidAmount !== payment.amount && (
                            <div className="text-sm text-green-600">
                              실제: {formatAmount(payment.paidAmount, payment.currency)}
                            </div>
                          )}
                          {payment.refundAmount && (
                            <div className="text-sm text-blue-600">
                              환불: {formatAmount(payment.refundAmount, payment.currency)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getProviderName(payment.provider)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{formatDate(payment.createdAt)}</div>
                          {payment.paidAt && (
                            <div className="text-xs text-gray-500">
                              완료: {formatDate(payment.paidAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewPayment && (
                              <DropdownMenuItem onClick={() => onViewPayment(payment.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                상세보기
                              </DropdownMenuItem>
                            )}
                            {(payment.status === 'pending' || payment.status === 'processing') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancelPayment(payment.id)}
                                  className="text-red-600"
                                >
                                  결제 취소
                                </DropdownMenuItem>
                              </>
                            )}
                            {payment.status === 'completed' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRefundPayment(payment)}
                                  className="text-blue-600"
                                >
                                  환불 요청
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      {filteredPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">완료</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredPayments.filter(p => ['pending', 'processing'].includes(p.status)).length}
                </div>
                <div className="text-sm text-gray-600">처리중</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredPayments.filter(p => p.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">실패</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₩{filteredPayments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">총 결제금액</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}