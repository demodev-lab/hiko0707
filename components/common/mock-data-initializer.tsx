'use client'

import { useEffect } from 'react'
import { initializeMockData } from '@/lib/db/mock-data'

export function MockDataInitializer() {
  useEffect(() => {
    // Initialize mock data on client side
    initializeMockData()
  }, [])

  return null
}