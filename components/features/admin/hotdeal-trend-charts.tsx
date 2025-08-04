'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { useHotDealStats } from '@/hooks/use-supabase-hotdeals'

interface TrendChartsProps {
  refreshKey: number
}

export function HotDealTrendCharts({ refreshKey }: TrendChartsProps) {
  const { data: todayStats } = useHotDealStats('today')
  const { data: weekStats } = useHotDealStats('week')
  const { data: monthStats } = useHotDealStats('month')

  // 24시간 트렌드 데이터 생성 (모의 데이터)
  const hourlyTrendData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourValue = hour.getHours()
      
      // 실제로는 시간대별 데이터를 가져와야 하지만, 여기서는 패턴 시뮬레이션
      const baseValue = Math.floor(Math.random() * 20) + 5
      const peakHours = [9, 10, 11, 12, 13, 18, 19, 20, 21] // 피크 시간대
      const multiplier = peakHours.includes(hourValue) ? 1.5 + Math.random() * 0.5 : 1
      
      data.push({
        hour: `${hourValue.toString().padStart(2, '0')}:00`,
        deals: Math.floor(baseValue * multiplier),
        views: Math.floor(baseValue * multiplier * (50 + Math.random() * 100)),
        likes: Math.floor(baseValue * multiplier * (5 + Math.random() * 10))
      })
    }
    
    return data
  }, [refreshKey])

  // 카테고리별 분포 데이터
  const categoryData = useMemo(() => {
    if (!todayStats?.byCategory) return []
    
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ]
    
    return Object.entries(todayStats.byCategory).map(([category, count], index) => ({
      name: category || '기타',
      value: count as number,
      percentage: todayStats.totalDeals > 0 ? (((count as number) / todayStats.totalDeals) * 100).toFixed(1) : '0',
      color: colors[index % colors.length]
    }))
  }, [todayStats])

  // 소스별 성과 데이터
  const sourceData = useMemo(() => {
    if (!todayStats?.bySource) return []
    
    return Object.entries(todayStats.bySource).map(([source, count]) => ({
      source: source || '알 수 없음',
      deals: count as number,
      successRate: 85 + Math.random() * 15, // 성공률은 실제 데이터로 교체 필요
    }))
  }, [todayStats])

  // 주간 트렌드 데이터 생성
  const weeklyTrendData = useMemo(() => {
    const data = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' })
      
      // 실제로는 일별 데이터를 가져와야 하지만, 여기서는 패턴 시뮬레이션
      const baseValue = 100 + Math.floor(Math.random() * 200)
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.7 : 1
      
      data.push({
        day: dayName,
        deals: Math.floor(baseValue * weekendMultiplier),
        views: Math.floor(baseValue * weekendMultiplier * (80 + Math.random() * 40)),
        engagement: Math.floor(baseValue * weekendMultiplier * (10 + Math.random() * 15))
      })
    }
    
    return data
  }, [refreshKey])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any): JSX.Element | null => {
    if (percent < 0.05) return null // 5% 미만은 라벨 숨김
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 24시간 트렌드 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            24시간 핫딜 생성 추세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData}>
                <defs>
                  <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hour" 
                  className="text-xs text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs text-gray-600" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="deals"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorDeals)"
                  strokeWidth={2}
                  name="새 핫딜"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리별 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, '개수']}
                  labelFormatter={(label) => `카테고리: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* 범례 */}
          <div className="mt-4 space-y-2">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>{item.value}개</span>
                  <span className="text-xs">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 소스별 성과 */}
      <Card>
        <CardHeader>
          <CardTitle>소스별 크롤링 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" className="text-xs text-gray-600" />
                <YAxis 
                  dataKey="source" 
                  type="category" 
                  className="text-xs text-gray-600"
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="deals" 
                  fill="#3B82F6" 
                  radius={[0, 4, 4, 0]}
                  name="핫딜 수"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 주간 트렌드 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>주간 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs text-gray-600" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deals"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                  name="핫딜 수"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                  name="조회수"
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                  name="참여도"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}