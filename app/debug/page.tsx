'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { forceInitializeMockData } from '@/lib/db/mock-data'

export default function DebugPage() {
  const [storageData, setStorageData] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkStorage = () => {
    try {
      const data: any = {}
      
      // localStorage 전체 스캔
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          try {
            data[key] = value ? JSON.parse(value) : null
          } catch {
            data[key] = value // JSON이 아닌 경우 원본 문자열
          }
        }
      }
      
      setStorageData(data)
      addLog(`Storage 스캔 완료: ${Object.keys(data).length}개 키 발견`)
      
      // 핫딜 데이터 세부 정보
      if (data.hotdeals) {
        addLog(`핫딜 데이터: ${data.hotdeals.length}개`)
        if (data.hotdeals.length > 0) {
          addLog(`첫 번째 핫딜: ${data.hotdeals[0].title}`)
          addLog(`첫 번째 핫딜 이미지: ${data.hotdeals[0].imageUrl}`)
        }
      } else {
        addLog('핫딜 데이터 없음')
      }
    } catch (error) {
      addLog(`Storage 스캔 오류: ${error}`)
    }
  }

  const forceInit = () => {
    try {
      addLog('강제 초기화 시작...')
      forceInitializeMockData()
      addLog('강제 초기화 완료')
      setTimeout(checkStorage, 100) // 약간의 지연 후 확인
    } catch (error) {
      addLog(`강제 초기화 오류: ${error}`)
    }
  }

  const clearStorage = () => {
    localStorage.clear()
    addLog('모든 Storage 클리어 완료')
    setStorageData({})
  }

  useEffect(() => {
    checkStorage()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">HiKo Debug Dashboard</h1>
      
      {/* 제어 버튼들 */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={checkStorage}>Storage 스캔</Button>
        <Button onClick={forceInit} variant="outline">강제 Mock Data 초기화</Button>
        <Button onClick={clearStorage} variant="destructive">Storage 클리어</Button>
      </div>

      {/* 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>실행 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage 데이터 */}
      <div className="grid gap-4">
        {Object.entries(storageData).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg">
                {key} 
                {Array.isArray(value) && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({value.length}개 항목)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {typeof value === 'object' 
                  ? JSON.stringify(value, null, 2)
                  : String(value)
                }
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 빠른 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>핫딜 개수: {storageData.hotdeals?.length || 0}</p>
          <p>사용자 개수: {storageData.users?.length || 0}</p>
          <p>현재 로그인: {storageData.currentUser?.name || '없음'}</p>
          {storageData.hotdeals?.length > 0 && (
            <p>첫 번째 핫딜 이미지: {storageData.hotdeals[0].imageUrl}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}