'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'HiKo',
    siteDescription: '한국 거주 외국인을 위한 핫딜 쇼핑 도우미',
    enableRegistration: true,
    enableNotifications: true,
    autoApprove: false,
    crawlingEnabled: true,
    maintenanceMode: false,
    maxUploadSize: 10,
    sessionTimeout: 30,
    enableBackup: true,
    backupInterval: 24
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // 설정 저장 로직
    console.log('Settings saved:', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">시스템 설정</h1>
            <p className="text-gray-600 mt-1">HiKo 서비스의 시스템 설정을 관리하세요</p>
          </div>
          <Button 
            onClick={handleSave}
            className={saved ? 'bg-green-600' : ''}
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? '저장됨' : '저장하기'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">
              <Settings className="w-4 h-4 mr-2" />
              일반
            </TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="w-4 h-4 mr-2" />
              다국어
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              알림
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              보안
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="w-4 h-4 mr-2" />
              시스템
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="w-4 h-4 mr-2" />
              테마
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">사이트 이름</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">사이트 설명</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableRegistration">회원가입 허용</Label>
                    <p className="text-sm text-gray-600">새로운 사용자의 회원가입을 허용합니다</p>
                  </div>
                  <Switch
                    id="enableRegistration"
                    checked={settings.enableRegistration}
                    onCheckedChange={(checked) => setSettings({...settings, enableRegistration: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">유지보수 모드</Label>
                    <p className="text-sm text-gray-600">사이트를 유지보수 모드로 전환합니다</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>다국어 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>지원 언어</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['한국어', 'English', '中文', '日本語', 'Tiếng Việt', 'ไทย', 'Монгол', 'Русский'].map(lang => (
                      <Badge key={lang} variant="outline" className="cursor-pointer hover:bg-gray-100">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="defaultLanguage">기본 언어</Label>
                  <select 
                    id="defaultLanguage"
                    className="w-full p-2 border rounded-md"
                    defaultValue="ko"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 언어 감지</Label>
                    <p className="text-sm text-gray-600">사용자의 브라우저 언어를 자동으로 감지합니다</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-gray-600">중요한 알림을 이메일로 전송합니다</p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>새 주문 알림</Label>
                    <p className="text-sm text-gray-600">새로운 주문 시 관리자에게 알림을 전송합니다</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>핫딜 알림</Label>
                    <p className="text-sm text-gray-600">새로운 핫딜 발견 시 알림을 전송합니다</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>보안 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxUploadSize">최대 업로드 크기 (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    type="number"
                    value={settings.maxUploadSize}
                    onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 승인</Label>
                    <p className="text-sm text-gray-600">새로운 대리 구매 요청을 자동으로 승인합니다</p>
                  </div>
                  <Switch
                    checked={settings.autoApprove}
                    onCheckedChange={(checked) => setSettings({...settings, autoApprove: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-gray-600">관리자 계정에 2단계 인증을 활성화합니다</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>크롤링 활성화</Label>
                    <p className="text-sm text-gray-600">자동 핫딜 크롤링을 활성화합니다</p>
                  </div>
                  <Switch
                    checked={settings.crawlingEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, crawlingEnabled: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 백업</Label>
                    <p className="text-sm text-gray-600">데이터베이스 자동 백업을 활성화합니다</p>
                  </div>
                  <Switch
                    checked={settings.enableBackup}
                    onCheckedChange={(checked) => setSettings({...settings, enableBackup: checked})}
                  />
                </div>
                <div>
                  <Label htmlFor="backupInterval">백업 주기 (시간)</Label>
                  <Input
                    id="backupInterval"
                    type="number"
                    value={settings.backupInterval}
                    onChange={(e) => setSettings({...settings, backupInterval: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    데이터 백업
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    데이터 복원
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    캐시 삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>테마 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>컬러 테마</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="w-full h-8 bg-blue-600 rounded mb-2"></div>
                      <p className="text-sm font-medium">기본 블루</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="w-full h-8 bg-green-600 rounded mb-2"></div>
                      <p className="text-sm font-medium">그린</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="w-full h-8 bg-purple-600 rounded mb-2"></div>
                      <p className="text-sm font-medium">퍼플</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>다크 모드</Label>
                    <p className="text-sm text-gray-600">어두운 테마를 기본값으로 설정합니다</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}