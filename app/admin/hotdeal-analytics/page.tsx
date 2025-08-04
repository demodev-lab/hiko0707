import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/utils/roles'
import { HotDealAnalyticsDashboard } from '@/components/features/admin/hotdeal-analytics-dashboard'

export const metadata: Metadata = {
  title: '핫딜 통계 분석 - HiKo Admin',
  description: '핫딜 전용 실시간 통계 분석 대시보드'
}

export default async function HotDealAnalyticsPage() {
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HotDealAnalyticsDashboard />
    </div>
  )
}