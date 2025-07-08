'use client'

import { Card, CardContent } from '@/components/ui/card'

export function RevenueChart() {
  // 실제로는 Chart.js 또는 Recharts 같은 라이브러리를 사용하여 차트를 그릴 수 있습니다
  // 지금은 간단한 목업 UI를 만들겠습니다
  
  const mockData = [
    { month: '1월', revenue: 12500000 },
    { month: '2월', revenue: 15300000 },
    { month: '3월', revenue: 18700000 },
    { month: '4월', revenue: 21200000 },
    { month: '5월', revenue: 19800000 },
    { month: '6월', revenue: 24500000 },
  ]

  const maxRevenue = Math.max(...mockData.map(d => d.revenue))

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">이번 달 매출</p>
            <p className="text-2xl font-bold">₩24,500,000</p>
            <p className="text-sm text-green-600">+15.3% 증가</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">전체 주문 수</p>
            <p className="text-2xl font-bold">342건</p>
            <p className="text-sm text-green-600">+8.7% 증가</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">평균 주문 금액</p>
            <p className="text-2xl font-bold">₩71,637</p>
            <p className="text-sm text-gray-600">+6.2% 증가</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">월별 매출 추이</h3>
        <div className="space-y-4">
          {mockData.map((data) => (
            <div key={data.month} className="flex items-center gap-4">
              <div className="w-12 text-sm text-gray-600">{data.month}</div>
              <div className="flex-1">
                <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-md"
                    style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-24 text-right text-sm font-medium">
                ₩{(data.revenue / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}