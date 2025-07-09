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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  MessageSquare, 
  CreditCard,
  Package,
  Globe
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BuyForMeFormData>({
    resolver: zodResolver(buyForMeSchema),
    defaultValues: {
      quantity: 1,
      shippingInfo: {
        fullName: '',
        phoneNumber: '',
        email: currentUser?.email || '',
        address: '',
        postalCode: '',
        detailAddress: ''
      }
    }
  })


  const onSubmit = async (data: BuyForMeFormData) => {
    if (!currentUser) {
      toast.error(t('auth.loginRequired'))
      router.push('/login')
      return
    }

    if (!hotdeal) {
      toast.error('Product information is missing')
      return
    }

    setIsSubmitting(true)
    try {
      // Create Buy for Me request
      const requestData = {
        userId: currentUser.id,
        hotdealId: hotdeal.id,
        productInfo: {
          title: hotdeal.title,
          price: hotdeal.price,
          originalPrice: hotdeal.originalPrice,
          imageUrl: hotdeal.imageUrl,
          productUrl: hotdeal.productUrl,
          seller: hotdeal.seller,
          category: hotdeal.category
        },
        quantity: data.quantity,
        productOptions: data.productOptions,
        shippingInfo: data.shippingInfo,
        specialRequests: data.specialRequests,
        status: 'pending_review', // 관리자 검토 대기
        requestDate: new Date().toISOString(),
        estimatedServiceFee: calculateServiceFee(hotdeal.price, data.quantity)
      }

      // Mock API call - replace with actual API
      console.log('Buy for Me request:', requestData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(t('order.buyForMe.requestSubmitted'))
      onOpenChange(false)
      form.reset()

      // Redirect to request status page
      router.push('/my-orders')
      
    } catch (error) {
      console.error('Buy for Me request error:', error)
      toast.error(t('order.buyForMe.requestFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateServiceFee = (priceStr: string, quantity: number) => {
    const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0
    const subtotal = price * quantity
    return Math.round(subtotal * 0.08) // 8% service fee
  }

  if (!hotdeal) return null

  const estimatedPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0
  const quantity = form.watch('quantity') || 1
  const subtotal = estimatedPrice * quantity
  const serviceFee = calculateServiceFee(hotdeal.price, quantity)
  const domesticShipping = 3000 // 한국 내 기본 배송비
  const estimatedTotal = subtotal + serviceFee + domesticShipping

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            {t('order.buyForMe.title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('order.buyForMe.description')}
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
              {t('order.buyForMe.orderDetails')}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm">{t('order.form.quantity')} *</Label>
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
                <Label htmlFor="productOptions" className="text-sm">{t('order.buyForMe.options')}</Label>
                <Input
                  {...form.register('productOptions')}
                  placeholder={t('order.buyForMe.optionsPlaceholder')}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('order.form.shippingInfo')}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="shippingInfo.fullName" className="text-sm">{t('order.form.fullName')} *</Label>
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
                <Label htmlFor="shippingInfo.phoneNumber" className="text-sm">{t('order.form.phoneNumber')} *</Label>
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
                <Label htmlFor="shippingInfo.email" className="text-sm">{t('order.form.email')} *</Label>
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
                <Label htmlFor="shippingInfo.postalCode" className="text-sm">{t('order.form.postalCode')} *</Label>
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
              <Label htmlFor="shippingInfo.address" className="text-sm">{t('order.form.addressLine1')} *</Label>
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
              <Label htmlFor="shippingInfo.detailAddress" className="text-sm">{t('order.form.addressLine2')}</Label>
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
              {t('order.buyForMe.specialRequests')}
            </h4>
            <Textarea
              {...form.register('specialRequests')}
              placeholder={t('order.buyForMe.specialRequestsPlaceholder')}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Cost Estimation */}
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('order.buyForMe.costEstimation')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>{t('order.cost.itemPrice')} × {quantity}</span>
                  <span>₩{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('order.cost.serviceFee')} (8%)</span>
                  <span>₩{serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('order.cost.koreanShipping')}</span>
                  <span>₩{domesticShipping.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-sm sm:text-base">
                  <span>{t('order.cost.estimatedTotal')}</span>
                  <span>₩{estimatedTotal.toLocaleString()}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  * {t('order.buyForMe.finalPriceNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 text-sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('order.buyForMe.submitRequest')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}