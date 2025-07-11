'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notificationService, Notification } from '@/lib/notifications/notification-service'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertCircle, 
  AlertTriangle,
  Trash2,
  Archive,
  Check
} from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications()
    setNotifications(allNotifications)
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 2000)
    return () => clearInterval(interval)
  }, [])

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    loadNotifications()
  }

  const handleClearAll = () => {
    if (confirm('모든 알림을 삭제하시겠습니까?')) {
      notificationService.clearNotifications()
      loadNotifications()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <h1 className="text-2xl font-bold">알림</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} 새 알림</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            모두 읽음
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            모두 삭제
          </Button>
        </div>
      </div>

      {/* 필터 탭 */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            전체 ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            읽지 않음 ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Archive className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all ${
                    !notification.read 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {getIcon(notification.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {format(notification.timestamp, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="secondary" className="ml-4">새 알림</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button variant="outline" size="sm">
                                자세히 보기
                              </Button>
                            </Link>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              읽음 표시
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 데모용 알림 생성 버튼 */}
      <Card className="mt-8 p-4 bg-gray-50">
        <h3 className="font-medium mb-3">데모용 알림 테스트</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              notificationService.info(
                '새로운 Buy for Me 요청',
                '김철수님이 새로운 요청을 보냈습니다.',
                '/admin/buy-for-me/demo-123'
              )
              loadNotifications()
            }}
          >
            요청 알림
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              notificationService.success(
                '견적서가 발송되었습니다',
                '주문번호 demo-123의 견적서를 확인해주세요.',
                '/mypage/orders/demo-123/quote'
              )
              loadNotifications()
            }}
          >
            견적 알림
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              notificationService.warning(
                '결제 대기 중',
                '24시간 내에 결제를 완료해주세요.',
                '/mypage/orders/demo-123'
              )
              loadNotifications()
            }}
          >
            경고 알림
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              notificationService.error(
                '주문 처리 실패',
                '재고 부족으로 주문을 처리할 수 없습니다.'
              )
              loadNotifications()
            }}
          >
            오류 알림
          </Button>
        </div>
      </Card>
    </div>
  )
}