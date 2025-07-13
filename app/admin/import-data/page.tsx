'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Upload, RefreshCw, AlertCircle } from 'lucide-react'
import { db } from '@/lib/db/database-service'
import { toast } from 'sonner'

export default function ImportDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  const handleClearHotdeals = async () => {
    if (!confirm('정말로 모든 핫딜 데이터를 삭제하시겠습니까?')) {
      return
    }
    
    setIsLoading(true)
    try {
      const hotdeals = await db.hotdeals.findAll()
      const count = hotdeals.length
      
      for (const hotdeal of hotdeals) {
        await db.hotdeals.delete(hotdeal.id)
      }
      
      toast.success(`${count}개의 핫딜이 삭제되었습니다.`)
      await loadStats()
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
        throw new Error('잘못된 JSON 형식입니다.')
      }
      
      // Clear existing data first
      const existing = await db.hotdeals.findAll()
      for (const hotdeal of existing) {
        await db.hotdeals.delete(hotdeal.id)
      }
      
      // Import new data
      let savedCount = 0
      for (const hotdeal of data.hotdeals) {
        try {
          await db.hotdeals.create({
            ...hotdeal,
            id: undefined // Let the system generate new ID
          })
          savedCount++
        } catch (error) {
          console.error('Failed to save hotdeal:', hotdeal.title, error)
        }
      }
      
      toast.success(`${savedCount}개의 핫딜을 가져왔습니다.`)
      await loadStats()
      
    } catch (error) {
      toast.error('가져오기 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    } finally {
      setIsLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }
  
  const loadStats = async () => {
    try {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') return
      
      const hotdeals = await db.hotdeals.findAll()
      const categories = new Set(hotdeals.map(h => h.category))
      const sources = new Set(hotdeals.map(h => h.source))
      
      setStats({
        total: hotdeals.length,
        categories: categories.size,
        sources: sources.size,
        freeShipping: hotdeals.filter(h => h.shipping?.isFree).length,
        popular: hotdeals.filter(h => h.isPopular).length
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
      // 에러 발생 시 기본값 설정
      setStats({
        total: 0,
        categories: 0,
        sources: 0,
        freeShipping: 0,
        popular: 0
      })
    }
  }
  
  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [])
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">데이터 관리</h1>
        <p className="text-muted-foreground">핫딜 데이터를 관리하고 JSON 파일을 가져옵니다</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>현재 데이터 상태</CardTitle>
            <CardDescription>로컬 스토리지에 저장된 데이터</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">총 핫딜 수</dt>
                  <dd className="font-semibold">{stats.total}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">카테고리</dt>
                  <dd className="font-semibold">{stats.categories}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">출처</dt>
                  <dd className="font-semibold">{stats.sources}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">무료배송</dt>
                  <dd className="font-semibold">{stats.freeShipping}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">인기 게시글</dt>
                  <dd className="font-semibold">{stats.popular}개</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">로딩 중...</p>
            )}
            
            <Button
              onClick={loadStats}
              variant="outline"
              className="w-full mt-4"
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              새로고침
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>데이터 초기화</CardTitle>
            <CardDescription>모든 핫딜 데이터를 삭제합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                이 작업은 되돌릴 수 없습니다. 모든 핫딜 데이터가 영구적으로 삭제됩니다.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleClearHotdeals}
              variant="destructive"
              className="w-full mt-4"
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              모든 핫딜 삭제
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>JSON 파일 가져오기</CardTitle>
          <CardDescription>크롤러가 생성한 JSON 파일에서 데이터를 가져옵니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              기존 데이터는 모두 삭제되고 새로운 데이터로 교체됩니다.
              exports 폴더의 JSON 파일을 선택하세요.
            </AlertDescription>
          </Alert>
          
          <label htmlFor="import-file" className="cursor-pointer">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors mt-4">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                클릭하여 JSON 파일 선택
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                예: hotdeal-ppomppu-2025-07-12.json
              </p>
            </div>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
              disabled={isLoading}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  )
}