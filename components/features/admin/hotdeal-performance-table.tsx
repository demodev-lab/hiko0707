'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowUpDown,
  Eye, 
  Heart, 
  MessageSquare,
  Clock,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { usePopularHotDeals } from '@/hooks/use-supabase-hotdeals'

interface PerformanceTableProps {
  refreshKey: number
}

type SortField = 'title' | 'views' | 'like_count' | 'created_at' | 'category' | 'source'
type SortDirection = 'asc' | 'desc'

export function HotDealPerformanceTable({ refreshKey }: PerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('views')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showExpired, setShowExpired] = useState(false)

  const { data: hotdeals = [], isLoading } = usePopularHotDeals(50)

  // 검색 및 정렬된 데이터
  const processedData = useMemo(() => {
    let filtered = hotdeals.filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase())
      const isExpired = deal.status === 'expired' || deal.status === 'ended'
      const showItem = showExpired || !isExpired
      return matchesSearch && showItem
    })

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'views':
          aValue = a.views || 0
          bValue = b.views || 0
          break
        case 'like_count':
          aValue = a.like_count || 0
          bValue = b.like_count || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'category':
          aValue = a.category || ''
          bValue = b.category || ''
          break
        case 'source':
          aValue = a.source || ''
          bValue = b.source || ''
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [hotdeals, searchTerm, sortField, sortDirection, showExpired])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getStatusBadge = (deal: any) => {
    const now = new Date()
    const endDate = deal.end_date ? new Date(deal.end_date) : null
    const isExpired = endDate && endDate < now
    
    if (deal.status === 'expired' || deal.status === 'ended' || isExpired) {
      return <Badge variant="secondary" className="text-xs">만료</Badge>
    } else if (deal.status === 'active') {
      return <Badge className="text-xs bg-green-100 text-green-800">활성</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">대기</Badge>
    }
  }

  const getPerformanceScore = (deal: any) => {
    const views = deal.views || 0
    const likes = deal.like_count || 0
    const comments = deal.comment_count || 0
    
    // 간단한 성과 점수 계산 (실제로는 더 복잡한 알고리즘 사용)
    const score = (views * 0.1) + (likes * 2) + (comments * 3)
    
    if (score >= 100) return { label: '우수', color: 'bg-green-100 text-green-800', score }
    if (score >= 50) return { label: '양호', color: 'bg-blue-100 text-blue-800', score }
    if (score >= 20) return { label: '보통', color: 'bg-yellow-100 text-yellow-800', score }
    return { label: '낮음', color: 'bg-gray-100 text-gray-800', score }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </Button>
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>핫딜 성과 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            핫딜 성과 분석
          </CardTitle>
          <Badge variant="outline">
            총 {processedData.length}개
          </Badge>
        </div>
        
        {/* 검색 및 필터 */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="핫딜 제목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant={showExpired ? "default" : "outline"}
            size="sm"
            onClick={() => setShowExpired(!showExpired)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {showExpired ? '만료 포함' : '활성만'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <SortButton field="title">핫딜 제목</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="category">카테고리</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="source">소스</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="views">조회수</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="like_count">좋아요</SortButton>
                </TableHead>
                <TableHead>성과</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">
                  <SortButton field="created_at">등록시간</SortButton>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((deal) => {
                const performance = getPerformanceScore(deal)
                
                return (
                  <TableRow key={deal.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium line-clamp-2 text-sm">
                          {deal.title}
                        </p>
                        {deal.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {deal.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {deal.category || '기타'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {deal.source || '알 수 없음'}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          {(deal.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Heart className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium">
                          {(deal.like_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`text-xs ${performance.color}`}>
                        {performance.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(deal)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(deal.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {deal.original_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(deal.original_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {processedData.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchTerm ? '검색 결과가 없습니다' : '핫딜 데이터가 없습니다'}
              </p>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs"
                >
                  검색 초기화
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}