import { DashboardSkeleton } from '@/components/features/dashboard/dashboard-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>
      <DashboardSkeleton />
    </div>
  )
}