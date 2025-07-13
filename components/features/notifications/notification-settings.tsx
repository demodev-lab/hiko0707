'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Bell, 
  BellOff,
  Mail, 
  Smartphone,
  Monitor,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationPreferences } from '@/lib/services/notification-service'
import { toast } from 'sonner'

const notificationSettingsSchema = z.object({
  orderUpdates: z.boolean(),
  priceAlerts: z.boolean(),
  promotional: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '올바른 시간 형식을 입력해주세요 (HH:mm)'),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '올바른 시간 형식을 입력해주세요 (HH:mm)')
  })
})

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const {
    preferences,
    updatePreferences,
    isUpdatingPreferences,
    isPreferencesLoading,
    isNotificationEnabled,
    requestNotificationPermission
  } = useNotifications()

  const [testNotificationSent, setTestNotificationSent] = useState(false)

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      orderUpdates: true,
      priceAlerts: true,
      promotional: false,
      email: true,
      push: true,
      inApp: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    }
  })

  // 기존 설정 로드
  useEffect(() => {
    if (preferences) {
      form.reset({
        orderUpdates: preferences.orderUpdates,
        priceAlerts: preferences.priceAlerts,
        promotional: preferences.promotional,
        email: preferences.email,
        push: preferences.push,
        inApp: preferences.inApp,
        quietHours: preferences.quietHours
      })
    }
  }, [preferences, form])

  const onSubmit = async (data: NotificationSettingsFormData) => {
    if (!preferences) return

    try {
      const updatedPreferences: NotificationPreferences = {
        ...preferences,
        ...data
      }

      await updatePreferences(updatedPreferences)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      toast.error('설정 저장에 실패했습니다')
    }
  }

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      toast.success('브라우저 알림이 활성화되었습니다')
    } else {
      toast.error('브라우저 알림 권한이 거부되었습니다')
    }
  }

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('테스트 알림', {
        body: '알림 설정이 정상적으로 작동하고 있습니다.',
        icon: '/favicon.ico'
      })
      setTestNotificationSent(true)
      toast.success('테스트 알림을 발송했습니다')
    } else {
      toast.error('브라우저 알림 권한이 필요합니다')
    }
  }

  if (isPreferencesLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">설정을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          알림 설정
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 브라우저 알림 권한 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">브라우저 알림 권한</h3>
            
            {!isNotificationEnabled ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">알림 권한 필요</AlertTitle>
                <AlertDescription className="text-xs">
                  실시간 알림을 받으려면 브라우저 알림 권한을 허용해주세요.
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={handleEnableBrowserNotifications}
                    className="ml-2 text-xs"
                  >
                    권한 허용
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle className="text-sm">알림 권한 활성화됨</AlertTitle>
                <AlertDescription className="text-xs">
                  브라우저 알림을 받을 수 있습니다.
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={sendTestNotification}
                    className="ml-2 text-xs"
                  >
                    테스트 알림 발송
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* 알림 유형별 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              알림 유형
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="orderUpdates" className="text-sm font-medium">
                    주문 상태 업데이트
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    주문 진행 상황, 견적서 발송, 배송 정보 등
                  </p>
                </div>
                <Switch
                  id="orderUpdates"
                  {...form.register('orderUpdates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="priceAlerts" className="text-sm font-medium">
                    가격 변동 알림
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    관심 상품의 가격 변동, 할인 정보 등
                  </p>
                </div>
                <Switch
                  id="priceAlerts"
                  {...form.register('priceAlerts')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="promotional" className="text-sm font-medium">
                    마케팅 및 프로모션
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    특별 할인, 이벤트, 신규 서비스 안내
                  </p>
                </div>
                <Switch
                  id="promotional"
                  {...form.register('promotional')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 알림 채널별 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">알림 채널</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <div>
                    <Label htmlFor="inApp" className="text-sm font-medium">
                      인앱 알림
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      웹사이트 내 알림 센터
                    </p>
                  </div>
                </div>
                <Switch
                  id="inApp"
                  {...form.register('inApp')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <div>
                    <Label htmlFor="push" className="text-sm font-medium">
                      푸시 알림
                      {!isNotificationEnabled && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          권한 필요
                        </Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      브라우저 푸시 알림
                    </p>
                  </div>
                </div>
                <Switch
                  id="push"
                  {...form.register('push')}
                  disabled={!isNotificationEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      이메일 알림
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      중요한 알림을 이메일로 발송
                    </p>
                  </div>
                </div>
                <Switch
                  id="email"
                  {...form.register('email')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 조용한 시간 설정 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              조용한 시간
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quietHours.enabled" className="text-sm font-medium">
                    조용한 시간 활성화
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    설정한 시간에는 알림을 받지 않습니다
                  </p>
                </div>
                <Switch
                  id="quietHours.enabled"
                  {...form.register('quietHours.enabled')}
                />
              </div>

              {form.watch('quietHours.enabled') && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="quietHours.start" className="text-xs">
                      시작 시간
                    </Label>
                    <Input
                      id="quietHours.start"
                      type="time"
                      {...form.register('quietHours.start')}
                      className="text-sm"
                    />
                    {form.formState.errors.quietHours?.start && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.quietHours.start.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quietHours.end" className="text-xs">
                      종료 시간
                    </Label>
                    <Input
                      id="quietHours.end"
                      type="time"
                      {...form.register('quietHours.end')}
                      className="text-sm"
                    />
                    {form.formState.errors.quietHours?.end && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.quietHours.end.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 안내 메시지 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="text-sm">알림 설정 안내</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>• 긴급 알림(결제 마감, 시스템 오류 등)은 조용한 시간에도 발송됩니다</p>
              <p>• 이메일 알림은 중요한 상태 변경 시에만 발송됩니다</p>
              <p>• 설정은 즉시 적용되며 언제든지 변경할 수 있습니다</p>
            </AlertDescription>
          </Alert>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isUpdatingPreferences}
              className="w-full sm:w-auto"
            >
              {isUpdatingPreferences ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  설정 저장
                </>
              )}
            </Button>
          </div>
        </form>

        {/* 테스트 알림 성공 메시지 */}
        {testNotificationSent && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-sm">테스트 알림 발송됨</AlertTitle>
            <AlertDescription className="text-xs">
              브라우저 알림이 정상적으로 작동하는지 확인해보세요.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}