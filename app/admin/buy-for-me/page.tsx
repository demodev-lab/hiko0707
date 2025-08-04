import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { SupabaseAdminService } from '@/lib/services/supabase-admin-service'
import { isAdmin } from '@/utils/roles'
import BuyForMeClient from './components/buy-for-me-client'

export const metadata: Metadata = {
  title: 'Buy-for-me 관리 - HiKo Admin',
  description: 'Buy-for-me 요청 관리 페이지'
}

export default async function BuyForMeAdminPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; sort?: string }
}) {
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/')
  }

  const page = parseInt(searchParams.page || '1')
  const status = searchParams.status
  const sort = searchParams.sort || 'created_at'
  const pageSize = 20

  // 서버사이드에서 페이지네이션된 데이터와 통계 가져오기
  const [requestsResult, statusCounts] = await Promise.all([
    SupabaseAdminService.getBuyForMeRequests({
      page,
      pageSize,
      status,
      sortBy: sort as 'created_at' | 'updated_at' | 'estimated_total_amount',
      sortOrder: 'desc'
    }),
    SupabaseAdminService.getBuyForMeStatusCounts()
  ])

  return (
    <ProtectedRoute requiredRole="admin">
      <BuyForMeClient
        initialData={requestsResult.data}
        statusCounts={statusCounts}
        totalCount={requestsResult.total}
        currentPage={page}
        pageSize={pageSize}
      />
    </ProtectedRoute>
  )
}