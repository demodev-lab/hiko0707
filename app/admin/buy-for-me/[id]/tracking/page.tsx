'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { useSupabaseBuyForMeAdmin, useSupabaseBuyForMe } from '@/hooks/use-supabase-buy-for-me'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  Info,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const trackingSchema = z.object({
  actualOrderId: z.string().min(1, '실제 주문번호를 입력해주세요'),
  orderDate: z.string().min(1, '주문일을 선택해주세요'),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

type TrackingFormData = z.infer<typeof trackingSchema>

export default function TrackingInputPage() {
  const params = useParams()
  const router = useRouter()
  const { updateStatus } = useSupabaseBuyForMeAdmin()
  const { getRequest } = useSupabaseBuyForMe()
  const [request, setRequest] = useState<BuyForMeRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      actualOrderId: '',
      orderDate: new Date().toISOString().split('T')[0],
      trackingNumber: '',
      trackingUrl: '',
      notes: '',
    },
  })

  useEffect(() => {
    const loadRequest = async () => {
      if (params.id) {
        const data = await getRequest(params.id as string)
        if (data && data.orderInfo) {
          setRequest(data)
          // 기존 주문 정보가 있으면 채우기
          form.setValue('actualOrderId', data.orderInfo.actualOrderId || '')
          form.setValue('orderDate', data.orderInfo.orderDate ? 
            new Date(data.orderInfo.orderDate).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
          )
          form.setValue('trackingNumber', data.orderInfo.trackingNumber || '')
          form.setValue('trackingUrl', data.orderInfo.trackingUrl || '')
        } else if (data) {
          setRequest(data)
        }
        setIsLoading(false)
      }
    }
    loadRequest()
  }, [params.id, form, getRequest])

  const onSubmit = async (data: TrackingFormData) => {
    if (!request) return

    setIsSubmitting(true)
    try {
      // TODO: Supabase에서 주문 정보(orderInfo) 업데이트 기능 구현 필요
      // 현재는 상태 업데이트만 처리
      const newStatus = data.trackingNumber ? 'shipping' : 'purchasing'
      
      await updateStatus({
        requestId: request.id,
        status: newStatus
      })
      
      toast.success(data.trackingNumber ? 
        '배송 상태가 업데이트되었습니다.' :
        '구매 진행 상태로 변경되었습니다.'
      )
      
      router.push(`/admin/buy-for-me/${request.id}`)
    } catch (error) {
      toast.error('상태 업데이트 중 오류가 발생했습니다.')
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

  if (!request) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">요청을 찾을 수 없습니다.</p>
            <Link href="/admin/buy-for-me">
              <Button className="mt-4">목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/buy-for-me/${request.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">주문 및 배송 정보 입력</h1>
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
            <div className="space-y-2">
              <h3 className="font-semibold">{request.productInfo.title}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>고객명: {request.shippingInfo.name}</p>
                <p>주문 수량: {request.quantity}개</p>
                <p>결제 금액: ₩{request.quote?.totalAmount.toLocaleString() || request.estimatedTotalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주문 정보 입력 폼 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  주문 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="actualOrderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>실제 주문번호 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="쇼핑몰에서 발급받은 주문번호"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        실제 쇼핑몰에서 발급받은 주문번호를 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주문일 *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        실제 주문을 진행한 날짜
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배송 추적 번호</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="택배사 배송 추적 번호"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        배송이 시작되면 트래킹 번호를 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배송 추적 URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/tracking/12345"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        고객이 직접 배송 상태를 확인할 수 있는 URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>메모 (선택)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="주문 및 배송과 관련된 메모"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        내부 참고용 메모
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
                    <p className="font-semibold mb-1">주문 진행 안내</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>결제 확인 후 실제 쇼핑몰에서 주문을 진행하세요</li>
                      <li>주문번호는 고객 문의 시 필요하므로 정확히 기록해주세요</li>
                      <li>배송이 시작되면 트래킹 정보를 즉시 업데이트하세요</li>
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
                <Truck className="w-4 h-4 mr-2" />
                {isSubmitting ? '저장 중...' : '주문 정보 저장'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ProtectedRoute>
  )
}