import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { getUsers } from '@/actions/admin/users';
import { AdminUsersClient } from '@/components/admin/admin-users-client';

export const metadata: Metadata = {
  title: '사용자 관리 - HiKo Admin',
  description: '사용자 관리 페이지',
};

export default async function AdminUsersPage() {
  // Supabase에서 실제 유저 데이터 가져오기
  const users = await getUsers();

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    admins: users.filter((u) => u.role === 'admin').length,
    members: users.filter((u) => u.role === 'member').length,
    guests: users.filter((u) => u.role === 'guest').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">사용자 관리</h1>
            <p className="text-gray-600 mt-1">
              모든 사용자를 관리하고 권한을 설정하세요
            </p>
          </div>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />새 사용자 추가
          </Button>
        </div>

        <AdminUsersClient users={users} stats={stats} />
      </div>
    </div>
  );
}
