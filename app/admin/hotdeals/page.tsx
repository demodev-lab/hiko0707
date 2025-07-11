import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/database-service'
import { TrendingUp, Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '핫딜 관리 - HiKo Admin',
  description: '핫딜 관리 페이지'
}

export default async function AdminHotdealsPage() {
  const hotdeals = await db.hotdeals.findAll()
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">활성</Badge>
      case 'expired':
        return <Badge variant="destructive">만료</Badge>
      case 'pending':
        return <Badge variant="secondary">대기</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      'electronics': 'bg-blue-100 text-blue-800',
      'fashion': 'bg-pink-100 text-pink-800',
      'home': 'bg-green-100 text-green-800',
      'beauty': 'bg-purple-100 text-purple-800',
      'food': 'bg-orange-100 text-orange-800',
      'sports': 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    )
  }

  const stats = {
    total: hotdeals.length,
    active: hotdeals.filter(h => h.status === 'active').length,
    expired: hotdeals.filter(h => h.status === 'expired').length,
    pending: hotdeals.filter(h => h.status === 'pending').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">핫딜 관리</h1>
            <p className="text-gray-600 mt-1">핫딜을 관리하고 새로운 딜을 추가하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              크롤링 실행
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              새 핫딜 추가
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 핫딜</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 핫딜</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">만료된 딜</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">대기 중</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              핫딜 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">상품명</th>
                    <th className="text-left p-3">카테고리</th>
                    <th className="text-left p-3">가격</th>
                    <th className="text-left p-3">할인율</th>
                    <th className="text-left p-3">상태</th>
                    <th className="text-left p-3">출처</th>
                    <th className="text-left p-3">등록일</th>
                    <th className="text-left p-3">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {hotdeals.map((hotdeal) => (
                    <tr key={hotdeal.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {hotdeal.imageUrl && (
                            <img 
                              src={hotdeal.imageUrl} 
                              alt={hotdeal.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-2">{hotdeal.title}</p>
                            <p className="text-sm text-gray-600">조회: {hotdeal.viewCount}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{getCategoryBadge(hotdeal.category)}</td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">₩{hotdeal.price.toLocaleString()}</p>
                          {hotdeal.originalPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              ₩{hotdeal.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {hotdeal.discountRate ? (
                          <Badge className="bg-red-600">{hotdeal.discountRate}%</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">{getStatusBadge(hotdeal.status)}</td>
                      <td className="p-3 text-sm">{hotdeal.source}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(hotdeal.crawledAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/hotdeals/${hotdeal.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hotdeals.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        핫딜이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}