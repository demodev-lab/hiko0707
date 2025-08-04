'use client'

import { useState, useEffect } from 'react'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, User, Phone, Globe, Bell, Check, Camera } from 'lucide-react'

interface ProfileSettingsProps {
  // userId는 useAuth에서 가져오므로 props로 받지 않음
}

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'mn', label: 'Монгол' },
  { value: 'th', label: 'ไทย' },
  { value: 'ja', label: '日本語' },
  { value: 'ru', label: 'Русский' }
] as const

// 알림 타입은 notifications 테이블에서 관리

export function ProfileSettings({}: ProfileSettingsProps) {
  const { 
    user,
    userProfile,
    notifications,
    isLoading,
    updateUser,
    updateLanguage,
    updateAvatar,
    isUpdatingUser,
    isUpdatingLanguage,
    isUpdatingAvatar
  } = useSupabaseUser()

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferred_language: 'ko'
  })
  
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // 사용자 데이터로 폼 초기화
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        preferred_language: user.preferred_language || 'ko'
      })
    }
    if (userProfile) {
      setAvatarUrl(userProfile.avatar_url || '')
    }
  }, [user, userProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // users 테이블 업데이트
    updateUser({
      name: formData.name,
      phone: formData.phone || undefined,
      preferred_language: formData.preferred_language
    })
  }
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 실제 구현에서는 파일 업로드 처리 필요
    // 임시로 data URL 사용
    const reader = new FileReader()
    reader.onloadend = () => {
      const url = reader.result as string
      setAvatarUrl(url)
      updateAvatar(url)
    }
    reader.readAsDataURL(file)
  }

  // 알림 설정은 별도 섹션으로 관리되므로 제거

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const isSubmitting = isUpdatingUser || isUpdatingLanguage

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">ℹ️ 프로필 설정</span> - 
          이름, 연락처, 언어 설정을 관리할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 프로필 사진 */}
            <div className="space-y-4">
              <Label className="block text-sm font-medium">프로필 사진</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt="프로필 사진" />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">사진 변경</span>
                    </div>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUpdatingAvatar}
                  />
                </div>
              </div>
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                이름
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="max-w-md"
              />
            </div>

            {/* 전화번호 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                전화번호
                <span className="text-xs text-gray-500">(선택사항)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="max-w-md"
              />
            </div>

            {/* 언어 설정 */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                언어 설정
              </Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, preferred_language: value }))
                  // 언어 변경은 즉시 적용
                  updateLanguage(value)
                }}
              >
                <SelectTrigger id="language" className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                시스템 전체에서 사용할 기본 언어를 선택하세요.
              </p>
            </div>


            {/* 저장 버튼 */}
            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 알림 설정 섹션 (나중에 notifications 테이블 연동 필요) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              알림 기능은 현재 개발 중입니다.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              등록된 알림: {notifications.length}개
            </p>
            <p className="text-sm text-gray-600">
              읽지 않은 알림: {notifications.filter(n => !n.is_read).length}개
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 프로필 상태 표시 */}
      {user && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              <p className="text-sm font-medium">프로필이 활성화되었습니다</p>
            </div>
            <p className="text-xs text-green-700 mt-1">
              마지막 업데이트: {user.updated_at ? new Date(user.updated_at).toLocaleString('ko-KR') : '알 수 없음'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}