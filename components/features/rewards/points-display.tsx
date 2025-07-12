'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins, TrendingUp, Gift, Award, Star } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { AccessibleButton } from '@/components/common/accessible-button'

interface PointsDisplayProps {
  userId?: string
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

interface UserPoints {
  currentPoints: number
  totalEarned: number
  totalSpent: number
  level: number
  levelName: string
  nextLevelPoints: number
  levelProgress: number
  rank: number
  pendingPoints: number
}

const levelConfig = [
  { level: 1, name: '브론즈', minPoints: 0, color: 'text-orange-600', icon: '🥉' },
  { level: 2, name: '실버', minPoints: 1000, color: 'text-gray-500', icon: '🥈' },
  { level: 3, name: '골드', minPoints: 5000, color: 'text-yellow-600', icon: '🥇' },
  { level: 4, name: '플래티넘', minPoints: 10000, color: 'text-blue-600', icon: '💎' },
  { level: 5, name: '다이아몬드', minPoints: 20000, color: 'text-purple-600', icon: '💠' }
]

export function PointsDisplay({
  userId,
  className,
  variant = 'default'
}: PointsDisplayProps) {
  const { t, formatNumber } = useLanguage()
  const [points, setPoints] = useState<UserPoints>({
    currentPoints: 0,
    totalEarned: 0,
    totalSpent: 0,
    level: 1,
    levelName: '브론즈',
    nextLevelPoints: 1000,
    levelProgress: 0,
    rank: 0,
    pendingPoints: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // 포인트 데이터 로드
    const loadPoints = async () => {
      setLoading(true)
      
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockPoints = {
        currentPoints: 3250,
        totalEarned: 15000,
        totalSpent: 11750,
        level: 2,
        levelName: '실버',
        nextLevelPoints: 5000,
        levelProgress: 65,
        rank: 127,
        pendingPoints: 500
      }
      
      setPoints(mockPoints)
      setLoading(false)
      setShowAnimation(true)
    }

    loadPoints()
  }, [userId])

  const currentLevel = levelConfig.find(l => l.level === points.level) || levelConfig[0]
  const nextLevel = levelConfig.find(l => l.level === points.level + 1)

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact 버전
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
          <Coins className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">내 포인트</p>
          <p className="text-lg font-bold">{formatNumber(points.currentPoints)}P</p>
        </div>
        <Badge variant="outline" className={currentLevel.color}>
          {currentLevel.icon} {currentLevel.name}
        </Badge>
      </div>
    )
  }

  // Detailed 버전
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* 메인 포인트 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                {t('rewards.myPoints')}
              </span>
              <Badge className={cn('text-sm', currentLevel.color)}>
                {currentLevel.icon} {currentLevel.name} Lv.{points.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 현재 포인트 */}
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(points.currentPoints)}
                  <span className="text-2xl ml-1">P</span>
                </p>
                {points.pendingPoints > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    (+{formatNumber(points.pendingPoints)}P 적립 예정)
                  </p>
                )}
              </div>

              {/* 레벨 진행도 */}
              {nextLevel && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentLevel.name}</span>
                    <span>{nextLevel.name}까지 {formatNumber(nextLevel.minPoints - points.totalEarned)}P</span>
                  </div>
                  <Progress value={points.levelProgress} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">
                    누적 {formatNumber(points.totalEarned)}P / {formatNumber(nextLevel.minPoints)}P
                  </p>
                </div>
              )}

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-500">총 적립</p>
                  <p className="font-semibold">{formatNumber(points.totalEarned)}P</p>
                </div>
                <div className="text-center border-x">
                  <p className="text-sm text-gray-500">총 사용</p>
                  <p className="font-semibold">{formatNumber(points.totalSpent)}P</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">내 순위</p>
                  <p className="font-semibold">#{formatNumber(points.rank)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 포인트 혜택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{currentLevel.name} 등급 혜택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="text-sm">구매 시 {points.level + 1}% 추가 적립</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">생일 {points.level * 500}P 보너스</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-sm">등급 전용 이벤트 참여</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default 버전
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          {t('rewards.myPoints')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                'text-3xl font-bold',
                showAnimation && 'animate-pulse'
              )}>
                {formatNumber(points.currentPoints)}
                <span className="text-xl ml-1">P</span>
              </p>
              {points.pendingPoints > 0 && (
                <p className="text-sm text-gray-500">
                  +{formatNumber(points.pendingPoints)}P 적립 예정
                </p>
              )}
            </div>
            <Badge variant="outline" className={cn('text-sm', currentLevel.color)}>
              {currentLevel.icon} {currentLevel.name}
            </Badge>
          </div>

          {nextLevel && (
            <div className="space-y-1">
              <Progress value={points.levelProgress} className="h-2" />
              <p className="text-xs text-gray-500">
                {nextLevel.name}까지 {formatNumber(nextLevel.minPoints - points.totalEarned)}P
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}