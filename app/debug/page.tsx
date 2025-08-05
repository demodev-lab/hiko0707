'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">HiKo Debug Dashboard</h1>
      
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            LocalStorage 디버깅 도구가 비활성화되었습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-700">
            HiKo는 이제 Supabase를 사용하여 모든 데이터를 관리합니다.
            LocalStorage는 더 이상 사용되지 않으며, 모든 디버깅은 Supabase 대시보드에서 수행해야 합니다.
          </p>
          
          <div className="pt-4 space-y-3">
            <h3 className="font-semibold text-amber-800">디버깅 방법:</h3>
            <ul className="list-disc list-inside space-y-2 text-amber-700">
              <li>Supabase 대시보드에서 실시간 데이터 확인</li>
              <li>SQL 쿼리를 사용하여 데이터 조회 및 수정</li>
              <li>Supabase Logs에서 오류 및 활동 모니터링</li>
              <li>Table Editor에서 직접 데이터 수정</li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <h3 className="font-semibold text-amber-800">Supabase 접속 정보:</h3>
            <div className="bg-white p-4 rounded border border-amber-200">
              <p className="font-mono text-sm mb-2">
                URL: https://vyvzihzjivcfhietrpnd.supabase.co
              </p>
              <Button asChild variant="outline" className="mt-2">
                <a 
                  href="https://supabase.com/dashboard/project/vyvzihzjivcfhietrpnd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Supabase 대시보드 열기
                </a>
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 text-lg">마이그레이션 완료 상태</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 mb-3">
                  ✅ LocalStorage에서 Supabase로의 마이그레이션이 100% 완료되었습니다.
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 text-sm">
                  <li>모든 핫딜 데이터: hotdeals 테이블</li>
                  <li>사용자 프로필: profiles 테이블</li>
                  <li>주문 정보: buy_for_me_requests 테이블</li>
                  <li>결제 정보: payments 테이블</li>
                  <li>즐겨찾기: favorites 테이블</li>
                  <li>댓글: comments 테이블</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">대시보드로 돌아가기</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">관리자 페이지</Link>
        </Button>
      </div>
    </div>
  )
}