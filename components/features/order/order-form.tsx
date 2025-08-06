'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Minus, Package, Truck, CreditCard, Link, Info } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
import { OrderFormData, ShippingMethod, PaymentMethod, calculateServiceFee } from '@/types/order'
import { toast } from 'sonner'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/lib/notifications/notification-service'
import { UrlParser, ParsedProduct } from './url-parser'
import { FeeCalculator } from './fee-calculator'

const orderFormSchema = z.object({
  items: z.array(z.object({
    productName: z.string().min(1, '상품명을 입력해주세요'),
    productUrl: z.string().url('올바른 URL을 입력해주세요').min(1, '상품 URL은 필수 항목입니다'),
    price: z.number().min(0, '가격은 0 이상이어야 합니다'),
    quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
    options: z.record(z.string()).optional(),
    notes: z.string().optional()
  })).min(1, '최소 1개의 상품을 추가해주세요'),
  shippingAddress: z.object({
    fullName: z.string().min(1, '이름을 입력해주세요'),
    phone: z.string().min(1, '전화번호를 입력해주세요'),
    email: z.string().email('올바른 이메일을 입력해주세요'),
    post_code: z.string().min(1, '우편번호를 입력해주세요'),
    address: z.string().min(1, '주소를 입력해주세요'),
    address_detail: z.string().optional()
  }),
  paymentMethod: z.enum(['card', 'bank_transfer']),
  customerNotes: z.string().optional()
})

interface OrderFormProps {
  initialData?: Partial<OrderFormData>
  hotdealId?: string
  onSuccess?: (orderId: string) => void
}

export function OrderForm({ initialData, hotdealId, onSuccess }: OrderFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user: currentUser } = useSupabaseUser()
  const { createRequest, isCreating } = useSupabaseBuyForMe()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUrlParser, setShowUrlParser] = useState(false)

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      items: initialData?.items || [{
        productName: '',
        productUrl: '',
        price: 0,
        quantity: 1,
        options: {},
        notes: ''
      }],
      shippingAddress: initialData?.shippingAddress || {
        fullName: '',
        phone: '',
        email: '',
        post_code: '',
        address: '',
        address_detail: ''
      },
      paymentMethod: initialData?.paymentMethod || 'card',
      customerNotes: initialData?.customerNotes || ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  const watchedItems = form.watch('items')

  // 비용 계산
  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  const serviceFee = Math.round(subtotal * 0.08) // 8% 서비스 수수료
  const domesticShippingFee = 3000 // 국내 배송비
  const totalAmount = subtotal + serviceFee + domesticShippingFee

  const onSubmit = async (data: OrderFormData) => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!hotdealId) {
      toast.error('핫딜 정보가 없습니다')
      return
    }

    // OrderFormData를 CreateBuyForMeRequestData로 변환
    // 현재는 첫 번째 아이템만 처리 (향후 여러 아이템 지원 시 개선 필요)
    const firstItem = data.items[0]
    if (!firstItem) {
      toast.error('상품 정보를 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const buyForMeData = {
        userId: currentUser.id,
        hotdealId: hotdealId,
        productInfo: {
          title: firstItem.productName,
          originalPrice: firstItem.price,
          discountedPrice: firstItem.price, // 할인 정보가 없으므로 동일하게 설정
          discountRate: 0,
          shippingFee: domesticShippingFee,
          imageUrl: firstItem.imageUrl,
          originalUrl: firstItem.productUrl,
          siteName: '핫딜 사이트'
        },
        quantity: firstItem.quantity,
        productOptions: firstItem.notes || undefined,
        shippingInfo: {
          name: data.shippingAddress.fullName,
          phone: data.shippingAddress.phone,
          email: data.shippingAddress.email,
          postalCode: data.shippingAddress.post_code,
          address: data.shippingAddress.address,
          detailAddress: data.shippingAddress.address_detail || ''
        },
        specialRequests: data.customerNotes || undefined,
        estimatedServiceFee: serviceFee,
        estimatedTotalAmount: totalAmount
      }

      createRequest(buyForMeData)
      
      // 알림 추가
      notificationService.info(
        '대리 구매 요청 완료',
        `대리 구매 요청이 접수되었습니다. 곧 견적서를 보내드리겠습니다.`,
        `/mypage`
      )
      
      // 마이페이지로 리다이렉트
      router.push('/mypage')
    } catch (error) {
      console.error('Order creation error:', error)
      toast.error('대리 구매 요청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      {/* 상품 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Package className="w-5 h-5" />
          <CardTitle>상품 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">상품 {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`items.${index}.productName`}>
                    상품명 *
                  </Label>
                  <Input
                    {...form.register(`items.${index}.productName`)}
                    placeholder="상품명을 입력해주세요"
                  />
                  {form.formState.errors.items?.[index]?.productName && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.items[index]?.productName?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`items.${index}.productUrl`}>
                    상품 URL (선택사항)
                  </Label>
                  <Input
                    {...form.register(`items.${index}.productUrl`)}
                    placeholder="https://..."
                  />
                  {form.formState.errors.items?.[index]?.productUrl && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.items[index]?.productUrl?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`items.${index}.price`}>
                    예상 가격 (원) *
                  </Label>
                  <Input
                    type="number"
                    {...form.register(`items.${index}.price`, { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.items?.[index]?.price && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.items[index]?.price?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`items.${index}.quantity`}>
                    수량 *
                  </Label>
                  <Input
                    type="number"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="1"
                    min="1"
                  />
                  {form.formState.errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor={`items.${index}.notes`}>
                  상품 옵션 및 요청사항
                </Label>
                <Textarea
                  {...form.register(`items.${index}.notes`)}
                  placeholder="색상, 사이즈 등 옵션이나 특별 요청사항을 입력해주세요"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({
              productName: '',
              productUrl: '',
              price: 0,
              quantity: 1,
              options: {},
              notes: ''
            })}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            상품 추가
          </Button>
        </CardContent>
      </Card>

      {/* 배송 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Truck className="w-5 h-5" />
          <CardTitle>배송 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingAddress.fullName">
                수령인 이름 *
              </Label>
              <Input
                {...form.register('shippingAddress.fullName')}
                placeholder="홍길동"
              />
              {form.formState.errors.shippingAddress?.fullName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.shippingAddress.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingAddress.phone">
                전화번호 *
              </Label>
              <Input
                {...form.register('shippingAddress.phone')}
                placeholder="010-1234-5678"
              />
              {form.formState.errors.shippingAddress?.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.shippingAddress.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingAddress.email">
                이메일 *
              </Label>
              <Input
                type="email"
                {...form.register('shippingAddress.email')}
                placeholder="example@email.com"
              />
              {form.formState.errors.shippingAddress?.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.shippingAddress.email.message}
                </p>
              )}
            </div>


            <div>
              <Label htmlFor="shippingAddress.post_code">
                우편번호 *
              </Label>
              <Input
                {...form.register('shippingAddress.post_code')}
                placeholder="12345"
              />
              {form.formState.errors.shippingAddress?.post_code && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.shippingAddress.post_code.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="shippingAddress.address">
              주소 *
            </Label>
            <Input
              {...form.register('shippingAddress.address')}
              placeholder="서울시 강남구 테헤란로 123"
            />
            {form.formState.errors.shippingAddress?.address && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.shippingAddress.address.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="shippingAddress.address_detail">
              상세 주소
            </Label>
            <Input
              {...form.register('shippingAddress.address_detail')}
              placeholder="101동 202호"
            />
          </div>


          <div>
            <Label htmlFor="customerNotes">
              특별 요청사항
            </Label>
            <Textarea
              {...form.register('customerNotes')}
              placeholder="특별한 요청사항이 있으시면 남겨주세요. (예: 선물 포장, 특정 배송 요청 등)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 비용 정보 */}
      <FeeCalculator 
        amount={subtotal}
        showDetailBreakdown={true}
        variant="default"
      />

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back()}
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || isCreating}
        >
          {isSubmitting || isCreating ? '요청 중...' : '구매 요청하기'}
        </Button>
      </div>
    </form>
  )
}