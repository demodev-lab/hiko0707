'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserRole, updateUserStatus } from '@/actions/admin/users'
import { type User } from '@/actions/admin/users'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Calendar, Clock, Mail, Phone, Globe, Shield, UserIcon } from 'lucide-react'

interface UserDetailModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!user) return null

  const handleRoleChange = async (newRole: string) => {
    setIsUpdating(true)
    try {
      await updateUserRole(user.id, newRole)
      toast.success('사용자 역할이 변경되었습니다.')
      router.refresh()
    } catch (error) {
      toast.error('역할 변경에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await updateUserStatus(user.id, newStatus)
      toast.success('사용자 상태가 변경되었습니다.')
      router.refresh()
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>사용자 상세 정보</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">이름</Label>
                </div>
                <p className="font-medium">{user.name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">이메일</Label>
                </div>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">전화번호</Label>
                </div>
                <p className="font-medium">{user.phone || '등록되지 않음'}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">선호 언어</Label>
                </div>
                <Badge variant="outline">{user.preferred_language.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          {/* 계정 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">계정 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Clerk User ID</Label>
                <p className="font-mono text-sm">{user.clerk_user_id}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Database ID</Label>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">가입일</Label>
                </div>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">마지막 로그인</Label>
                </div>
                <p className="font-medium">
                  {user.last_logined_at 
                    ? new Date(user.last_logined_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '로그인 기록 없음'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* 권한 관리 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">권한 관리</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">역할</Label>
                </div>
                <Select value={user.role} onValueChange={handleRoleChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">게스트</SelectItem>
                    <SelectItem value="customer">고객</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">상태</Label>
                <Select value={user.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="banned">차단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}