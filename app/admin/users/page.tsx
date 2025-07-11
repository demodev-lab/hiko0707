import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { db } from '@/lib/db/database-service'
import { Users, UserPlus, Edit, Trash2, Mail, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: '사용자 관리 - HiKo Admin',
  description: '사용자 관리 페이지'
}

export default async function AdminUsersPage() {
  const users = await db.users.findAll()
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600">관리자</Badge>
      case 'customer':
        return <Badge variant="secondary">고객</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (updatedAt: Date) => {
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate < 7) {
      return <Badge className="bg-green-600">활성</Badge>
    } else if (daysSinceUpdate < 30) {
      return <Badge variant="secondary">비활성</Badge>
    } else {
      return <Badge variant="outline">휴면</Badge>
    }
  }

  const stats = {
    total: users.length,
    active: users.filter(u => {
      const daysSinceUpdate = (Date.now() - new Date(u.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate < 7
    }).length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">사용자 관리</h1>
            <p className="text-gray-600 mt-1">모든 사용자를 관리하고 권한을 설정하세요</p>
          </div>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            새 사용자 추가
          </Button>
        </div>

        {/* 통계 카드 */}
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
                  <p className="text-sm text-gray-600">고객</p>
                  <p className="text-2xl font-bold">{stats.customers}</p>
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
                    <th className="text-left p-3">가입일</th>
                    <th className="text-left p-3">마지막 활동</th>
                    <th className="text-left p-3">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{getRoleBadge(user.role)}</td>
                      <td className="p-3">{getStatusBadge(user.updatedAt)}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(user.updatedAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  )
}