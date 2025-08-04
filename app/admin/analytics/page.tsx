import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SupabaseAdminService } from '@/lib/services/supabase-admin-service'
import { BarChart, TrendingUp, Users, Package, DollarSign, Eye, Calendar, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { isAdmin } from '@/utils/roles'

export const metadata: Metadata = {
  title: '통계 분석 - HiKo Admin',
  description: '통계 분석 페이지'
}

export default async function AdminAnalyticsPage() {
  const hasAdminRole = await isAdmin()
  
  if (!hasAdminRole) {
    redirect('/')
  }

  // 최적화된 서버사이드 집계 쿼리 사용
  const [stats, monthlyStats, categoryStats, topHotdeals] = await Promise.all([
    SupabaseAdminService.getDashboardStatistics(),
    SupabaseAdminService.getMonthlyStatistics(),
    SupabaseAdminService.getCategoryStatistics(), 
    SupabaseAdminService.getTopHotDeals(5)
  ])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">통계 분석</h1>
            <p className="text-gray-600 mt-1">서비스 성과와 트렌드를 분석하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              기간 설정
            </Button>
            <Button size="sm">
              <BarChart className="w-4 h-4 mr-2" />
              리포트 생성
            </Button>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 사용자</p>
                  <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className={`text-sm flex items-center gap-1 ${stats.monthlyGrowth.users >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.monthlyGrowth.users >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    {Math.abs(stats.monthlyGrowth.users)}% 전월 대비
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 주문 수</p>
                  <p className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                  <p className={`text-sm flex items-center gap-1 ${stats.monthlyGrowth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.monthlyGrowth.orders >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    {Math.abs(stats.monthlyGrowth.orders)}% 전월 대비
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 매출</p>
                  <p className="text-3xl font-bold">₩{stats.totalRevenue.toLocaleString()}</p>
                  <p className={`text-sm flex items-center gap-1 ${stats.monthlyGrowth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.monthlyGrowth.revenue >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    {Math.abs(stats.monthlyGrowth.revenue)}% 전월 대비
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 조회수</p>
                  <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">실시간 집계</p>
                </div>
                <Eye className="w-12 h-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">평균 주문 금액</p>
                  <p className="text-3xl font-bold">₩{Math.round(stats.avgOrderValue).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">전체 평균</p>
                </div>
                <TrendingUp className="w-12 h-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전환율</p>
                  <p className="text-3xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">주문/사용자 비율</p>
                </div>
                <BarChart className="w-12 h-12 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 월별 트렌드 */}
          <Card>
            <CardHeader>
              <CardTitle>월별 트렌드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{stat.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">주문: {stat.orders}</p>
                      <p className="text-sm text-gray-600">사용자: {stat.users}</p>
                      <p className="text-sm text-green-600">₩{stat.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 카테고리별 핫딜 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 핫딜 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <span className="capitalize">{stat.category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stat.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{stat.count}개</span>
                      <span className="text-xs text-gray-500 w-10 text-right">{stat.percentage}%</span>
                    </div>
                  </div>
                ))}
                {categoryStats.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>카테고리 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 인기 핫딜 TOP 5 */}
        <Card>
          <CardHeader>
            <CardTitle>인기 핫딜 TOP 5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHotdeals.map((hotdeal) => (
                <div key={hotdeal.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {hotdeal.ranking}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{hotdeal.title}</h3>
                    <p className="text-sm text-gray-600">
                      {hotdeal.category || '기타'} · {hotdeal.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{hotdeal.views.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">조회수</p>
                  </div>
                </div>
              ))}
              {topHotdeals.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>인기 핫딜 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}