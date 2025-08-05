'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Smartphone, Building2, Globe } from 'lucide-react'
import { PaymentFormData, PaymentProvider } from '@/types/payment'
import { useLanguage } from '@/lib/i18n/context'
import { usePaymentMethods } from '@/hooks/use-payments'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/contexts/notification-context'
import { SupabasePaymentService } from '@/lib/services/supabase-payment-service'

const paymentFormSchema = z.object({
  paymentMethod: z.enum(['card', 'bank_transfer', 'paypal', 'alipay', 'wechat_pay', 'kakao_pay', 'naver_pay', 'toss_pay']),
  cardInfo: z.object({
    number: z.string().min(16, '카드번호를 정확히 입력해주세요'),
    expiryMonth: z.string().min(2, '월을 선택해주세요'),
    expiryYear: z.string().min(4, '년도를 선택해주세요'),
    cvc: z.string().min(3, 'CVC를 입력해주세요'),
    holderName: z.string().min(1, '카드 소유자명을 입력해주세요')
  }).optional(),
  bankInfo: z.object({
    bankCode: z.string().min(1, '은행을 선택해주세요'),
    accountNumber: z.string().min(10, '계좌번호를 정확히 입력해주세요'),
    holderName: z.string().min(1, '예금주명을 입력해주세요')
  }).optional(),
  agreements: z.object({
    terms: z.boolean().refine(val => val === true, '이용약관에 동의해주세요'),
    privacy: z.boolean().refine(val => val === true, '개인정보 처리방침에 동의해주세요'),
    payment: z.boolean().refine(val => val === true, '결제 대행 서비스 약관에 동의해주세요')
  })
})

interface PaymentFormProps {
  orderId: string
  amount: number
  currency?: string
  onSuccess?: (paymentId: string) => void
  onCancel?: () => void
  customerInfo?: {
    name: string
    email: string
    phone?: string
  }
}

export function PaymentForm({ 
  orderId, 
  amount, 
  currency = 'KRW', 
  onSuccess, 
  onCancel,
  customerInfo 
}: PaymentFormProps) {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const { data: paymentMethods = [], isLoading: methodsLoading } = usePaymentMethods()
  // Removed deprecated useCreatePayment hook - now using SupabasePaymentService directly
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: 'card',
      cardInfo: {
        number: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        holderName: customerInfo?.name || ''
      },
      bankInfo: {
        bankCode: '',
        accountNumber: '',
        holderName: customerInfo?.name || ''
      },
      agreements: {
        terms: false,
        privacy: false,
        payment: false
      }
    }
  })

  const selectedPaymentMethod = form.watch('paymentMethod')

  const onSubmit = async (data: PaymentFormData) => {
    if (!customerInfo) {
      toast.error('고객 정보가 필요합니다')
      return
    }

    setIsSubmitting(true)
    try {
      const userId = currentUser?.id || 'guest-user'
      
      const selectedMethod = paymentMethods.find(method => method.provider === data.paymentMethod)
      if (!selectedMethod) {
        throw new Error('선택한 결제 방법을 찾을 수 없습니다')
      }

      // Use Supabase payment service directly
      const result = await SupabasePaymentService.createPayment({
        request_id: orderId,
        user_id: userId,
        amount,
        currency: currency || 'KRW',
        payment_method: data.paymentMethod,
        status: 'pending',
        payment_gateway: selectedMethod.provider
      })

      if (!result) {
        throw new Error('결제 생성에 실패했습니다.')
      }

      toast.success('결제가 처리되었습니다!')
      
      // 알림 추가
      toast.success(`₩${amount.toLocaleString()} 결제가 성공적으로 완료되었습니다.`)
      
      if (onSuccess) {
        onSuccess(result.id)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('결제 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodIcon = (provider: PaymentProvider) => {
    switch (provider) {
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'kakao_pay':
      case 'naver_pay':
      case 'toss_pay':
        return <Smartphone className="w-5 h-5" />
      case 'bank_transfer':
        return <Building2 className="w-5 h-5" />
      case 'paypal':
      case 'alipay':
      case 'wechat_pay':
        return <Globe className="w-5 h-5" />
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const isKoreanMethod = (provider: PaymentProvider) => {
    return ['kakao_pay', 'naver_pay', 'toss_pay', 'bank_transfer'].includes(provider)
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    return { value: month, label: month }
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear + i
    return { value: year.toString(), label: year.toString() }
  })

  const banks = [
    { code: 'KB', name: 'KB국민은행' },
    { code: 'SH', name: '신한은행' },
    { code: 'WR', name: '우리은행' },
    { code: 'HN', name: '하나은행' },
    { code: 'IBK', name: 'IBK기업은행' },
    { code: 'NH', name: 'NH농협은행' },
    { code: 'KEB', name: 'KEB하나은행' },
    { code: 'SC', name: 'SC제일은행' },
    { code: 'CT', name: '씨티은행' },
    { code: 'KK', name: '카카오뱅크' },
    { code: 'TOSS', name: '토스뱅크' }
  ]

  if (methodsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>결제 방법을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 결제 금액 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg">
            <span>결제 금액</span>
            <span className="font-semibold">
              {currency === 'KRW' ? '₩' : '$'}{amount.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 결제 방법 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.filter(method => method.isActive).map((method) => (
              <div key={method.id} className="relative">
                <input
                  type="radio"
                  id={method.id}
                  value={method.provider}
                  {...form.register('paymentMethod')}
                  className="sr-only peer"
                />
                <label
                  htmlFor={method.id}
                  className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  {getPaymentMethodIcon(method.provider)}
                  <div className="ml-3">
                    <div className="font-medium">{method.name}</div>
                    {method.description && (
                      <div className="text-sm text-gray-500">{method.description}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      수수료: {method.fees.percentage && `${method.fees.percentage}%`}
                      {method.fees.fixed && ` + ₩${method.fees.fixed.toLocaleString()}`}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 카드 정보 입력 */}
      {selectedPaymentMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>카드 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">카드번호 *</Label>
              <Input
                id="cardNumber"
                {...form.register('cardInfo.number')}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {form.formState.errors.cardInfo?.number && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cardInfo.number.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryMonth">유효기간 *</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.watch('cardInfo.expiryMonth')}
                    onValueChange={(value) => form.setValue('cardInfo.expiryMonth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="월" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={form.watch('cardInfo.expiryYear')}
                    onValueChange={(value) => form.setValue('cardInfo.expiryYear', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="년" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cvc">CVC *</Label>
                <Input
                  id="cvc"
                  {...form.register('cardInfo.cvc')}
                  placeholder="123"
                  maxLength={4}
                  type="password"
                />
                {form.formState.errors.cardInfo?.cvc && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.cardInfo.cvc.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="holderName">카드 소유자명 *</Label>
              <Input
                id="holderName"
                {...form.register('cardInfo.holderName')}
                placeholder="홍길동"
              />
              {form.formState.errors.cardInfo?.holderName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.cardInfo.holderName.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 계좌이체 정보 입력 */}
      {selectedPaymentMethod === 'bank_transfer' && (
        <Card>
          <CardHeader>
            <CardTitle>계좌이체 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bankCode">은행 *</Label>
              <Select
                value={form.watch('bankInfo.bankCode')}
                onValueChange={(value) => form.setValue('bankInfo.bankCode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="은행을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountNumber">계좌번호 *</Label>
              <Input
                id="accountNumber"
                {...form.register('bankInfo.accountNumber')}
                placeholder="123-456-789012"
              />
              {form.formState.errors.bankInfo?.accountNumber && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.bankInfo.accountNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="accountHolderName">예금주명 *</Label>
              <Input
                id="accountHolderName"
                {...form.register('bankInfo.holderName')}
                placeholder="홍길동"
              />
              {form.formState.errors.bankInfo?.holderName && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.bankInfo.holderName.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 간편결제 안내 */}
      {isKoreanMethod(selectedPaymentMethod) && selectedPaymentMethod !== 'bank_transfer' && (
        <Card>
          <CardHeader>
            <CardTitle>간편결제 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {selectedPaymentMethod === 'kakao_pay' && '카카오페이 앱에서 결제를 진행합니다.'}
              {selectedPaymentMethod === 'naver_pay' && '네이버페이로 안전하게 결제합니다.'}
              {selectedPaymentMethod === 'toss_pay' && '토스 앱에서 간편하게 결제합니다.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 동의사항 */}
      <Card>
        <CardHeader>
          <CardTitle>약관 동의</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              {...form.register('agreements.terms')}
              className="rounded border-gray-300"
            />
            <label htmlFor="terms" className="text-sm">
              이용약관에 동의합니다 *
            </label>
          </div>
          {form.formState.errors.agreements?.terms && (
            <p className="text-sm text-red-500">
              {form.formState.errors.agreements.terms.message}
            </p>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="privacy"
              {...form.register('agreements.privacy')}
              className="rounded border-gray-300"
            />
            <label htmlFor="privacy" className="text-sm">
              개인정보 처리방침에 동의합니다 *
            </label>
          </div>
          {form.formState.errors.agreements?.privacy && (
            <p className="text-sm text-red-500">
              {form.formState.errors.agreements.privacy.message}
            </p>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="payment"
              {...form.register('agreements.payment')}
              className="rounded border-gray-300"
            />
            <label htmlFor="payment" className="text-sm">
              결제 대행 서비스 약관에 동의합니다 *
            </label>
          </div>
          {form.formState.errors.agreements?.payment && (
            <p className="text-sm text-red-500">
              {form.formState.errors.agreements.payment.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              처리 중...
            </div>
          ) : (
            `₩${amount.toLocaleString()} 결제하기`
          )}
        </Button>
      </div>
    </form>
  )
}