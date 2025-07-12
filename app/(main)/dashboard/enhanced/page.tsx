import { Suspense } from 'react'
import { DashboardStats } from '@/components/features/dashboard/dashboard-stats'
import { DashboardCharts } from '@/components/features/dashboard/dashboard-chart'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function EnhancedDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          구매 활동과 절약 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats />
      </Suspense>

      {/* 차트 섹션 */}
      <Suspense fallback={<div>Loading charts...</div>}>
        <DashboardCharts />
      </Suspense>
    </div>
  )
}