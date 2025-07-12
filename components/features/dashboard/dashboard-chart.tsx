'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface DashboardChartProps {
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: ChartData[]
  dataKey?: string
  xAxisKey?: string
  className?: string
  height?: number
  colors?: string[]
}

const defaultColors = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316'  // orange-500
]

export function DashboardChart({
  title,
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  className,
  height = 300,
  colors = defaultColors
}: DashboardChartProps) {
  const { t, formatNumber, formatCurrency } = useLanguage()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend className="text-sm" />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend className="text-sm" />
              <Bar
                dataKey={dataKey}
                fill={colors[0]}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend className="text-sm" />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}

// 다중 차트를 보여주는 대시보드 차트 컨테이너
interface DashboardChartsProps {
  className?: string
}

export function DashboardCharts({ className }: DashboardChartsProps) {
  const { t } = useLanguage()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({
    orders: [] as ChartData[],
    revenue: [] as ChartData[],
    categories: [] as ChartData[],
    savings: [] as ChartData[]
  })

  useEffect(() => {
    // 차트 데이터 로드
    const loadChartData = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 더미 데이터 생성
      const generateTimeSeriesData = (days: number) => {
        return Array.from({ length: days }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (days - i - 1))
          return {
            name: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            value: Math.floor(Math.random() * 1000000) + 500000,
            orders: Math.floor(Math.random() * 50) + 10
          }
        })
      }

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
      const ordersData = generateTimeSeriesData(days)
      const revenueData = ordersData.map(item => ({
        ...item,
        revenue: item.value
      }))

      const categoriesData = [
        { name: '전자제품', value: 35 },
        { name: '패션', value: 25 },
        { name: '식품', value: 20 },
        { name: '뷰티', value: 12 },
        { name: '기타', value: 8 }
      ]

      const savingsData = generateTimeSeriesData(days).map(item => ({
        ...item,
        savings: Math.floor(item.value * 0.3)
      }))

      setChartData({
        orders: ordersData,
        revenue: revenueData,
        categories: categoriesData,
        savings: savingsData
      })
      setLoading(false)
    }

    loadChartData()
  }, [timeRange])

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 시간 범위 선택 */}
      <Tabs defaultValue="month" onValueChange={(value) => setTimeRange(value as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="week">{t('dashboard.lastWeek')}</TabsTrigger>
          <TabsTrigger value="month">{t('dashboard.lastMonth')}</TabsTrigger>
          <TabsTrigger value="year">{t('dashboard.lastYear')}</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6 mt-6">
          {/* 주문 추이 */}
          <DashboardChart
            title={t('dashboard.orderTrend')}
            type="area"
            data={chartData.orders}
            dataKey="orders"
            height={300}
          />

          {/* 매출 추이 */}
          <DashboardChart
            title={t('dashboard.revenueTrend')}
            type="line"
            data={chartData.revenue}
            dataKey="revenue"
            height={300}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {/* 카테고리별 구매 비율 */}
            <DashboardChart
              title={t('dashboard.purchaseByCategory')}
              type="pie"
              data={chartData.categories}
              height={300}
            />

            {/* 절약 금액 추이 */}
            <DashboardChart
              title={t('dashboard.savingsTrend')}
              type="bar"
              data={chartData.savings.slice(-7)}
              dataKey="savings"
              height={300}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}