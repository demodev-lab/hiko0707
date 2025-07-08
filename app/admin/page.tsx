import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { db } from '@/lib/db/database-service'

export const metadata: Metadata = {
  title: '관리자 대시보드 - HiKo',
  description: 'HiKo 서비스 관리자 대시보드'
}

export default async function AdminPage() {
  // TODO: 실제 인증 체크
  // const user = await getCurrentUser()
  // if (!user || user.role !== 'admin') {
  //   redirect('/')
  // }

  // 통계 데이터 수집
  const [users, hotdeals, orders, payments] = await Promise.all([
    db.users.findAll(),
    db.hotdeals.findAll(),
    db.orders.findAll(),
    db.payments.findAll()
  ])

  const stats = {
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

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return <AdminDashboard stats={stats} recentOrders={recentOrders} />
}