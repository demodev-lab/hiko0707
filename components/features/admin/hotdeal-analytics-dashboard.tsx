'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Activity,
  RefreshCw,
  Zap
} from 'lucide-react'
import { HotDealStatsCards } from './hotdeal-stats-cards'
import { HotDealTrendCharts } from './hotdeal-trend-charts'
import { HotDealRealtimeFeed } from './hotdeal-realtime-feed'
import { HotDealPerformanceTable } from './hotdeal-performance-table'
import { useHotDealStats } from '@/hooks/use-supabase-hotdeals'

export function HotDealAnalyticsDashboard() {
  const [refreshTime, setRefreshTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 5초마다 자동 갱신
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setRefreshTime(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleManualRefresh = () => {
    setRefreshTime(new Date())
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">핫딜 실시간 Analytics</h1>
          <p className="text-gray-600 mt-1">핫딜 시스템의 실시간 성과를 모니터링하세요</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 상태 표시기 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isOnline ? '온라인' : '오프라인'}
            </span>
          </div>

          {/* 자동 갱신 토글 */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            {autoRefresh ? '자동 갱신 ON' : '자동 갱신 OFF'}
          </Button>

          {/* 수동 갱신 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>

          {/* 마지막 업데이트 시간 */}
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="w-3 h-3 inline mr-1" />
            {refreshTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* 실시간 알림 배너 */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">실시간 모니터링 활성화</p>
              <p className="text-sm text-blue-700">데이터는 5초마다 자동으로 업데이트됩니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 통계 카드들 */}
      <div className="mb-8">
        <HotDealStatsCards refreshKey={refreshTime.getTime()} />
      </div>

      {/* 차트 섹션 */}
      <div className="mb-8">
        <HotDealTrendCharts refreshKey={refreshTime.getTime()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 실시간 피드 */}
        <div className="lg:col-span-1">
          <HotDealRealtimeFeed refreshKey={refreshTime.getTime()} />
        </div>

        {/* 성과 테이블 */}
        <div className="lg:col-span-2">
          <HotDealPerformanceTable refreshKey={refreshTime.getTime()} />
        </div>
      </div>
    </div>
  )
}