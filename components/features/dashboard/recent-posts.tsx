'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useHotDeals } from '@/hooks/use-supabase-hotdeals'
import { formatDistanceToNow } from '@/lib/utils'

export function RecentPosts() {
  const { data: hotdealsData, isLoading: loading, error } = useHotDeals({
    limit: 5,
    sortBy: 'created_at',
    sortOrder: 'desc',
    status: 'active' // 활성 핫딜만 표시
  })

  const recentDeals = hotdealsData?.data || []

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 핫딜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 핫딜</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            핫딜을 불러오는 중 오류가 발생했습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  if (recentDeals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 핫딜</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            등록된 핫딜이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 핫딜</CardTitle>
        <CardDescription>
          최근 등록된 {recentDeals.length}개의 핫딜
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentDeals.map((deal) => (
            <div key={deal.id} className="flex items-start space-x-4">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">
                  {deal.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {deal.source} • {formatDistanceToNow(new Date(deal.created_at))}
                </p>
                {deal.sale_price && deal.sale_price > 0 && (
                  <p className="text-sm font-semibold text-green-600">
                    ₩{deal.sale_price.toLocaleString()}
                  </p>
                )}
              </div>
              <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
                {deal.status === 'active' ? '활성' : '만료'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}