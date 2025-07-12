import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NotificationSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          
          {/* 콘텐츠 */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              {/* 시간 */}
              <Skeleton className="h-4 w-16 ml-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function NotificationBellSkeleton() {
  return (
    <div className="relative">
      <Skeleton className="w-9 h-9 rounded-md" />
      <Skeleton className="absolute -top-1 -right-1 w-5 h-5 rounded-full" />
    </div>
  )
}