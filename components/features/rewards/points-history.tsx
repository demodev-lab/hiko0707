'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingBag,
  Gift,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { AccessibleButton } from '@/components/common/accessible-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PointTransaction {
  id: string
  type: 'earn' | 'spend' | 'expire' | 'cancel'
  amount: number
  balance: number
  description: string
  category: string
  date: Date
  orderId?: string
  status: 'completed' | 'pending' | 'cancelled'
}

interface PointsHistoryProps {
  userId?: string
  className?: string
  limit?: number
  showFilters?: boolean
}

const transactionIcons = {
  earn: <ArrowDownCircle className="w-5 h-5 text-green-600" />,
  spend: <ArrowUpCircle className="w-5 h-5 text-red-600" />,
  expire: <Calendar className="w-5 h-5 text-gray-600" />,
  cancel: <ArrowDownCircle className="w-5 h-5 text-orange-600" />
}

const transactionCategories = {
  purchase: '구매 적립',
  review: '리뷰 작성',
  event: '이벤트',
  referral: '친구 추천',
  birthday: '생일 보너스',
  level: '등급 보너스',
  use: '포인트 사용',
  expire: '기간 만료',
  cancel: '주문 취소'
}

export function PointsHistory({
  userId,
  className,
  limit = 20,
  showFilters = true
}: PointsHistoryProps) {
  const { t, formatDate, formatNumber } = useLanguage()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all')
  const [period, setPeriod] = useState<'all' | 'month' | '3months' | '6months' | 'year'>('3months')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [userId, filter, period, page])

  const loadTransactions = async () => {
    setLoading(true)
    
    // API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 더미 데이터 생성
    const mockTransactions: PointTransaction[] = Array.from({ length: limit }, (_, i) => {
      const types: PointTransaction['type'][] = ['earn', 'spend', 'expire', 'cancel']
      const type = types[Math.floor(Math.random() * types.length)]
      const amount = Math.floor(Math.random() * 5000) + 100
      
      return {
        id: `${page}-${i}`,
        type,
        amount: type === 'earn' ? amount : -amount,
        balance: 10000 - (i * 500),
        description: getRandomDescription(type),
        category: getRandomCategory(type),
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        orderId: type === 'earn' || type === 'spend' ? `ORD${Math.floor(Math.random() * 10000)}` : undefined,
        status: Math.random() > 0.1 ? 'completed' : 'pending' as 'completed' | 'pending'
      }
    }).sort((a, b) => b.date.getTime() - a.date.getTime())
    
    setTransactions(prev => page === 1 ? mockTransactions : [...prev, ...mockTransactions])
    setHasMore(page < 5)
    setLoading(false)
  }

  const getRandomDescription = (type: PointTransaction['type']): string => {
    const descriptions = {
      earn: [
        '삼성 갤럭시 버즈 프로 구매',
        'LG 그램 노트북 구매',
        '상품 리뷰 작성',
        '친구 추천 보너스',
        '이벤트 참여 보상'
      ],
      spend: [
        '포인트로 결제',
        '할인 쿠폰 구매',
        '배송비 결제'
      ],
      expire: [
        '유효기간 만료'
      ],
      cancel: [
        '주문 취소로 인한 포인트 회수'
      ]
    }
    
    const options = descriptions[type]
    return options[Math.floor(Math.random() * options.length)]
  }

  const getRandomCategory = (type: PointTransaction['type']): string => {
    if (type === 'earn') {
      return ['purchase', 'review', 'event', 'referral', 'birthday', 'level'][Math.floor(Math.random() * 6)]
    } else if (type === 'spend') {
      return 'use'
    } else if (type === 'expire') {
      return 'expire'
    }
    return 'cancel'
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'all') {
      if (filter === 'earn' && tx.type !== 'earn') return false
      if (filter === 'spend' && tx.type !== 'spend') return false
    }
    
    const now = new Date()
    const txDate = new Date(tx.date)
    const monthsAgo = new Date()
    
    switch (period) {
      case 'month':
        monthsAgo.setMonth(now.getMonth() - 1)
        break
      case '3months':
        monthsAgo.setMonth(now.getMonth() - 3)
        break
      case '6months':
        monthsAgo.setMonth(now.getMonth() - 6)
        break
      case 'year':
        monthsAgo.setFullYear(now.getFullYear() - 1)
        break
      default:
        return true
    }
    
    return txDate >= monthsAgo
  })

  const totalEarned = filteredTransactions
    .filter(tx => tx.type === 'earn')
    .reduce((sum, tx) => sum + tx.amount, 0)
    
  const totalSpent = filteredTransactions
    .filter(tx => tx.type === 'spend')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  if (loading && page === 1) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('rewards.pointHistory')}</CardTitle>
          <AccessibleButton
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {/* 다운로드 로직 */}}
          >
            <Download className="w-4 h-4" />
            내역 다운로드
          </AccessibleButton>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 필터 */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="earn">적립</TabsTrigger>
                  <TabsTrigger value="spend">사용</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="기간 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="month">최근 1개월</SelectItem>
                  <SelectItem value="3months">최근 3개월</SelectItem>
                  <SelectItem value="6months">최근 6개월</SelectItem>
                  <SelectItem value="year">최근 1년</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 요약 */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-500">기간 내 적립</p>
              <p className="text-lg font-semibold text-green-600">
                +{formatNumber(totalEarned)}P
              </p>
            </div>
            <div className="text-center border-l">
              <p className="text-sm text-gray-500">기간 내 사용</p>
              <p className="text-lg font-semibold text-red-600">
                -{formatNumber(totalSpent)}P
              </p>
            </div>
          </div>

          {/* 거래 내역 */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={cn(
                    'flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    transaction.status === 'pending' && 'opacity-60'
                  )}
                >
                  <div className="flex gap-3 flex-1">
                    {transactionIcons[transaction.type]}
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {transactionCategories[transaction.category as keyof typeof transactionCategories]}
                        </Badge>
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.orderId && (
                          <span>• {transaction.orderId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}P
                    </p>
                    <p className="text-xs text-gray-500">
                      잔액 {formatNumber(transaction.balance)}P
                    </p>
                    {transaction.status === 'pending' && (
                      <Badge variant="outline" className="text-xs mt-1">
                        대기중
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>포인트 내역이 없습니다</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 더보기 */}
          {hasMore && !loading && (
            <div className="text-center">
              <AccessibleButton
                variant="outline"
                onClick={() => setPage(prev => prev + 1)}
                loading={loading}
              >
                더보기
              </AccessibleButton>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}