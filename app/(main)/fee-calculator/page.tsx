'use client'

import { useState } from 'react'
import { Calculator, Info, DollarSign, TrendingUp } from 'lucide-react'
import { FeeCalculator } from '@/components/features/order/fee-calculator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/context'

export default function FeeCalculatorPage() {
  const { t } = useLanguage()
  const [amount, setAmount] = useState(0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 페이지 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8" />
          대리구매 수수료 계산기
        </h1>
        <p className="text-gray-600">
          한국 온라인 쇼핑몰 상품의 대리구매 비용을 미리 계산해보세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 계산기 */}
        <div>
          <FeeCalculator 
            amount={amount}
            onAmountChange={setAmount}
            showDetailBreakdown={true}
            variant="default"
          />
        </div>

        {/* 정보 카드 */}
        <div className="space-y-4">
          {/* 서비스 소개 */}
          <Card>
            <CardHeader>
              <CardTitle>HiKo 대리구매 서비스</CardTitle>
              <CardDescription>
                복잡한 한국 쇼핑몰에서 직접 구매하기 어려우신가요?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">상품 링크 전달</h4>
                  <p className="text-sm text-gray-600">원하시는 상품의 URL을 알려주세요</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">견적 확인</h4>
                  <p className="text-sm text-gray-600">정확한 가격과 배송비를 안내해드립니다</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">대신 구매</h4>
                  <p className="text-sm text-gray-600">한국 주소로 받아 해외로 재배송해드립니다</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 수수료 정책 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                수수료 정책
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">서비스 수수료</span>
                  <span className="font-medium">상품 금액의 8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">최소 수수료</span>
                  <span className="font-medium">₩1,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">국내 배송비</span>
                  <span className="font-medium">₩3,000</span>
                </div>
              </div>
              
              <Alert className="mt-4">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">
                  <strong>절약 혜택:</strong> 직접 구매 대비 평균 2-5% 저렴
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 자주 묻는 질문 */}
          <Card>
            <CardHeader>
              <CardTitle>자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-1">관세는 포함되어 있나요?</h4>
                <p className="text-sm text-gray-600">
                  관세는 배송 국가와 상품에 따라 달라지므로 별도로 부과될 수 있습니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">국제 배송비는 얼마인가요?</h4>
                <p className="text-sm text-gray-600">
                  무게와 배송지에 따라 달라지며, 견적 시 정확히 안내해드립니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">배송 기간은 얼마나 걸리나요?</h4>
                <p className="text-sm text-gray-600">
                  국내 배송 2-3일 + 국제 배송 5-10일 정도 소요됩니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}