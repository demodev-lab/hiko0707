'use client'

import { useState, useEffect } from 'react'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useSupabaseProfile } from '@/hooks/use-supabase-profile'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useClerk } from '@clerk/nextjs'
import { useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  User, Package, Heart, CreditCard, Settings, Mail, 
  Phone, MapPin, Calendar, Edit, Save, X, Globe,
  ShoppingBag, TrendingUp, Clock
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { languages } from '@/lib/i18n/config'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { HotDeal } from '@/types/hotdeal'
import { UserProfile } from '@/types/user'

export default function ProfilePage() {
  const { user, isLoading: userLoading } = useSupabaseUser()
  const { updateProfile } = useSupabaseProfile(user?.id || null)
  const { isAuthenticated } = useClerkRole()
  const { signOut } = useClerk()
  const { language, setLanguage } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [likedHotdeals, setLikedHotdeals] = useState<HotDeal[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    savedAmount: 0
  })

  // Get user's orders
  const { requests: ordersData } = useSupabaseBuyForMe()

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferredLanguage: 'ko'
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        phone: user.phone || '',
        address: '', // user_addresses 테이블에서 별도로 조회해야 함
        preferredLanguage: user.preferred_language || language
      })
    }
  }, [user, language])

  useEffect(() => {
    // Calculate user stats
    if (ordersData && Array.isArray(ordersData)) {
      const total = ordersData.length
      const completed = ordersData.filter(o => o.status === 'delivered').length
      const spent = ordersData.reduce((sum, order) => {
        return sum + (order.quote?.totalAmount || order.estimatedTotalAmount || 0)
      }, 0)
      
      setStats({
        totalOrders: total,
        completedOrders: completed,
        totalSpent: spent,
        savedAmount: Math.floor(spent * 0.1) // Estimate 10% savings
      })
    }
  }, [ordersData])

  useEffect(() => {
    // TODO: Load liked hotdeals from Supabase using useSupabaseCommunity hook
    // async function loadLikedHotdeals() {
    //   if (user?.favorite_hotdeals) {
    //     const deals = await Promise.all(
    //       user.favorite_hotdeals.map(id => getFavoriteHotdeals(id))
    //     )
    //     setLikedHotdeals(deals.filter(Boolean) as HotDeal[])
    //   }
    // }
    // loadLikedHotdeals()
  }, [user])

  const handleSave = () => {
    if (!user) return
    
    try {
      updateProfile({
        userId: user.id,
        updates: {
          display_name: formData.name,
          phone_number: formData.phone,
          language: formData.preferredLanguage
        } as Partial<UserProfile>
      })
      
      // Update global language if changed
      if (formData.preferredLanguage !== language) {
        setLanguage(formData.preferredLanguage as any)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      toast.error('프로필 업데이트 중 오류가 발생했습니다')
    }
  }

  if (!isAuthenticated || !user || userLoading) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
        <p className="text-gray-600 mb-8">프로필을 보려면 먼저 로그인해주세요.</p>
        <Button asChild>
          <Link href="/login">로그인하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage src={undefined} />
              <AvatarFallback>{user.name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-1">{user.name || '사용자'}</h1>
              <p className="text-blue-100">{user.email}</p>
              <p className="text-sm text-blue-200 mt-1">
                가입일: {format(new Date(user.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
              </p>
            </div>
          </div>
          
          {!isEditing ? (
            <Button 
              variant="secondary" 
              onClick={() => setIsEditing(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              프로필 편집
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={handleSave}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 주문</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료 주문</p>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 구매액</p>
                <p className="text-2xl font-bold">₩{stats.totalSpent.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">절약 금액</p>
                <p className="text-2xl font-bold">₩{stats.savedAmount.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="orders">주문 내역</TabsTrigger>
          <TabsTrigger value="likes">찜한 상품</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+82-10-1234-5678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="language">선호 언어</Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="배송 주소를 입력하세요"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 주문 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersData && ordersData.length > 0 ? (
                <div className="space-y-4">
                  {ordersData.slice(0, 5).map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">상품: {order.productInfo.title}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(order.requestDate), 'yyyy-MM-dd HH:mm')}
                          </p>
                          <p className="text-sm mt-1">
                            수량 {order.quantity}개 • ₩{(order.quote?.totalAmount || order.estimatedTotalAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {order.status === 'pending_review' && '검토중'}
                            {order.status === 'quote_sent' && '견적발송'}
                            {order.status === 'payment_pending' && '결제대기'}
                            {order.status === 'payment_completed' && '결제완료'}
                            {order.status === 'purchasing' && '구매중'}
                            {order.status === 'shipping' && '배송중'}
                            {order.status === 'delivered' && '배송완료'}
                            {order.status === 'cancelled' && '취소됨'}
                          </Badge>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/buy-for-me/${order.id}`}>
                              상세보기
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {ordersData.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/buy-for-me">
                          전체 주문 내역 보기
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 주문 내역이 없습니다</p>
                  <Button className="mt-4" asChild>
                    <Link href="/hotdeals">핫딜 둘러보기</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>찜한 핫딜</CardTitle>
            </CardHeader>
            <CardContent>
              {likedHotdeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {likedHotdeals.map((deal) => (
                    <div key={deal.id} className="border rounded-lg p-4">
                      <h4 className="font-medium line-clamp-1">{deal.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        ₩{deal.price.toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/hotdeals/${deal.id}`}>
                            상세보기
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/order?hotdeal=${deal.id}`}>
                            주문하기
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 찜한 핫딜이 없습니다</p>
                  <Button className="mt-4" asChild>
                    <Link href="/hotdeals">핫딜 둘러보기</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>계정 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">알림 설정</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">주문 상태 변경 알림</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">핫딜 알림</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">마케팅 이메일 수신</span>
                  </label>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-3">계정 관리</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    비밀번호 변경
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600">
                    계정 삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}