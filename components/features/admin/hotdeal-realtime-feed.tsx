'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  TrendingUp, 
  Eye, 
  Heart, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw
} from 'lucide-react'
import { usePopularHotDeals } from '@/hooks/use-supabase-hotdeals'

interface RealtimeFeedProps {
  refreshKey: number
}

interface FeedItem {
  id: string
  type: 'new_hotdeal' | 'trending' | 'expired' | 'high_engagement' | 'system'
  title: string
  description: string
  timestamp: Date
  data?: any
  priority: 'low' | 'medium' | 'high'
}

export function HotDealRealtimeFeed({ refreshKey }: RealtimeFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: popularDeals } = usePopularHotDeals(5)

  // 실시간 피드 아이템 생성 (실제로는 WebSocket이나 Server-Sent Events 사용)
  useEffect(() => {
    const generateMockFeedItem = (): FeedItem => {
      const types = ['new_hotdeal', 'trending', 'high_engagement', 'system'] as const
      const type = types[Math.floor(Math.random() * types.length)]
      const now = new Date()

      switch (type) {
        case 'new_hotdeal':
          return {
            id: `new-${Date.now()}`,
            type,
            title: '새 핫딜 등록',
            description: `갤럭시 S25 사전예약 특가 - ${Math.floor(Math.random() * 50)}% 할인`,
            timestamp: now,
            priority: 'medium'
          }
        
        case 'trending':
          return {
            id: `trending-${Date.now()}`,
            type,
            title: '인기 급상승',
            description: `아이폰 15 Pro 케이스가 조회수 ${(Math.random() * 1000 + 500).toFixed(0)}+ 돌파`,
            timestamp: now,
            priority: 'high'
          }
        
        case 'high_engagement':
          return {
            id: `engagement-${Date.now()}`,
            type,
            title: '높은 참여도',
            description: `무선이어폰 핫딜에 좋아요 ${Math.floor(Math.random() * 100 + 50)}개 달성`,
            timestamp: now,
            priority: 'medium'
          }
        
        case 'system':
          return {
            id: `system-${Date.now()}`,
            type,
            title: '시스템 알림',
            description: `크롤러가 뽐뿌에서 ${Math.floor(Math.random() * 20 + 10)}개 신규 핫딜 발견`,
            timestamp: now,
            priority: 'low'
          }
        
        default:
          return {
            id: `default-${Date.now()}`,
            type: 'system',
            title: '시스템 업데이트',
            description: '핫딜 데이터가 업데이트되었습니다',
            timestamp: now,
            priority: 'low'
          }
      }
    }

    // 초기 피드 아이템들 생성
    const initialItems = Array.from({ length: 8 }, () => generateMockFeedItem())
    setFeedItems(initialItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))

    // 주기적으로 새 아이템 추가
    const interval = setInterval(() => {
      const newItem = generateMockFeedItem()
      setFeedItems(prev => [newItem, ...prev].slice(0, 20)) // 최대 20개 유지
    }, 8000 + Math.random() * 4000) // 8-12초마다

    return () => clearInterval(interval)
  }, [refreshKey])

  const getIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'new_hotdeal':
        return <Zap className="w-4 h-4 text-blue-600" />
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'expired':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'high_engagement':
        return <Heart className="w-4 h-4 text-pink-600" />
      case 'system':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getBadgeColor = (priority: FeedItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}분 전`
    } else {
      return `${seconds}초 전`
    }
  }

  const displayItems = isExpanded ? feedItems : feedItems.slice(0, 6)

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            실시간 알림
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {feedItems.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {displayItems.map((item) => (
          <div 
            key={item.id} 
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.title}
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getBadgeColor(item.priority)}`}
                >
                  {item.priority === 'high' ? '높음' : 
                   item.priority === 'medium' ? '보통' : '낮음'}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {item.description}
              </p>
              
              <p className="text-xs text-gray-400">
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {feedItems.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">실시간 알림을 기다리는 중...</p>
          </div>
        )}
        
        {feedItems.length > 6 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? '접기' : `${feedItems.length - 6}개 더 보기`}
            </Button>
          </div>
        )}
      </CardContent>

      {/* 인기 핫딜 미니 섹션 */}
      {popularDeals && popularDeals.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              인기 핫딜 TOP 3
            </h4>
            
            <div className="space-y-2">
              {popularDeals.slice(0, 3).map((deal, index) => (
                <div key={deal.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="flex-1 truncate text-gray-700">
                    {deal.title}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Eye className="w-3 h-3" />
                    {deal.views?.toLocaleString() || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}