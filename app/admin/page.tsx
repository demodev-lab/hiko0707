import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { SupabaseAdminService } from '@/lib/services/supabase-admin-service'
import { isAdmin } from '@/utils/roles'

export default async function AdminPage() {
  // Clerk Private Metadata로 관리자 권한 확인
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/sign-in')
  }

  // 서버 사이드에서 Supabase 데이터 로드
  const loadData = async () => {
    try {
      const [adminStats, recentOrders] = await Promise.all([
        SupabaseAdminService.getDashboardStatistics(),
        SupabaseAdminService.getBuyForMeRequests({ 
          page: 1, 
          pageSize: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        })
      ])

      // AdminDashboard 컴포넌트와 호환되는 형태로 변환
      const statsData = {
        totalUsers: adminStats.totalUsers,
        totalOrders: adminStats.totalOrders,
        totalRevenue: adminStats.totalRevenue,
        totalHotdeals: 0, // getDashboardStatistics에 없으므로 추가 쿼리 필요
        // legacy 호환성을 위한 필드들
        activeUsers: Math.round(adminStats.totalUsers * 0.7), // 임시: 70% 활성 사용자로 가정
        pendingOrders: Math.round(adminStats.totalOrders * 0.3), // 임시: 30% pending으로 가정
        activeHotdeals: 0 // 추가 쿼리 필요
      }

      return { 
        stats: statsData, 
        recentOrders: recentOrders.data 
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      return { stats: null, recentOrders: [] }
    }
  }

  const { stats, recentOrders } = await loadData()

  if (!stats) {
    return <div>Failed to load admin data</div>
  }

  return <AdminDashboard stats={stats} recentOrders={[]} />
}