'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ShoppingBag, Plus, Minus, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { QuickBuyConfirmModal } from './quick-buy-confirm-modal'
import { toast } from 'sonner'
import { extractProductInfo } from '@/lib/utils/product-extraction'

interface HotDeal {
  id: string
  title: string
  price: string
  originalPrice?: string
  imageUrl?: string
  productUrl: string
  discountRate?: string
  category?: string
  seller?: string
  deadline?: string
}

interface QuickBuyButtonProps {
  hotdeal: HotDeal
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function QuickBuyButton({ 
  hotdeal, 
  variant = 'default', 
  size = 'default',
  className = ''
}: QuickBuyButtonProps) {
  // 상품 정보 자동 추출
  const productInfo = extractProductInfo({
    ...hotdeal,
    price: parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0
  } as any)
  
  const [quantity, setQuantity] = useState(productInfo.recommendedQuantity)
  const [productOptions, setProductOptions] = useState(
    productInfo.extractedOptions.length > 0 ? productInfo.extractedOptions[0] : ''
  )
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const { currentUser, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.info('대리구매 서비스 이용을 위해 로그인이 필요합니다.')
      router.push('/login')
      return
    }
    
    setPopoverOpen(true)
  }

  const handleQuickOrder = () => {
    setPopoverOpen(false)
    setConfirmModalOpen(true)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1)
    }
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            onClick={handleClick}
            variant={variant}
            size={size}
            className={`${className} relative overflow-hidden`}
          >
            <Zap className="w-4 h-4 mr-2" />
            빠른 구매
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="center">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-sm">빠른 대리구매 신청</h3>
              <p className="text-xs text-muted-foreground mt-1">
                상품 정보를 확인하고 바로 신청하세요
              </p>
            </div>
            
            {/* 상품 정보 요약 - 개선된 정보 표시 */}
            <Card>
              <CardContent className="p-3">
                <div className="flex gap-2">
                  {hotdeal.imageUrl && (
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={hotdeal.imageUrl}
                        alt={productInfo.cleanTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 leading-tight">
                      {productInfo.cleanTitle}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-sm font-bold text-red-600">
                        ₩{productInfo.priceInfo.price.toLocaleString()}
                      </p>
                      {productInfo.priceInfo.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          ₩{productInfo.priceInfo.originalPrice.toLocaleString()}
                        </p>
                      )}
                      {productInfo.priceInfo.discountRate && (
                        <span className="text-xs bg-red-100 text-red-600 px-1 rounded">
                          {productInfo.priceInfo.discountRate}% 할인
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      📦 {productInfo.normalizedSeller}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 수량 선택 */}
            <div className="space-y-2">
              <Label className="text-sm">수량</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    if (value >= 1 && value <= 99) {
                      setQuantity(value)
                    }
                  }}
                  className="w-16 text-center text-sm"
                  min="1"
                  max="99"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={increaseQuantity}
                  disabled={quantity >= 99}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* 상품 옵션 - 개선된 제안 시스템 */}
            <div className="space-y-2">
              <Label className="text-sm">상품 옵션 (선택사항)</Label>
              
              {/* 자동 감지된 옵션 표시 */}
              {productInfo.extractedOptions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-green-600 font-medium">✅ 자동 감지된 옵션:</p>
                  <div className="flex flex-wrap gap-1">
                    {productInfo.extractedOptions.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setProductOptions(option)}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 카테고리별 제안 옵션 */}
              {productInfo.suggestedOptions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-blue-600 font-medium">💡 추천 옵션:</p>
                  <div className="flex flex-wrap gap-1">
                    {productInfo.suggestedOptions.slice(0, 3).map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setProductOptions(option)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <Input
                placeholder={
                  productInfo.suggestedOptions.length > 0 
                    ? `예: ${productInfo.suggestedOptions[0]}` 
                    : "색상, 사이즈 등"
                }
                value={productOptions}
                onChange={(e) => setProductOptions(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* 예상 금액 - 개선된 가격 표시 */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>상품 금액 (x{quantity})</span>
                <span className="font-semibold">
                  ₩{(productInfo.priceInfo.price * quantity).toLocaleString()}
                </span>
              </div>
              {productInfo.priceInfo.originalPrice && (
                <div className="flex justify-between items-center text-xs text-green-600 mt-1">
                  <span>할인 혜택</span>
                  <span>
                    -₩{((productInfo.priceInfo.originalPrice - productInfo.priceInfo.price) * quantity).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm mt-1">
                <span>서비스 수수료 (예상 8%)</span>
                <span className="text-muted-foreground">견적서에서 확정</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold border-t border-blue-200 mt-2 pt-2">
                <span>예상 총액</span>
                <span className="text-blue-700">
                  ₩{Math.round((productInfo.priceInfo.price * quantity * 1.08) + 3000).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">(배송비 포함)</span>
                </span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPopoverOpen(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleQuickOrder}
              >
                <ShoppingBag className="w-3 h-3 mr-1" />
                주문하기
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <QuickBuyConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        hotdeal={hotdeal}
        quantity={quantity}
        productOptions={productOptions}
        productInfo={productInfo}
      />
    </>
  )
}