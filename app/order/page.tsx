'use client'

import { useEffect, useState } from 'react'
import { OrderFormV2 } from '@/components/features/order/order-form-v2'
import { ShoppingBag, Shield, Zap, Calculator, Globe, Package, CheckCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { db } from '@/lib/db/database-service'
import { HotDeal } from '@/types/hotdeal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function OrderPage() {
  const searchParams = useSearchParams()
  const hotdealId = searchParams.get('hotdeal')
  const [hotdealData, setHotdealData] = useState<HotDeal | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* 개선된 헤더 섹션 */}
        <div className="text-center mb-6 sm:mb-8">
          {/* 타이틀 영역 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              대리 구매 서비스
            </h1>
          </div>
          
          {/* 설명 텍스트 */}
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
            한국의 온라인 쇼핑몰에서 원하는 상품을 안전하고 빠르게 대리 구매해드립니다
          </p>
          

          {/* 간소화된 서비스 특징 - 가로 스크롤 가능한 컴팩트 디자인 */}
          <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max sm:grid sm:grid-cols-3 sm:gap-4 sm:min-w-0 max-w-3xl mx-auto">
              {/* 모바일: 가로 스크롤되는 컴팩트한 카드 / PC: 그리드 레이아웃 */}
              <div className="flex-shrink-0 w-[280px] sm:w-auto bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3 sm:block sm:text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-3">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">안전한 결제</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                      검증된 시스템으로 안전한 거래
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[280px] sm:w-auto bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3 sm:block sm:text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-3">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">24시간 내 처리</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                      주문 후 신속하게 구매 진행
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[280px] sm:w-auto bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3 sm:block sm:text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-3">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">대신 주문</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                      복잡한 회원가입/결제 대행
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 모바일 스크롤 인디케이터 */}
          <div className="flex justify-center gap-1 mt-3 sm:hidden">
            <div className="w-8 h-1 bg-blue-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
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
          <OrderFormV2 
            initialData={initialData}
            hotdealId={hotdealId || undefined}
            onSuccess={(orderId) => {
              // 주문 성공 후 처리
              window.location.href = `/order/${orderId}`
            }}
          />
        )}
      </div>

        {/* 개선된 서비스 안내 */}
        <div className="max-w-6xl mx-auto mt-24 px-4 pt-16 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              하이코 대리구매 서비스 안내
            </h2>
            <p className="text-gray-600 dark:text-gray-400">투명하고 신뢰할 수 있는 서비스를 제공합니다</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* 진행 절차 카드 */}
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">대리구매 진행 절차</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { title: '구매 요청서 작성', desc: '상품 URL과 배송 정보를 입력하여 요청서를 제출합니다' },
                  { title: '실제 구매가 확인', desc: '담당자가 쇼핑몰에서 실제 가격과 구매 가능 여부를 확인합니다' },
                  { title: '최종 견적서 발송', desc: '실제 상품가, 배송비, 수수료를 포함한 견적서를 보내드립니다' },
                  { title: '견적 승인 및 결제', desc: '견적서를 확인하고 승인하시면 결제를 진행합니다' },
                  { title: '대신 주문 진행', desc: '각 쇼핑몰에서 고객님 주소로 직접 배송되도록 주문합니다' },
                  { title: '배송 추적 제공', desc: '각 쇼핑몰의 배송 추적 정보를 제공해드립니다' }
                ].map((step, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* 수수료 정책 카드 */}
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">투명한 수수료 정책</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* 수수료 정보 */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">대리구매 수수료</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">구매금액의 8%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">최소 수수료: 3,000원</p>
                </div>
                
                {/* 혜택 리스트 */}
                <div className="space-y-3">
                  {[
                    { title: '배송비', desc: '각 쇼핑몰의 실제 배송비가 적용됩니다' },
                    { title: '추가 비용 없음', desc: '견적서에 명시된 금액 외 추가 비용은 없습니다' },
                    { title: '실시간 환율 적용', desc: '결제 시점의 실시간 환율이 적용됩니다' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 예시 계산 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💡 예시 계산</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    100,000원 상품 구매 시:<br/>
                    <span className="font-medium">상품가 100,000원 + 수수료 8,000원 + 배송비</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* 안내 메시지 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 dark:text-amber-300 text-lg">💡</span>
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">스마트한 쇼핑 팁</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  여러 쇼핑몰의 상품을 한 번에 요청하시면 견적서 확인 및 결제가 편리합니다. 각 쇼핑몰의 배송비는 개별 적용됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}