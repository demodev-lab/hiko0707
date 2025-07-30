import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { db } from '@/lib/db/database-service'
import { isAdmin } from '@/utils/roles'

export default async function AdminPage() {
  // Clerk Private Metadata로 관리자 권한 확인
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/sign-in')
  }

  // 서버 사이드에서 데이터 로드
  const loadData = async () => {
    try {
      const [users, hotdeals, orders, payments] = await Promise.all([
        db.users.findAll(),
        db.hotdeals.findAll(),
        db.orders.findAll(),
        db.payments.findAll()
      ])

      const statsData = {
        totalUsers: users.length,
        activeUsers: users.filter(u => {
          const lastLogin = new Date(u.updatedAt)
          const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLogin < 7
        }).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
        totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        totalHotdeals: hotdeals.length,
        activeHotdeals: hotdeals.filter(h => h.status === 'active').length
      }

      const recentOrdersData = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)

      return { stats: statsData, recentOrders: recentOrdersData }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      return { stats: null, recentOrders: [] }
    }
  }

  const { stats, recentOrders } = await loadData()

  if (!stats) {
    return <div>Failed to load admin data</div>
  }

  return <AdminDashboard stats={stats} recentOrders={recentOrders} />
}