'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
import { useClerk } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Package,
  User,
  Mail,
  Phone,
  Eye,
  LogOut,
  MapPin,
  X
} from 'lucide-react'
import Link from 'next/link'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AddressManagement } from '@/components/features/address/address-management'

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
  const { cancelRequest, isCancelling } = useSupabaseBuyForMe()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  // 취소 가능한 상태 정의
  const canCancel = ['pending_review', 'quote_sent'].includes(request.status)
  
  const handleCancel = () => {
    setShowCancelDialog(false)
    cancelRequest(request.id)
  }
  
  return (
    <Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{request.productInfo.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-2.5 h-2.5 text-gray-400" />
              </div>
              주문일: {format(new Date(request.requestDate), 'yyyy년 MM월 dd일', { locale: ko })}
            </div>
          </div>
          <Badge className={`${statusColors[request.status]} ml-4 px-3 py-1 rounded-full text-xs font-medium shrink-0`}>
            {statusLabels[request.status]}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">수량</p>
            <p className="font-semibold text-gray-900">{request.quantity}개</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 mb-1">
              {request.quote ? '최종 견적 금액' : '예상 금액'}
            </p>
            <p className="font-semibold text-blue-900">
              ₩{(request.quote?.totalAmount || request.estimatedTotalAmount).toLocaleString()}
            </p>
          </div>
        </div>
        
        {request.productOptions && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700 mb-1">상품 옵션</p>
            <p className="font-medium text-amber-900">{request.productOptions}</p>
          </div>
        )}
        
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
        
        {request.status === 'cancelled' && (
          <div className="bg-red-50 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-red-900 mb-1">주문 취소됨</p>
            <p className="text-sm text-red-700">
              이 주문은 취소되었습니다. 궁금한 사항은 고객센터로 문의해주세요.
            </p>
          </div>
        )}
        
        {request.orderInfo?.trackingNumber && request.status !== 'cancelled' && (
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
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/mypage/orders/${request.id}`} className="flex-1">
            <Button size="sm" className="w-full h-10" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              상세 보기
            </Button>
          </Link>
          
          {request.status === 'quote_sent' && (
            <Link href={`/mypage/orders/${request.id}/quote`} className="flex-1">
              <Button size="sm" className="w-full h-10 bg-blue-600 hover:bg-blue-700">
                견적서 확인
              </Button>
            </Link>
          )}
          
          {canCancel && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowCancelDialog(true)}
              disabled={isCancelling}
              className="shrink-0 h-10 px-4 border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <X className="w-4 h-4 mr-1" />
              {isCancelling ? '취소 중...' : '취소'}
            </Button>
          )}
        </div>
        
        {/* 취소 확인 다이얼로그 */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>주문 취소 확인</DialogTitle>
              <DialogDescription>
                정말로 이 주문을 취소하시겠습니까?
                <br />
                <span className="font-medium text-gray-900">
                  {request.productInfo.title}
                </span>
                <br />
                <span className="text-sm text-red-600">
                  ⚠️ 이 작업은 되돌릴 수 없습니다.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
              >
                돌아가기
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? '취소 중...' : '주문 취소'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default function MyPage() {
  return (
    <ProtectedRoute>
      <MyPageContent />
    </ProtectedRoute>
  )
}

function MyPageContent() {
  const { isAuthenticated, isAdmin } = useClerkRole()
  const { user: currentUser, isLoading: userLoading } = useSupabaseUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { requests, isLoading } = useSupabaseBuyForMe()
  const [activeTab, setActiveTab] = useState('orders')
  const [orderTab, setOrderTab] = useState('active')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const activeRequests = requests.filter((r: BuyForMeRequest) => 
    !['delivered', 'cancelled'].includes(r.status)
  )
  
  const completedRequests = requests.filter((r: BuyForMeRequest) => 
    r.status === 'delivered'
  )
  
  const cancelledRequests = requests.filter((r: BuyForMeRequest) => 
    r.status === 'cancelled'
  )

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error)
    }
  }

  if (!isAuthenticated || !currentUser || !mounted || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-b-2 border-blue-600 h-12 w-12 mx-auto mb-4"></div>
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          {/* 헤더 - 현대적 디자인 */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{currentUser.name}</h1>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm">{currentUser.email}</span>
                    </div>
                    {currentUser.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm">{currentUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-300 hover:border-gray-400 transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>


          {/* 메인 컨텐츠 - 현대적 카드 디자인 */}
          <Card className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                    <TabsTrigger 
                      value="orders" 
                      className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">주문 내역</span>
                      <span className="sm:hidden">주문</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="addresses"
                      className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">배송지 관리</span>
                      <span className="sm:hidden">배송지</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="profile"
                      className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">프로필</span>
                      <span className="sm:hidden">내 정보</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="orders" className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">대리 구매 주문 내역</h3>
                      <div className="text-sm text-gray-500">
                        총 {requests.length}건의 주문
                      </div>
                    </div>
                    
                    <Tabs value={orderTab} onValueChange={setOrderTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
                        <TabsTrigger 
                          value="active"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span className="hidden sm:inline">진행 중</span>
                            <span className="sm:hidden">진행</span>
                            ({activeRequests.length})
                          </div>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="completed"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="hidden sm:inline">배송완료</span>
                            <span className="sm:hidden">완료</span>
                            ({completedRequests.length})
                          </div>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="cancelled"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="hidden sm:inline">취소됨</span>
                            <span className="sm:hidden">취소</span>
                            ({cancelledRequests.length})
                          </div>
                        </TabsTrigger>
                      </TabsList>
                
                      <TabsContent value="active" className="space-y-4 mt-6">
                        {isLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">로딩 중...</p>
                          </div>
                        ) : activeRequests.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">진행 중인 주문이 없습니다</h4>
                            <p className="text-gray-500 mb-6">새로운 핫딜을 확인하고 대리구매를 신청해보세요!</p>
                            <Link href="/hotdeals">
                              <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2">
                                핫딜 보러가기
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {activeRequests.map((request: BuyForMeRequest) => (
                              <RequestCard key={request.id} request={request} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="completed" className="space-y-4 mt-6">
                        {completedRequests.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">배송완료된 주문이 없습니다</h4>
                            <p className="text-gray-500">배송완료된 주문 내역이 여기에 표시됩니다.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {completedRequests.map((request: BuyForMeRequest) => (
                              <RequestCard key={request.id} request={request} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="cancelled" className="space-y-4 mt-6">
                        {cancelledRequests.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">취소된 주문이 없습니다</h4>
                            <p className="text-gray-500">취소된 주문 내역이 여기에 표시됩니다.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {cancelledRequests.map((request: BuyForMeRequest) => (
                              <RequestCard key={request.id} request={request} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="addresses" className="p-6">
                  <AddressManagement />
                </TabsContent>

                <TabsContent value="profile" className="p-6 sm:p-8">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">프로필 정보</h3>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        수정하기
                      </Button>
                    </div>
                    <div className="grid gap-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <label className="text-sm font-medium text-gray-500 mb-2 block">이름</label>
                        <p className="text-lg font-semibold text-gray-900">{currentUser.name}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-6">
                        <label className="text-sm font-medium text-blue-600 mb-2 block">이메일</label>
                        <p className="text-lg font-semibold text-blue-900">{currentUser.email}</p>
                      </div>
                      {currentUser.phone && (
                        <div className="bg-green-50 rounded-xl p-6">
                          <label className="text-sm font-medium text-green-600 mb-2 block">전화번호</label>
                          <p className="text-lg font-semibold text-green-900">{currentUser.phone}</p>
                        </div>
                      )}
                      <div className="bg-purple-50 rounded-xl p-6">
                        <label className="text-sm font-medium text-purple-600 mb-2 block">회원 등급</label>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-purple-900">
                            {isAdmin ? '관리자' : '일반 회원'}
                          </p>
                          {isAdmin && (
                            <Badge className="bg-purple-200 text-purple-800">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

        </div>
      </div>
  )
}