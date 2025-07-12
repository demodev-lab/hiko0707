import { Suspense } from 'react'
import { HotDealFilters } from '@/components/features/hotdeal/hotdeal-filters'
import { AdvancedHotDealFilters } from '@/components/features/filter/advanced-hotdeal-filters'
import { SearchBarWithUrl } from '@/components/features/search/search-bar-with-url'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function UrlSyncTestContent() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">URL 동기화 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Advanced Filters - Desktop Sidebar */}
        <div className="lg:col-span-1">
          <AdvancedHotDealFilters />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <Card>
            <CardHeader>
              <CardTitle>검색 (URL 동기화)</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchBarWithUrl showPopularKeywords />
            </CardContent>
          </Card>

          {/* Basic Filters */}
          <Card>
            <CardHeader>
              <CardTitle>기본 필터 (URL 동기화)</CardTitle>
            </CardHeader>
            <CardContent>
              <HotDealFilters />
            </CardContent>
          </Card>

          {/* URL State Display */}
          <Card>
            <CardHeader>
              <CardTitle>현재 URL 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <UrlStateDisplay />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function UrlStateDisplay() {
  'use client'
  
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
  
  const params = Array.from(searchParams.entries())
  
  return (
    <div className="space-y-2">
      {params.length === 0 ? (
        <p className="text-gray-500">URL 파라미터가 없습니다</p>
      ) : (
        <div className="space-y-1">
          {params.map(([key, value]) => (
            <div key={key} className="flex gap-2 font-mono text-sm">
              <span className="font-semibold text-blue-600">{key}:</span>
              <span className="text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
          {typeof window !== 'undefined' ? window.location.href : ''}
        </p>
      </div>
    </div>
  )
}

export default function TestUrlSyncPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UrlSyncTestContent />
    </Suspense>
  )
}