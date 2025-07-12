'use client'

import { useEffect, useState } from 'react'
import { OrderForm } from '@/components/features/order/order-form'
import { ShoppingBag, Shield, Zap, Calculator } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/db/database-service'
import { HotDeal } from '@/types/hotdeal'
import { Button } from '@/components/ui/button'
import { CurrencyCalculatorModal } from '@/components/features/currency-calculator-modal'

export default function OrderPage() {
  const searchParams = useSearchParams()
  const hotdealId = searchParams.get('hotdeal')
  const [hotdealData, setHotdealData] = useState<HotDeal | null>(null)
  const [loading, setLoading] = useState(true)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  useEffect(() => {
    async function fetchHotdeal() {
      if (hotdealId) {
        try {
          const deal = await db.hotdeals.findById(hotdealId)
          setHotdealData(deal)
        } catch (error) {
          console.error('Failed to fetch hotdeal data:', error)
        }
      }
      setLoading(false)
    }
    fetchHotdeal()
  }, [hotdealId])

  // 핫딜 정보가 있으면 초기 데이터로 설정
  const initialData = hotdealData ? {
    items: [{
      productName: hotdealData.title,
      productUrl: hotdealData.originalUrl,
      price: hotdealData.price,
      quantity: 1,
      options: {},
      notes: ''
    }]
  } : undefined

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">대리 구매</h1>
        <p className="text-gray-600 mb-4">
          한국의 온라인 쇼핑몰에서 원하는 상품을 안전하고 빠르게 대리 구매해드립니다
        </p>
        <Button 
          onClick={() => setCurrencyModalOpen(true)}
          variant="outline" 
          size="default" 
          className="gap-2"
        >
          <Calculator className="w-4 h-4" />
          환율 계산기
        </Button>

        {/* 서비스 특징 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">안전한 결제</h3>
            <p className="text-sm text-gray-600 text-center">
              안전한 결제 시스템으로 보호됩니다
            </p>
          </div>

          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">빠른 처리</h3>
            <p className="text-sm text-gray-600 text-center">
              주문 접수 후 24시간 내에 구매를 진행합니다
            </p>
          </div>

          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">전문 서비스</h3>
            <p className="text-sm text-gray-600 text-center">
              한국 쇼핑 전문가가 직접 상품을 확인하고 구매합니다
            </p>
          </div>
        </div>
      </div>

      {/* 주문 폼 */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">핫딜 정보를 불러오는 중...</p>
          </div>
        ) : (
          <OrderForm 
            initialData={initialData}
            hotdealId={hotdealId || undefined}
            onSuccess={(orderId) => {
              // 주문 성공 후 처리
              window.location.href = `/order/${orderId}`
            }}
          />
        )}
      </div>

      {/* 서비스 안내 */}
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">서비스 이용 안내</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">📋 주문 절차</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>주문서 작성 및 제출</li>
              <li>주문 확인 및 견적 안내</li>
              <li>결제 진행</li>
              <li>상품 구매 및 포장</li>
              <li>한국 내 배송지로 발송</li>
              <li>배송 완료</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">💰 수수료 안내</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• 대행 수수료: 상품금액의 8%</li>
              <li>• 국내 배송비: 3,000원</li>
              <li>• 추가 비용: 실제 구매 시 발생하는 차액</li>
              <li>• 최종 금액은 실제 구매 후 안내</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 환율 계산기 모달 */}
      <CurrencyCalculatorModal 
        open={currencyModalOpen} 
        onOpenChange={setCurrencyModalOpen} 
      />
    </div>
  )
}