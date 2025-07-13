'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useBuyForMe } from '@/hooks/use-buy-for-me'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  User,
  Mail,
  Phone,
  Eye,
  LogOut,
  MapPin,
  Bell,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ProgressIndicator } from '@/components/features/order/progress-indicator'
import { StatusProgressBar } from '@/components/features/order/status-progress-bar'

const statusLabels: Record<BuyForMeRequest['status'], string> = {
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

const statusColors: Record<BuyForMeRequest['status'], string> = {
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

function RequestCard({ request }: { request: BuyForMeRequest }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{request.productInfo.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              주문일: {format(new Date(request.requestDate), 'yyyy년 MM월 dd일', { locale: ko })}
            </p>
          </div>
          <Badge className={statusColors[request.status]}>
            {statusLabels[request.status]}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground">수량</p>
            <p className="font-medium">{request.quantity}개</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {request.quote ? '최종 견적 금액' : '예상 금액'}
            </p>
            <p className="font-medium">
              ₩{(request.quote?.totalAmount || request.estimatedTotalAmount).toLocaleString()}
            </p>
          </div>
        </div>
        
        {request.productOptions && (
          <div className="mb-4 text-sm">
            <p className="text-muted-foreground">상품 옵션</p>
            <p className="font-medium">{request.productOptions}</p>
          </div>
        )}
        
        {/* 진행 상황 표시 - 개선된 UI */}
        <StatusProgressBar status={request.status} className="mb-4" />
        
        {/* 상태별 추가 정보 */}
        {request.status === 'quote_sent' && request.quote && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-blue-900 mb-1">견적서 발송됨</p>
            <p className="text-sm text-blue-700">
              최종 견적 금액: ₩{request.quote.totalAmount.toLocaleString()}
            </p>
          </div>
        )}
        
        {request.status === 'payment_pending' && (
          <div className="bg-orange-50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-orange-900">결제 대기 중</p>
            <p className="text-sm text-orange-700">결제 안내가 발송되었습니다.</p>
          </div>
        )}
        
        {request.orderInfo?.trackingNumber && (
          <div className="bg-green-50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-green-900 mb-1">배송 정보</p>
            <p className="text-sm text-green-700">
              트래킹 번호: {request.orderInfo.trackingNumber}
            </p>
            {request.orderInfo.trackingUrl && (
              <a 
                href={request.orderInfo.trackingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                배송 추적하기
              </a>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <Link href={`/mypage/orders/${request.id}`} className="flex-1">
            <Button size="sm" className="w-full" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              상세 보기
            </Button>
          </Link>
          
          {request.status === 'quote_sent' && (
            <Link href={`/mypage/orders/${request.id}/quote`} className="flex-1">
              <Button size="sm" className="w-full">
                견적서 확인
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyPage() {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const { requests, isLoading } = useBuyForMe()
  const [activeTab, setActiveTab] = useState('active')
  
  const activeRequests = requests.filter(r => 
    !['delivered', 'cancelled'].includes(r.status)
  )
  
  const completedRequests = requests.filter(r => 
    ['delivered', 'cancelled'].includes(r.status)
  )

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!currentUser) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {currentUser.email}
                    </span>
                    {currentUser.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {currentUser.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>

          {/* 빠른 메뉴 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/mypage/addresses">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">주소 관리</p>
                  <p className="text-xs text-muted-foreground">배송지 설정</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/hotdeals">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">핫딜 보기</p>
                  <p className="text-xs text-muted-foreground">신상품 둘러보기</p>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-50">
              <CardContent className="p-4 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm font-medium">알림 설정</p>
                <p className="text-xs text-muted-foreground">준비 중</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-50">
              <CardContent className="p-4 text-center">
                <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium">설정</p>
                <p className="text-xs text-muted-foreground">준비 중</p>
              </CardContent>
            </Card>
          </div>


          {/* 대리 구매 주문 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>대리 구매 주문 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">
                    진행 중 ({activeRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    완료 ({completedRequests.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4 mt-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">로딩 중...</p>
                    </div>
                  ) : activeRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">진행 중인 주문이 없습니다.</p>
                      <Link href="/hotdeals">
                        <Button className="mt-4">
                          핫딜 보러가기
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {activeRequests.map(request => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4 mt-6">
                  {completedRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">완료된 주문이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {completedRequests.map(request => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

        </div>
      </div>
    </ProtectedRoute>
  )
}