'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingBag, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  Crown,
  Shield,
  User,
  Info
} from 'lucide-react'
import { RoleBasedContent } from '@/components/auth/role-based-content'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { FeeCalculator } from '@/components/features/order/fee-calculator'

// 게스트 대시보드
function GuestDashboard() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          회원가입하시면 더 많은 기능을 이용하실 수 있습니다.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              찜하기 기능
            </CardTitle>
            <CardDescription>회원 전용 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              마음에 드는 핫딜을 저장하고 관리할 수 있습니다.
            </p>
            <Link href="/register">
              <Button className="w-full">회원가입</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              대리구매 서비스
            </CardTitle>
            <CardDescription>회원 전용 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              한국 온라인 쇼핑몰에서 직접 구매가 어려운 분들을 위한 서비스입니다.
            </p>
            <Link href="/login">
              <Button className="w-full" variant="outline">로그인</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              커뮤니티
            </CardTitle>
            <CardDescription>회원 전용 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              다른 사용자들과 핫딜 정보를 공유하고 소통할 수 있습니다.
            </p>
            <Badge variant="secondary" className="w-full justify-center">
              회원가입 필요
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 멤버 대시보드
function MemberDashboard() {
  const { currentUser } = useAuth()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 예시 데이터
  const stats = {
    favorites: 12,
    orders: 3,
    comments: 8,
    savings: 45000
  }

  // 안전한 포맷팅 함수
  const formatCurrency = (amount: number) => {
    if (!isClient) return `₩${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    return `₩${amount.toLocaleString('ko-KR')}`
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">안녕하세요, {currentUser?.name}님!</h2>
          <p className="text-muted-foreground">오늘도 핫한 딜을 찾아보세요 🔥</p>
        </div>
        <Badge className="flex items-center gap-1">
          <User className="w-3 h-3" />
          멤버
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4" />
              찜한 핫딜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favorites}</div>
            <p className="text-xs text-muted-foreground">총 {stats.favorites}개의 핫딜 찜함</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              대리구매 주문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">진행중 {stats.orders}건</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              내 댓글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments}</div>
            <p className="text-xs text-muted-foreground">총 {stats.comments}개 작성</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              절약 금액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.savings)}</div>
            <p className="text-xs text-muted-foreground">예상 절약액</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>빠른 링크</CardTitle>
            <CardDescription>자주 사용하는 기능</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/hotdeals">
              <Button variant="outline" className="w-full">핫딜 보기</Button>
            </Link>
            <Link href="/mypage">
              <Button variant="outline" className="w-full">내 주문</Button>
            </Link>
            <Link href="/mypage">
              <Button variant="outline" className="w-full">찜한 핫딜</Button>
            </Link>
            <Link href="/fee-calculator">
              <Button variant="outline" className="w-full">수수료 계산</Button>
            </Link>
          </CardContent>
        </Card>
        
        <FeeCalculator 
          variant="compact"
          amount={50000}
          showDetailBreakdown={false}
        />
      </div>
    </div>
  )
}

// 관리자 대시보드
function AdminDashboard() {
  const { currentUser } = useAuth()
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 예시 통계 데이터
  const adminStats = {
    totalUsers: 1234,
    activeOrders: 42,
    todayRevenue: 3450000,
    pendingIssues: 5
  }

  // 안전한 포맷팅 함수들
  const formatNumber = (num: number) => {
    if (!isClient) return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return num.toLocaleString('ko-KR')
  }

  const formatCurrency = (amount: number) => {
    if (!isClient) return `₩${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    return `₩${amount.toLocaleString('ko-KR')}`
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">관리자 대시보드</h2>
          <p className="text-muted-foreground">{currentUser?.name}님, 환영합니다!</p>
        </div>
        <Badge className="flex items-center gap-1" variant="destructive">
          <Crown className="w-3 h-3" />
          관리자
        </Badge>
      </div>
      
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          관리자 권한으로 접속하셨습니다. 모든 기능에 접근 가능합니다.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              총 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(adminStats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">전체 등록 사용자</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              진행중 주문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">처리 대기중</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              오늘 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(adminStats.todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">수수료 기준</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              대기중 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminStats.pendingIssues}</div>
            <p className="text-xs text-muted-foreground">신속 처리 필요</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>관리자 빠른 메뉴</CardTitle>
            <CardDescription>자주 사용하는 관리 기능</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/admin">
              <Button className="w-full">대시보드</Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">사용자 관리</Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full">주문 관리</Button>
            </Link>
            <Link href="/admin/hotdeals">
              <Button variant="outline" className="w-full">핫딜 관리</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>최근 활동 로그</CardTitle>
            <CardDescription>시스템 주요 이벤트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">새 주문 접수</span>
                <span>2분 전</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">사용자 가입</span>
                <span>15분 전</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">핫딜 크롤링</span>
                <span>30분 전</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function RoleBasedDashboard() {
  return (
    <RoleBasedContent
      guest={<GuestDashboard />}
      member={<MemberDashboard />}
      admin={<AdminDashboard />}
    />
  )
}