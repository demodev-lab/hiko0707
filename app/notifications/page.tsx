'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/contexts/notification-context'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Bell, Check, Trash2, ExternalLink, Package, CreditCard, Truck, Tag, Settings } from 'lucide-react'
import Link from 'next/link'

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'order':
      return <Package className="w-5 h-5 text-blue-500" />
    case 'payment':
      return <CreditCard className="w-5 h-5 text-green-500" />
    case 'shipping':
      return <Truck className="w-5 h-5 text-orange-500" />
    case 'promotion':
      return <Tag className="w-5 h-5 text-purple-500" />
    case 'system':
      return <Settings className="w-5 h-5 text-gray-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-500" />
  }
}

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'order':
      return '주문'
    case 'payment':
      return '결제'
    case 'shipping':
      return '배송'
    case 'promotion':
      return '프로모션'
    case 'system':
      return '시스템'
    default:
      return '기타'
  }
}

export default function NotificationsPage() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearNotifications 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const notificationsByType = filteredNotifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = []
    }
    acc[notification.type].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">알림</h1>
        <div className="flex gap-2">
          {notifications.some(n => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="w-4 h-4 mr-2" />
              모두 읽음
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              모두 삭제
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all" onClick={() => setFilter('all')}>
            전체 ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" onClick={() => setFilter('unread')}>
            읽지 않음 ({notifications.filter(n => !n.read).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">새로운 알림이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(notificationsByType).map(([type, typeNotifications]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NotificationIcon type={type} />
                    {getNotificationTypeLabel(type)} ({typeNotifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {typeNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${!notification.read ? 'text-black' : 'text-gray-700'}`}>
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    새 알림
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(notification.createdAt, { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {notification.link && (
                                <Link href={notification.link}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">읽지 않은 알림이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(notificationsByType).map(([type, typeNotifications]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NotificationIcon type={type} />
                    {getNotificationTypeLabel(type)} ({typeNotifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {typeNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 rounded-lg border bg-blue-50 border-blue-200 transition-colors cursor-pointer hover:bg-blue-100"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-black">
                                  {notification.title}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  새 알림
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(notification.createdAt, { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {notification.link && (
                                <Link href={notification.link}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}