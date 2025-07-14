'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  MessageSquare, 
  CreditCard,
  Package,
  Info,
  Calculator
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBuyForMe } from '@/hooks/use-buy-for-me'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CurrencyCalculatorModal } from '@/components/features/currency-calculator-modal'

const buyForMeSchema = z.object({
  productOptions: z.string().optional(),
  quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
  shippingInfo: z.object({
    fullName: z.string().min(1, '이름을 입력해주세요'),
    phoneNumber: z.string().min(1, '전화번호를 입력해주세요'),
    email: z.string().email('올바른 이메일을 입력해주세요'),
    address: z.string().min(1, '배송 주소를 입력해주세요'),
    postalCode: z.string().min(1, '우편번호를 입력해주세요'),
    detailAddress: z.string().optional(),
  }),
  specialRequests: z.string().optional()
})

type BuyForMeFormData = z.infer<typeof buyForMeSchema>

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

interface BuyForMeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hotdeal: HotDeal | null
}

export function BuyForMeModal({ open, onOpenChange, hotdeal }: BuyForMeModalProps) {
  const { currentUser } = useAuth()
  const { createRequest, isCreating } = useBuyForMe()
  const router = useRouter()
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  const form = useForm<BuyForMeFormData>({
    resolver: zodResolver(buyForMeSchema),
    defaultValues: {
      quantity: 1,
      shippingInfo: {
        fullName: currentUser?.name || '',
        phoneNumber: currentUser?.phone || '',
        email: currentUser?.email || '',
        address: '',
        postalCode: '',
        detailAddress: ''
      }
    }
  })

  const onSubmit = async (data: BuyForMeFormData) => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!hotdeal) {
      toast.error('상품 정보를 찾을 수 없습니다')
      return
    }

    const estimatedPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0
    const subtotal = estimatedPrice * data.quantity
    const serviceFee = Math.round(subtotal * 0.1) // 10% 서비스 수수료 (예상)
    const estimatedTotal = subtotal + serviceFee + 3000 // 배송비 포함 예상 금액

    // Create Buy for Me request
    const requestData = {
      userId: currentUser.id,
      hotdealId: hotdeal.id,
      productInfo: {
        title: hotdeal.title,
        originalPrice: parseInt(hotdeal.originalPrice?.replace(/[^0-9]/g, '') || '0'),
        discountedPrice: estimatedPrice,
        discountRate: parseInt(hotdeal.discountRate?.replace(/[^0-9]/g, '') || '0'),
        shippingFee: 3000, // 기본 배송비 (실제는 견적서에서 확정)
        imageUrl: hotdeal.imageUrl,
        originalUrl: hotdeal.productUrl,
        siteName: hotdeal.seller || 'Unknown'
      },
      quantity: data.quantity,
      productOptions: data.productOptions,
      shippingInfo: {
        name: data.shippingInfo.fullName,
        phone: data.shippingInfo.phoneNumber,
        email: data.shippingInfo.email,
        postalCode: data.shippingInfo.postalCode,
        address: data.shippingInfo.address,
        detailAddress: data.shippingInfo.detailAddress || ''
      },
      specialRequests: data.specialRequests,
      estimatedServiceFee: serviceFee,
      estimatedTotalAmount: estimatedTotal
    }

    createRequest(requestData, {
      onSuccess: () => {
        onOpenChange(false)
        form.reset()
        // Redirect to my page to see the request status
        router.push('/mypage')
      }
    })
  }

  if (!hotdeal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            대리 구매 신청
          </DialogTitle>
          <DialogDescription className="text-sm">
            상품 정보와 배송지를 입력하면, HiKo가 대리 구매를 진행합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {hotdeal.imageUrl ? (
                    <Image
                      src={hotdeal.imageUrl}
                      alt={hotdeal.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2">{hotdeal.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-blue-600">
                      {hotdeal.price}
                    </span>
                    {hotdeal.originalPrice && (
                      <>
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {hotdeal.originalPrice}
                        </span>
                        {hotdeal.discountRate && (
                          <Badge variant="destructive" className="text-xs">
                            {hotdeal.discountRate}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => setCurrencyModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 mt-2"
                  >
                    <Calculator className="w-3 h-3" />
                    환율 계산기
                  </Button>
                  {hotdeal.seller && (
                    <p className="text-xs text-gray-500">{hotdeal.seller}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              주문 정보
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm">수량 *</Label>
                <Input
                  type="number"
                  min="1"
                  {...form.register('quantity', { valueAsNumber: true })}
                  placeholder="1"
                  className="text-sm"
                />
                {form.formState.errors.quantity && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="productOptions" className="text-sm">상품 옵션</Label>
                <Input
                  {...form.register('productOptions')}
                  placeholder="색상, 사이즈 등"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              배송 정보
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="shippingInfo.fullName" className="text-sm">수령인 이름 *</Label>
                <Input
                  {...form.register('shippingInfo.fullName')}
                  placeholder="홍길동"
                  className="text-sm"
                />
                {form.formState.errors.shippingInfo?.fullName && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.shippingInfo.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingInfo.phoneNumber" className="text-sm">전화번호 *</Label>
                <Input
                  {...form.register('shippingInfo.phoneNumber')}
                  placeholder="010-1234-5678"
                  className="text-sm"
                />
                {form.formState.errors.shippingInfo?.phoneNumber && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.shippingInfo.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingInfo.email" className="text-sm">이메일 *</Label>
                <Input
                  type="email"
                  {...form.register('shippingInfo.email')}
                  placeholder="example@email.com"
                  className="text-sm"
                />
                {form.formState.errors.shippingInfo?.email && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.shippingInfo.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingInfo.postalCode" className="text-sm">우편번호 *</Label>
                <Input
                  {...form.register('shippingInfo.postalCode')}
                  placeholder="12345"
                  className="text-sm"
                />
                {form.formState.errors.shippingInfo?.postalCode && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.shippingInfo.postalCode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="shippingInfo.address" className="text-sm">주소 *</Label>
              <Input
                {...form.register('shippingInfo.address')}
                placeholder="서울시 강남구 테헤란로 123"
                className="text-sm"
              />
              {form.formState.errors.shippingInfo?.address && (
                <p className="text-xs sm:text-sm text-red-500 mt-1">
                  {form.formState.errors.shippingInfo.address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingInfo.detailAddress" className="text-sm">상세 주소</Label>
              <Input
                {...form.register('shippingInfo.detailAddress')}
                placeholder="101동 202호"
                className="text-sm"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              특별 요청사항
            </h4>
            <Textarea
              {...form.register('specialRequests')}
              placeholder="특별한 요청사항이 있으시면 남겨주세요. (예: 선물 포장, 특정 배송 요청 등)"
              rows={3}
              className="text-sm"
            />
          </div>

          {/* 안내 메시지 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>대리 구매 안내</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>• 신청 접수 후 관리자가 실제 쇼핑몰에서 가격을 확인합니다</p>
              <p>• 옵션, 수량에 따른 정확한 견적서를 보내드립니다</p>
              <p>• 견적 승인 후 결제를 진행하시면 됩니다</p>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 text-sm"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 text-sm"
              disabled={isCreating}
            >
              {isCreating ? '요청 중...' : '구매 요청하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* 환율 계산기 모달 */}
      <CurrencyCalculatorModal 
        open={currencyModalOpen} 
        onOpenChange={setCurrencyModalOpen} 
      />
    </Dialog>
  )
}