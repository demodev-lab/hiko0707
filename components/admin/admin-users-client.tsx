'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, UserPlus, Edit, Mail, Shield, Calendar, Clock } from 'lucide-react'
import { UserDetailModal } from './user-detail-modal'
import { type User } from '@/actions/admin/users'

interface AdminUsersClientProps {
  users: User[]
  stats: {
    total: number
    active: number
    admins: number
    members: number
    guests: number
  }
}

export function AdminUsersClient({ users, stats }: AdminUsersClientProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600">관리자</Badge>
      case 'member':
        return <Badge variant="secondary">회원</Badge>
      case 'guest':
        return <Badge variant="outline">게스트</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">활성</Badge>
      case 'inactive':
        return <Badge variant="secondary">비활성</Badge>
      case 'banned':
        return <Badge variant="destructive">차단됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">관리자</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">회원</p>
                <p className="text-2xl font-bold">{stats.members}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            사용자 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">사용자</th>
                  <th className="text-left p-3">이메일</th>
                  <th className="text-left p-3">역할</th>
                  <th className="text-left p-3">상태</th>
                  <th className="text-left p-3">선호 언어</th>
                  <th className="text-left p-3">가입일</th>
                  <th className="text-left p-3">마지막 로그인</th>
                  <th className="text-left p-3">작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.phone || '전화번호 없음'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{user.email}</p>
                      <p className="text-xs text-gray-500">Clerk ID: {user.clerk_user_id}</p>
                    </td>
                    <td className="p-3">{getRoleBadge(user.role)}</td>
                    <td className="p-3">{getStatusBadge(user.status)}</td>
                    <td className="p-3">
                      <Badge variant="outline">{user.preferred_language.toUpperCase()}</Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {user.last_logined_at ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(user.last_logined_at).toLocaleDateString('ko-KR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">로그인 기록 없음</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" title="이메일 보내기">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="편집"
                          onClick={() => handleUserClick(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserDetailModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </>
  )
}