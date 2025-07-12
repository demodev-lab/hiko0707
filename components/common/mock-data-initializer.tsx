'use client'

import { useEffect } from 'react'
import { initializeMockData } from '@/lib/db/mock-data'

export function MockDataInitializer() {
  useEffect(() => {
    // Force initialize mock data on client side
    try {
      console.log('🚀 Starting mock data initialization...')
      initializeMockData()
      console.log('✅ Mock data initialization completed')
      
      // 초기화 후 데이터 확인
      const hotdeals = localStorage.getItem('hiko_hotdeals')
      const users = localStorage.getItem('hiko_users')
      console.log('📊 Storage check:', {
        hotdeals: hotdeals ? JSON.parse(hotdeals).length : 0,
        users: users ? JSON.parse(users).length : 0,
        allKeys: Object.keys(localStorage)
      })
    } catch (error) {
      console.error('❌ Mock data initialization failed:', error)
    }
  }, [])

  return null
}