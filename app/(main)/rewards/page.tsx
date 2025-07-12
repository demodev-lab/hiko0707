import { Suspense } from 'react'
import { PointsDisplay } from '@/components/features/rewards/points-display'
import { PointsHistory } from '@/components/features/rewards/points-history'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function RewardsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">리워드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          포인트를 적립하고 다양한 혜택을 받아보세요
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="overview">포인트 현황</TabsTrigger>
          <TabsTrigger value="history">적립/사용 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 포인트 현황 */}
          <Suspense fallback={<div>Loading points...</div>}>
            <PointsDisplay userId={user.id} variant="detailed" />
          </Suspense>
        </TabsContent>

        <TabsContent value="history">
          {/* 포인트 히스토리 */}
          <Suspense fallback={<div>Loading history...</div>}>
            <PointsHistory userId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}