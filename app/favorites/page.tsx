'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Package, Trash2, Eye, MessageCircle, Clock } from 'lucide-react'
import { useUserFavoriteHotDeals, useToggleFavoriteHotDeal } from '@/hooks/use-supabase-hotdeals'
import { useClerkRole } from '@/hooks/use-clerk-role'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Loading } from '@/components/ui/loading'

export default function FavoritesPage() {
  const { isAuthenticated } = useClerkRole()
  const { user } = useSupabaseUser()
  const [activeTab, setActiveTab] = useState<'all' | 'hotdeal' | 'product'>('all')
  
  const { data: favorites = [], isLoading } = useUserFavoriteHotDeals(user?.id || '')
  const toggleFavorite = useToggleFavoriteHotDeal()
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
        <p className="text-gray-600 mb-8">찜 목록을 확인하려면 로그인해주세요.</p>
        <Link href="/login">
          <Button>로그인하기</Button>
        </Link>
      </div>
    )
  }
  
  if (isLoading) {
    return <Loading />
  }
  
  // Supabase favorites are all hotdeals (only hotdeals are supported currently)
  const typedFavorites = favorites as any[]
  const hotdealFavorites = typedFavorites
  const productFavorites: any[] = [] // 현재 제품 찜하기는 지원하지 않음
  
  const handleDelete = async (hotdealId: string) => {
    if (!user) return
    
    if (confirm('찜 목록에서 제거하시겠습니까?')) {
      await toggleFavorite.mutateAsync({ hotdealId, userId: user.id })
    }
  }
  
  const FavoriteItem = ({ favorite }: { favorite: any }) => {
    // Supabase user_favorite_hotdeals는 hot_deals 테이블과 조인되어 있음
    const hotdeal = favorite.hot_deals || favorite
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          {/* 이미지 */}
          <div className="relative w-40 h-40 flex-shrink-0 bg-gray-100">
            {hotdeal.image_url ? (
              <Image
                src={hotdeal.image_url}
                alt={hotdeal.title || 'Item'}
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {hotdeal.discount_rate && hotdeal.discount_rate > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                -{hotdeal.discount_rate}%
              </div>
            )}
          </div>
          
          {/* 정보 */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1 line-clamp-2">
                  {hotdeal.title || 'Untitled'}
                </h3>
                
                {hotdeal.sale_price && (
                  <p className="text-lg font-bold text-red-600 mb-2">
                    ₩{hotdeal.sale_price.toLocaleString()}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(favorite.created_at), { 
                      locale: ko, 
                      addSuffix: true 
                    })} 찜함
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href={`/hotdeals/${hotdeal.id}`}>
                  <Button variant="outline" size="sm">
                    보기
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(hotdeal.id)}
                  disabled={toggleFavorite.isPending}
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">찜 목록</h1>
        <p className="text-gray-600">관심있는 상품들을 모아보세요</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">
            전체 ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="hotdeal">
            핫딜 ({hotdealFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="product">
            상품 ({productFavorites.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {typedFavorites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Heart className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">찜한 상품이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            typedFavorites.map(favorite => (
              <FavoriteItem key={favorite.id} favorite={favorite} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="hotdeal" className="space-y-4">
          {hotdealFavorites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Heart className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">찜한 핫딜이 없습니다</p>
                <Link href="/hotdeals">
                  <Button variant="outline" className="mt-4">
                    핫딜 둘러보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            hotdealFavorites.map(favorite => (
              <FavoriteItem key={favorite.id} favorite={favorite} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="product" className="space-y-4">
          {productFavorites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Heart className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">찜한 상품이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            productFavorites.map(favorite => (
              <FavoriteItem key={favorite.id} favorite={favorite} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}