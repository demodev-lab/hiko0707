'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  Truck,
  DollarSign,
  User,
  MapPin,
  Calendar,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/database.types'

type OrderRow = Database['public']['Tables']['proxy_purchases_request']['Row']

const statusLabels: Record<string, string> = {
  pending_review: '검토 대기',
  quote_sent: '견적 발송',
  quote_approved: '견적 승인',
  payment_pending: '결제 대기',
  payment_completed: '결제 완료',
  purchasing: '구매 진행',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨'
}

const statusColors: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  quote_approved: 'bg-indigo-100 text-indigo-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  payment_completed: 'bg-green-100 text-green-800',
  purchasing: 'bg-purple-100 text-purple-800',
  shipping: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800'
}

interface BuyForMeClientProps {
  initialData: OrderRow[]
  statusCounts: Record<string, number>
  totalCount: number
  currentPage: number
  pageSize: number
}

function RequestCard({ request }: { request: OrderRow }) {
  const requestData = request as any // Type assertion for legacy compatibility
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{requestData.product_info?.title || '제품 정보 없음'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              요청일: {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
            </p>
          </div>
          <Badge className={statusColors[request.status] || 'bg-gray-100 text-gray-800'}>
            {statusLabels[request.status] || request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">수량</p>
            <p className="font-medium">{requestData.quantity || 1}개</p>
          </div>
          <div>
            <p className="text-muted-foreground">예상 금액</p>
            <p className="font-medium">₩{(requestData.estimated_total_amount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">고객명</p>
            <p className="font-medium">{requestData.shipping_info?.name || '정보 없음'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">연락처</p>
            <p className="font-medium">{requestData.shipping_info?.phone || '정보 없음'}</p>
          </div>
        </div>
        
        {requestData.product_options && (
          <div className="text-sm">
            <p className="text-muted-foreground">상품 옵션</p>
            <p className="font-medium">{requestData.product_options}</p>
          </div>
        )}
        
        {requestData.special_requests && (
          <div className="text-sm">
            <p className="text-muted-foreground">특별 요청사항</p>
            <p className="font-medium">{requestData.special_requests}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Link href={`/admin/buy-for-me/${request.id}`} className="flex-1">
            <Button size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              상세 보기
            </Button>
          </Link>
          
          {request.status === 'pending_review' && (
            <Link href={`/admin/buy-for-me/${request.id}/quote`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                견적 작성
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function BuyForMeClient({ 
  initialData, 
  statusCounts, 
  totalCount,
  currentPage,
  pageSize 
}: BuyForMeClientProps) {
  const [activeTab, setActiveTab] = useState('pending')

  const pendingStatuses = ['pending_review', 'quote_sent', 'quote_approved', 'payment_pending']
  const activeStatuses = ['payment_completed', 'purchasing', 'shipping']
  const completedStatuses = ['delivered', 'cancelled']

  const pendingRequests = initialData.filter((r: OrderRow) => 
    pendingStatuses.includes(r.status)
  )
  
  const activeRequests = initialData.filter((r: OrderRow) => 
    activeStatuses.includes(r.status)
  )
  
  const completedRequests = initialData.filter((r: OrderRow) => 
    completedStatuses.includes(r.status)
  )

  const pendingCount = pendingStatuses.reduce((sum, status) => sum + (statusCounts[status] || 0), 0)
  const activeCount = activeStatuses.reduce((sum, status) => sum + (statusCounts[status] || 0), 0)
  const completedCount = completedStatuses.reduce((sum, status) => sum + (statusCounts[status] || 0), 0)

  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대리 구매 요청 관리</h1>
        <p className="text-muted-foreground mt-2">
          고객들의 구매 대행 요청을 관리하고 처리합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 요청</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 페이지네이션 정보 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {totalCount}개 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevPage}
            onClick={() => window.location.href = `?page=${currentPage - 1}`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            이전
          </Button>
          <span className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => window.location.href = `?page=${currentPage + 1}`}
          >
            다음
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 요청 목록 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            대기 중 ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            진행 중 ({activeRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({completedRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-muted-foreground">대기 중인 요청이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((request: OrderRow) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {activeRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-muted-foreground">진행 중인 요청이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRequests.map((request: OrderRow) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p className="text-muted-foreground">완료된 요청이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedRequests.map((request: OrderRow) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}