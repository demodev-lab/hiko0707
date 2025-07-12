import { Skeleton } from '@/components/ui/skeleton'

export function CommentSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {/* 사용자 정보 */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      
      {/* 댓글 내용 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* 액션 버튼 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  )
}

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      
      {/* 댓글 목록 */}
      <div className="divide-y">
        {Array.from({ length: count }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}