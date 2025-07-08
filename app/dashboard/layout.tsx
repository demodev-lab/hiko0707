import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  )
}