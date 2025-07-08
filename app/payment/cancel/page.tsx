'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const reason = searchParams.get('reason')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="space-y-6">
          {/* 취소 상태 표시 */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <XCircle className="w-16 h-16 text-gray-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-700">결제가 취소되었습니다</h2>
                  <p className="text-gray-600 mt-2">
                    결제가 사용자에 의해 취소되었습니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 취소 정보 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문 ID</span>
                    <span className="font-mono text-sm">{orderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">취소 시간</span>
                  <span className="text-sm">{new Date().toLocaleString('ko-KR')}</span>
                </div>
                {reason && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">취소 사유</span>
                    <span className="text-sm">{reason}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 안내 메시지 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center text-blue-800">
                <h3 className="font-semibold mb-2">결제 취소 안내</h3>
                <div className="text-sm space-y-1">
                  <p>• 결제가 진행되지 않았으므로 추가 요금이 발생하지 않습니다</p>
                  <p>• 기존에 입력하신 결제 정보는 저장되지 않습니다</p>
                  <p>• 언제든지 다시 결제를 진행하실 수 있습니다</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {orderId && (
              <Button asChild className="flex-1">
                <Link href={`/payment?orderId=${orderId}&amount=${searchParams.get('amount') || ''}`}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  다시 결제하기
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Link>
            </Button>
          </div>

          {/* 고객센터 안내 */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="text-center text-sm text-gray-600">
                <p>결제 관련 문의사항이 있으시면</p>
                <p className="font-medium">고객센터 1588-1234로 연락해주세요</p>
                <p className="text-xs mt-1">평일 09:00 - 18:00 (주말 및 공휴일 제외)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}