'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AdminDashboard } from '@/components/features/admin/admin-dashboard'
import { db } from '@/lib/db/database-service'
import { Loading } from '@/components/ui/loading'

export default function AdminPage() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  // 인증 체크
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/login')
    }
  }, [currentUser, isLoading, router])

  // 데이터 로드
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadData()
    }
  }, [currentUser])

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

      setStats(statsData)
      setRecentOrders(recentOrdersData)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    }
  }

  if (isLoading || !stats) {
    return <Loading />
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <Loading />
  }

  return <AdminDashboard stats={stats} recentOrders={recentOrders} />
}