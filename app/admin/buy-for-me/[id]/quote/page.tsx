'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { db } from '@/lib/db/database-service'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { useBuyForMeAdmin } from '@/hooks/use-buy-for-me'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Package,
  Calculator,
  CreditCard,
  FileText,
  Info,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const quoteSchema = z.object({
  finalProductPrice: z.number().min(0, '상품 금액은 0 이상이어야 합니다'),
  serviceFee: z.number().min(0, '서비스 수수료는 0 이상이어야 합니다'),
  domesticShippingFee: z.number().min(0, '국내 배송비는 0 이상이어야 합니다'),
  internationalShippingFee: z.number().min(0, '국제 배송비는 0 이상이어야 합니다'),
  paymentMethod: z.enum(['card', 'bank_transfer'], {
    required_error: '결제 방법을 선택해주세요',
  }),
  notes: z.string().optional(),
})

type QuoteFormData = z.infer<typeof quoteSchema>

export default function QuoteCreatePage() {
  const params = useParams()
  const router = useRouter()
    const { updateRequest } = useBuyForMeAdmin()
  const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      finalProductPrice: 0,
      serviceFee: 0,
      domesticShippingFee: 0,
      internationalShippingFee: 0,
      paymentMethod: 'card',
      notes: '',
    },
  })

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id) {
        const data = await db.buyForMeRequests.findById(params.id as string)
        if (data) {
          setRequest(data)
          // 기본값 설정
          form.setValue('finalProductPrice', data.productInfo.discountedPrice * data.quantity)
          form.setValue('domesticShippingFee', data.productInfo.shippingFee)
          // 서비스 수수료 자동 계산 (상품 금액의 10%)
          const productTotal = data.productInfo.discountedPrice * data.quantity
          form.setValue('serviceFee', Math.round(productTotal * 0.1))
        }
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id, form])

  const onSubmit = async (data: QuoteFormData) => {
    if (!request) return

    setIsSubmitting(true)
    try {
      const totalAmount = 
        data.finalProductPrice + 
        data.serviceFee + 
        data.domesticShippingFee + 
        data.internationalShippingFee

      const updatedRequest: BuyForMeRequest = {
        ...request,
        status: 'quote_sent',
        quote: {
          ...data,
          totalAmount,
          quoteSentDate: new Date(),
        },
      }

      await updateRequest(updatedRequest)
      
      toast.success('견적서가 성공적으로 발송되었습니다.')
      
      router.push(`/admin/buy-for-me/${request.id}`)
    } catch (error) {
      toast.error('견적서 발송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!request || request.status !== 'pending_review') {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">
              {!request ? '요청을 찾을 수 없습니다.' : '이미 견적서가 작성된 요청입니다.'}
            </p>
            <Link href="/admin/buy-for-me">
              <Button className="mt-4">목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const watchedValues = form.watch()
  const totalAmount = 
    watchedValues.finalProductPrice + 
    watchedValues.serviceFee + 
    watchedValues.domesticShippingFee + 
    watchedValues.internationalShippingFee

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/buy-for-me/${request.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">견적서 작성</h1>
          </div>
        </div>

        {/* 상품 정보 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              상품 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {request.productInfo.imageUrl && (
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={request.productInfo.imageUrl}
                    alt={request.productInfo.title}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">{request.productInfo.title}</h3>
                <div className="text-sm text-gray-600">
                  <p>원가: ₩{request.productInfo.originalPrice.toLocaleString()}</p>
                  <p>할인가: ₩{request.productInfo.discountedPrice.toLocaleString()}</p>
                  <p>수량: {request.quantity}개</p>
                  {request.productOptions && (
                    <p>옵션: {request.productOptions}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 견적서 작성 폼 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  견적 내역
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="finalProductPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>최종 상품 금액</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        실제 구매 사이트에서 확인한 최종 상품 금액을 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>서비스 수수료</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        HiKo 서비스 이용 수수료 (통상 상품 금액의 10%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domesticShippingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>국내 배송비</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        판매자 → HiKo 물류센터 배송비
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internationalShippingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>국제 배송비</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        HiKo 물류센터 → 고객 주소 국제 배송비
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>총 견적 금액</span>
                  <span className="text-blue-600">₩{totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>결제 방법</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="card"
                              name="paymentMethod"
                              value="card"
                              checked={field.value === 'card'}
                              onChange={() => field.onChange('card')}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <Label htmlFor="card" className="font-normal cursor-pointer">
                              신용카드 (온라인 결제 링크 발송)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="bank_transfer"
                              name="paymentMethod"
                              value="bank_transfer"
                              checked={field.value === 'bank_transfer'}
                              onChange={() => field.onChange('bank_transfer')}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <Label htmlFor="bank_transfer" className="font-normal cursor-pointer">
                              무통장 입금 (계좌번호 안내)
                            </Label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>추가 안내사항 (선택)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="고객에게 전달할 추가 안내사항을 입력하세요"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        재고 상황, 배송 예상 기간 등 고객에게 안내할 내용
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 안내 메시지 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">견적서 발송 안내</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>견적서는 고객의 이메일로 자동 발송됩니다</li>
                      <li>고객이 견적을 승인하면 알림을 받게 됩니다</li>
                      <li>결제 확인 후 실제 구매를 진행해주세요</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex gap-3 justify-end">
              <Link href={`/admin/buy-for-me/${request.id}`}>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <FileText className="w-4 h-4 mr-2" />
                {isSubmitting ? '발송 중...' : '견적서 발송'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ProtectedRoute>
  )
}