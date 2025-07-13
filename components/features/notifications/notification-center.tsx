'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  BellRing,
  Clock,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  Package,
  DollarSign,
  Truck,
  TrendingDown,
  TrendingUp,
  Info,
  Trash2,
  MoreHorizontal,
  Filter
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationData, NotificationType } from '@/lib/services/notification-service'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotificationCenterProps {
  className?: string
  compact?: boolean
}

export function NotificationCenter({ className = '', compact = false }: NotificationCenterProps) {
  const {
    notifications,
    stats,
    notificationsByPriority,
    markAsRead,
    deleteNotification,
    isLoading,
    isMarkingAsRead,
    isDeleting
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'urgent'>('all')
  const [showRead, setShowRead] = useState(true)

  // 탭별 알림 필터링
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    switch (activeTab) {
      case 'unread':
        filtered = notifications.filter(n => n.status === 'unread')
        break
      case 'urgent':
        filtered = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread')
        break
      default:
        filtered = notifications
    }

    if (!showRead) {
      filtered = filtered.filter(n => n.status === 'unread')
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notifications, activeTab, showRead])

  const getNotificationIcon = (type: NotificationType, priority: string) => {
    const iconProps = {
      className: `w-4 h-4 ${
        priority === 'urgent' ? 'text-red-600' :
        priority === 'high' ? 'text-orange-600' :
        priority === 'medium' ? 'text-blue-600' :
        'text-gray-600'
      }`
    }

    switch (type) {
      case 'order_status_update':
        return <Package {...iconProps} />
      case 'quote_received':
      case 'quote_approved':
        return <DollarSign {...iconProps} />
      case 'payment_reminder':
        return <AlertTriangle {...iconProps} />
      case 'shipping_update':
        return <Truck {...iconProps} />
      case 'price_alert':
        return <TrendingDown {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      urgent: { variant: 'destructive' as const, label: '긴급' },
      high: { variant: 'default' as const, label: '중요' },
      medium: { variant: 'secondary' as const, label: '일반' },
      low: { variant: 'outline' as const, label: '낮음' }
    }

    const { variant, label } = config[priority as keyof typeof config] || config.medium

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    )
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => n.status === 'unread')
      .map(n => n.id)
    
    try {
      await Promise.all(unreadIds.map(id => markAsRead(id)))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              알림
              {stats.unread > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.unread}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notifications">
                전체보기
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {filteredNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2 rounded-lg border text-sm ${
                    notification.status === 'unread' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type, notification.priority)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredNotifications.length === 0 && (
                <div className="text-center py-4">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">알림이 없습니다</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            알림 센터
            {stats.unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.unread}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRead(!showRead)}
              className="text-xs"
            >
              {showRead ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {showRead ? '읽은 알림 숨기기' : '읽은 알림 보기'}
            </Button>
            {stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAsRead}
                className="text-xs"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                모두 읽음
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">
              전체 ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              읽지 않음 ({stats.unread})
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs">
              긴급 ({notificationsByPriority.urgent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* 통계 요약 */}
            <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">총 알림</p>
                <p className="text-sm font-bold">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">읽지 않음</p>
                <p className="text-sm font-bold text-blue-600">{stats.unread}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">긴급</p>
                <p className="text-sm font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">오늘</p>
                <p className="text-sm font-bold text-green-600">{stats.today}</p>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.status === 'unread' 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(notification.createdAt), 'MM/dd HH:mm', { locale: ko })}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </span>
                          </div>
                          
                          {/* 액션 버튼 */}
                          {notification.actionUrl && (
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                asChild
                                className="text-xs"
                              >
                                <Link href={notification.actionUrl}>
                                  {notification.actionLabel || '확인'}
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 액션 메뉴 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {notification.status === 'unread' && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={isMarkingAsRead}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-2" />
                              읽음으로 표시
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(notification.id)}
                            disabled={isDeleting}
                            className="text-red-600"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {activeTab === 'unread' ? '읽지 않은 알림이 없습니다' :
                       activeTab === 'urgent' ? '긴급 알림이 없습니다' :
                       '알림이 없습니다'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}