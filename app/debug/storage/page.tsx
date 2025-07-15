'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { initializeMockData } from '@/lib/db/mock-data'
import { HotDeal } from '@/types/hotdeal'

export default function StorageDebugPage() {
  const [storageData, setStorageData] = useState<any>({})
  const [hotdeals, setHotdeals] = useState<HotDeal[]>([])
  const [isInitializing, setIsInitializing] = useState(false)

  const checkStorage = () => {
    const data: any = {}
    
    // 모든 localStorage 키 확인
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          data[key] = value ? JSON.parse(value) : null
        } catch (error) {
          data[key] = `Error parsing: ${error}`
        }
      }
    }
    
    setStorageData(data)
    
    // 핫딜 데이터 특별히 확인
    try {
      const hotdealsData = localStorage.getItem('hiko_hotdeals')
      if (hotdealsData) {
        const parsed = JSON.parse(hotdealsData)
        setHotdeals(Array.isArray(parsed) ? parsed : [])
      } else {
        setHotdeals([])
      }
    } catch (error) {
      console.error('핫딜 데이터 파싱 오류:', error)
      setHotdeals([])
    }
  }

  const initializeData = async () => {
    setIsInitializing(true)
    try {
      await initializeMockData()
      checkStorage()
    } catch (error) {
      console.error('데이터 초기화 오류:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const clearStorage = () => {
    localStorage.clear()
    checkStorage()
  }

  useEffect(() => {
    checkStorage()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Storage 디버깅</h1>
        <div className="flex gap-2">
          <Button onClick={checkStorage} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button onClick={initializeData} disabled={isInitializing}>
            <Database className="mr-2 h-4 w-4" />
            {isInitializing ? '초기화 중...' : '데이터 초기화'}
          </Button>
          <Button onClick={clearStorage} variant="destructive">
            전체 삭제
          </Button>
        </div>
      </div>

      {/* 핫딜 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            핫딜 데이터 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {hotdeals.length > 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">데이터 있음</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-orange-700">데이터 없음</span>
                </>
              )}
              <Badge variant="outline">{hotdeals.length}개 핫딜</Badge>
            </div>
            
            {hotdeals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">최근 핫딜 3개:</h4>
                {hotdeals.slice(0, 3).map((deal, index) => (
                  <div key={deal.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-gray-500">
                          {deal.source} | {deal.price || 'N/A'}
                        </p>
                      </div>
                      <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
                        {deal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 전체 Storage 상태 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 LocalStorage 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(storageData).length === 0 ? (
              <p className="text-gray-500">localStorage가 비어있습니다.</p>
            ) : (
              Object.entries(storageData).map(([key, value]) => (
                <div key={key} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{key}</h4>
                    <Badge variant="outline">
                      {Array.isArray(value) ? `배열 (${value.length}개)` : typeof value}
                    </Badge>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                    {typeof value === 'string' 
                      ? value.length > 200 ? value.substring(0, 200) + '...' : value
                      : JSON.stringify(value, null, 2).substring(0, 500)
                    }
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}