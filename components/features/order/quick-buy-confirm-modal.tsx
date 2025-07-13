'use client'

import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ShoppingBag, 
  MapPin, 
  MessageSquare,
  Package,
  Info,
  CheckCircle,
  Plus,
  BookmarkPlus
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBuyForMe } from '@/hooks/use-buy-for-me'
import { useAddress } from '@/hooks/use-address'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { extractProductInfo } from '@/lib/utils/product-extraction'
import { PriceVerificationPanel } from './price-verification-panel'

const quickBuySchema = z.object({
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

type QuickBuyFormData = z.infer<typeof quickBuySchema>

interface HotDeal {
  id: string
  title: string
  price: string
  originalPrice?: string
  imageUrl?: string
  productUrl: string
  originalUrl?: string
  discountRate?: string
  category?: string
  seller?: string
  deadline?: string
}

interface QuickBuyConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hotdeal: HotDeal
  quantity: number
  productOptions?: string
  productInfo?: ReturnType<typeof extractProductInfo>
}

export function QuickBuyConfirmModal({ 
  open, 
  onOpenChange, 
  hotdeal, 
  quantity, 
  productOptions,
  productInfo
}: QuickBuyConfirmModalProps) {
  const { currentUser } = useAuth()
  const { createRequest, isCreating } = useBuyForMe()
  const { addresses, defaultAddress, createAddress } = useAddress()
  const router = useRouter()
  const [selectedAddressId, setSelectedAddressId] = useState<string>('default')
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [verifiedPrice, setVerifiedPrice] = useState<number | null>(null)
  const [priceVerificationData, setPriceVerificationData] = useState<any>(null)

  const form = useForm<QuickBuyFormData>({
    resolver: zodResolver(quickBuySchema),
    defaultValues: {
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

  // Auto-fill default address when modal opens
  useEffect(() => {
    if (open && defaultAddress) {
      setSelectedAddressId(defaultAddress.id)
      form.setValue('shippingInfo.fullName', defaultAddress.recipientName)
      form.setValue('shippingInfo.phoneNumber', defaultAddress.phoneNumber)
      form.setValue('shippingInfo.address', defaultAddress.address)
      form.setValue('shippingInfo.postalCode', defaultAddress.postalCode)
      form.setValue('shippingInfo.detailAddress', defaultAddress.detailAddress)
    } else if (open && !defaultAddress) {
      setSelectedAddressId('new')
    }
  }, [open, defaultAddress, form])

  // Handle address selection
  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId)
    
    if (addressId === 'new') {
      // Clear form for new address
      form.setValue('shippingInfo.fullName', currentUser?.name || '')
      form.setValue('shippingInfo.phoneNumber', currentUser?.phone || '')
      form.setValue('shippingInfo.address', '')
      form.setValue('shippingInfo.postalCode', '')
      form.setValue('shippingInfo.detailAddress', '')
    } else {
      // Fill form with selected address
      const selectedAddress = addresses.find(addr => addr.id === addressId)
      if (selectedAddress) {
        form.setValue('shippingInfo.fullName', selectedAddress.recipientName)
        form.setValue('shippingInfo.phoneNumber', selectedAddress.phoneNumber)
        form.setValue('shippingInfo.address', selectedAddress.address)
        form.setValue('shippingInfo.postalCode', selectedAddress.postalCode)
        form.setValue('shippingInfo.detailAddress', selectedAddress.detailAddress)
      }
    }
  }

  // 가격 업데이트 핸들러
  const handlePriceUpdate = (newPrice: number, verification: any) => {
    setVerifiedPrice(newPrice)
    setPriceVerificationData(verification)
  }

  // 개선된 가격 계산 (실시간 확인된 가격 우선 사용)
  const currentPrice = verifiedPrice || productInfo?.priceInfo.price || parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0
  const subtotal = currentPrice * quantity
  const serviceFee = Math.round(subtotal * 0.08) // 8% 서비스 수수료 (예상)
  const estimatedTotal = subtotal + serviceFee + 3000 // 배송비 포함 예상 금액

  const onSubmit = async (data: QuickBuyFormData) => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    // Save new address if requested
    if (saveNewAddress && selectedAddressId === 'new') {
      try {
        await createAddress({
          name: `빠른 주소 ${addresses.length + 1}`,
          recipientName: data.shippingInfo.fullName,
          phoneNumber: data.shippingInfo.phoneNumber,
          postalCode: data.shippingInfo.postalCode,
          address: data.shippingInfo.address,
          detailAddress: data.shippingInfo.detailAddress || '',
          isDefault: addresses.length === 0 // Set as default if it's the first address
        })
        toast.success('새 주소가 저장되었습니다')
      } catch (error) {
        console.error('Failed to save address:', error)
        // Continue with request even if address saving fails
      }
    }

    // Create Buy for Me request
    const requestData = {
      userId: currentUser.id,
      hotdealId: hotdeal.id,
      productInfo: {
        title: hotdeal.title,
        originalPrice: parseInt(hotdeal.originalPrice?.replace(/[^0-9]/g, '') || '0'),
        discountedPrice: currentPrice, // 실시간 확인된 가격 사용
        discountRate: parseInt(hotdeal.discountRate?.replace(/[^0-9]/g, '') || '0'),
        shippingFee: 3000, // 기본 배송비 (실제는 견적서에서 확정)
        imageUrl: hotdeal.imageUrl,
        originalUrl: hotdeal.productUrl,
        siteName: hotdeal.seller || 'Unknown'
      },
      quantity: quantity,
      productOptions: productOptions,
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
        setSelectedAddressId('default')
        setSaveNewAddress(false)
        toast.success('빠른 대리구매 신청이 완료되었습니다!')
        // Redirect to my page to see the request status
        router.push('/mypage')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            빠른 구매 확인
          </DialogTitle>
          <DialogDescription className="text-sm">
            주문 정보를 확인하고 배송지 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Price Verification Panel */}
          <PriceVerificationPanel
            hotdeal={{
              ...hotdeal,
              price: parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0,
              seller: hotdeal.seller || 'Unknown',
              originalUrl: hotdeal.originalUrl || '',
              source: 'ppomppu' as const,
              sourcePostId: hotdeal.id,
              crawledAt: new Date(),
              status: 'active' as const
            }}
            quantity={quantity}
            onPriceUpdate={handlePriceUpdate}
            className="mb-4"
          />
          
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                주문 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {hotdeal.imageUrl ? (
                    <Image
                      src={hotdeal.imageUrl}
                      alt={hotdeal.title}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium text-sm leading-tight">
                    {productInfo?.cleanTitle || hotdeal.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-blue-600">
                      ₩{currentPrice.toLocaleString()}
                    </span>
                    {verifiedPrice && verifiedPrice !== parseInt(hotdeal.price.replace(/[^0-9]/g, '')) && (
                      <span className="text-sm text-gray-500 line-through">
                        ₩{parseInt(hotdeal.price.replace(/[^0-9]/g, '')).toLocaleString()}
                      </span>
                    )}
                    {productInfo?.priceInfo.originalPrice && !verifiedPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₩{productInfo.priceInfo.originalPrice.toLocaleString()}
                      </span>
                    )}
                    {productInfo?.priceInfo.discountRate && (
                      <span className="text-xs bg-red-100 text-red-600 px-1 rounded">
                        {productInfo.priceInfo.discountRate}% 할인
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-600">
                    📦 {productInfo?.normalizedSeller || hotdeal.seller}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>수량:</span>
                  <span className="font-medium">{quantity}개</span>
                </div>
                {productOptions && (
                  <div className="flex justify-between">
                    <span>옵션:</span>
                    <span className="font-medium">{productOptions}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>상품 금액:</span>
                  <span className="font-medium">₩{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>예상 서비스 수수료:</span>
                  <span>견적서에서 확정</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  배송 정보
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => router.push('/mypage/addresses')}
                >
                  <BookmarkPlus className="w-3 h-3 mr-1" />
                  주소 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address Selection */}
              {addresses.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">배송지 선택</Label>
                  <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="배송지를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Plus className="w-3 h-3" />
                          새 주소 입력
                        </div>
                      </SelectItem>
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{address.name}</span>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">기본</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {address.recipientName} | {address.address}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Save new address checkbox (only show for new address) */}
              {selectedAddressId === 'new' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveAddress"
                    checked={saveNewAddress}
                    onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                  />
                  <Label
                    htmlFor="saveAddress"
                    className="text-sm font-normal cursor-pointer"
                  >
                    이 주소를 저장하기 (다음에 빠르게 선택할 수 있어요)
                  </Label>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="shippingInfo.fullName" className="text-sm">수령인 이름 *</Label>
                  <Input
                    {...form.register('shippingInfo.fullName')}
                    placeholder="홍길동"
                    className="text-sm"
                  />
                  {form.formState.errors.shippingInfo?.fullName && (
                    <p className="text-xs text-red-500 mt-1">
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
                    <p className="text-xs text-red-500 mt-1">
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
                    <p className="text-xs text-red-500 mt-1">
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
                    <p className="text-xs text-red-500 mt-1">
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
                  <p className="text-xs text-red-500 mt-1">
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
            </CardContent>
          </Card>

          {/* Special Requests - 개선된 제안 시스템 */}
          <div className="space-y-3">
            <Label className="text-sm flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              특별 요청사항 (선택사항)
            </Label>
            
            {/* 카테고리별 제안 요청사항 */}
            {productInfo?.suggestedRequests && productInfo.suggestedRequests.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-blue-600 font-medium">💡 추천 요청사항:</p>
                <div className="space-y-1">
                  {productInfo.suggestedRequests.map((request, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const currentValue = form.getValues('specialRequests') || ''
                        const newValue = currentValue ? `${currentValue}\n• ${request}` : `• ${request}`
                        form.setValue('specialRequests', newValue)
                      }}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200 hover:bg-blue-100 text-left w-full"
                    >
                      + {request}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <Textarea
              {...form.register('specialRequests')}
              placeholder={
                (productInfo?.suggestedRequests?.length || 0) > 0
                  ? `예: ${productInfo?.suggestedRequests?.[0] || ''}`
                  : "특별한 요청사항이 있으시면 남겨주세요. (예: 선물 포장, 특정 배송 요청 등)"
              }
              rows={3}
              className="text-sm"
            />
          </div>

          {/* 안내 메시지 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>빠른 구매 안내</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>• 신청 접수 후 관리자가 실제 쇼핑몰에서 가격을 확인합니다</p>
              <p>• 정확한 견적서를 보내드립니다 (보통 1-2시간 내)</p>
              <p>• 견적 승인 후 결제를 진행하시면 바로 구매를 시작합니다</p>
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
              {isCreating ? '신청 중...' : '빠른 구매 신청하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}