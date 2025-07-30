import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/features/admin/admin-sidebar'
import { isAdmin } from '@/utils/roles'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}