'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalHotdeals: number
  activeHotdeals: number
}

interface Order {
  id: string
  userId: string
  status: string
  totalAmount: number
  createdAt: string
  items: any[]
}

export function useSupabaseAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const client = supabase()

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // Clerk 사용자 수는 별도로 관리 (Supabase에는 핫딜 데이터만 있음)
      // 실제로는 Clerk API를 통해 가져와야 하지만, 여기서는 임시 값 사용
      const totalUsers = 150 // 임시 값
      const activeUsers = 87 // 임시 값
      
      // 핫딜 통계
      const { count: totalHotdeals } = await client
        .from('hot_deals')
        .select('*', { count: 'exact', head: true })
      
      const { count: activeHotdeals } = await client
        .from('hot_deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      
      // 주문 관련 통계 (아직 Supabase에 orders 테이블이 없으므로 임시 값)
      const totalOrders = 45
      const pendingOrders = 12
      const totalRevenue = 3500000
      
      setStats({
        totalUsers,
        activeUsers,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalHotdeals: totalHotdeals || 0,
        activeHotdeals: activeHotdeals || 0
      })
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load admin stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, error, refetch: loadStats }
}

export function useSupabaseRecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      
      // 아직 Supabase에 orders 테이블이 없으므로 임시 데이터
      const mockOrders: Order[] = [
        {
          id: '1',
          userId: 'user1',
          status: 'confirmed',
          totalAmount: 150000,
          createdAt: new Date().toISOString(),
          items: []
        },
        {
          id: '2',
          userId: 'user2',
          status: 'pending',
          totalAmount: 89000,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          items: []
        }
      ]
      
      setOrders(mockOrders)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load recent orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return { orders, loading, error, refetch: loadOrders }
}

// 핫딜 통계 전용 훅
export function useSupabaseHotDealStats() {
  const [stats, setStats] = useState<{
    total: number
    active: number
    bySource: Record<string, number>
    byCategory: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const client = supabase()

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // 전체 핫딜 수
      const { count: total } = await client
        .from('hot_deals')
        .select('*', { count: 'exact', head: true })
      
      // 활성 핫딜 수
      const { count: active } = await client
        .from('hot_deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      
      // 소스별 통계
      const { data: sourceData } = await client
        .from('hot_deals')
        .select('source')
      
      const bySource = (sourceData || []).reduce((acc: Record<string, number>, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1
        return acc
      }, {})
      
      // 카테고리별 통계
      const { data: categoryData } = await client
        .from('hot_deals')
        .select('category')
      
      const byCategory = (categoryData || []).reduce((acc: Record<string, number>, item) => {
        const category = item.category || '기타'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})
      
      setStats({
        total: total || 0,
        active: active || 0,
        bySource,
        byCategory
      })
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load hotdeal stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, error, refetch: loadStats }
}