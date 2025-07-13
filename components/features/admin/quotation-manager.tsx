'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Calculator, 
  Send, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  DollarSign,
  Package,
  Truck,
  Info,
  RefreshCw,
  Plus,
  Minus,
  History,
  Brain,
  Zap,
  Edit3
} from 'lucide-react'
import { useQuotationManagement, usePriceVerification } from '@/hooks/use-price-verification'
import { useQuoteAutomation } from '@/hooks/use-quote-automation'
import { BuyForMeRequest } from '@/types/buy-for-me'
import { DetailedQuotation, QuotationFee, ShippingOption } from '@/types/quotation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

const quotationSchema = z.object({
  productCost: z.number().min(0, '상품 금액은 0 이상이어야 합니다'),
  serviceFeePercent: z.number().min(0).max(50, '서비스 수수료는 0-50% 사이여야 합니다'),
  domesticShipping: z.number().min(0, '배송비는 0 이상이어야 합니다'),
  notes: z.string().optional(),
  validDays: z.number().min(1).max(30, '유효기간은 1-30일 사이여야 합니다')
})

type QuotationFormData = z.infer<typeof quotationSchema>

interface QuotationManagerProps {
  request: BuyForMeRequest
  adminId: string
  onQuotationSent?: (quotation: DetailedQuotation) => void
  className?: string
}

export function QuotationManager({ 
  request, 
  adminId, 
  onQuotationSent,
  className = '' 
}: QuotationManagerProps) {
  const [currentQuotation, setCurrentQuotation] = useState<DetailedQuotation | null>(null)
  const [additionalFees, setAdditionalFees] = useState<QuotationFee[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [activeTab, setActiveTab] = useState('create')

  const {
    createQuotationWithPriceCheck,
    updateQuotation,
    sendQuotation,
    validateQuotation,
    isCreating,
    isUpdating,
    isSending,
    validationResults,
    getValidationResult
  } = useQuotationManagement()

  // 가격 확인을 위한 핫딜 객체 생성
  const hotdeal = {
    id: request.hotdealId || request.id,
    title: request.productInfo.title,
    price: request.productInfo.discountedPrice.toString(),
    originalPrice: request.productInfo.originalPrice.toString(),
    productUrl: request.productInfo.originalUrl,
    seller: request.productInfo.siteName
  } as any

  const {
    priceResult,
    priceChange,
    isLoading: isPriceLoading,
    refreshPrice
  } = usePriceVerification(hotdeal, true)

  // 자동화 기능
  const {
    generateAutoQuote,
    canAutomate,
    estimateAutomationLevel,
    isGenerating
  } = useQuoteAutomation()

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      productCost: (priceResult?.currentPrice || request.productInfo.discountedPrice) * request.quantity,
      serviceFeePercent: 8,
      domesticShipping: 3000,
      validDays: 7
    }
  })

  // 가격 확인 결과 반영
  useEffect(() => {
    if (priceResult?.success && priceResult.currentPrice) {
      const newProductCost = priceResult.currentPrice * request.quantity
      form.setValue('productCost', newProductCost)
    }
  }, [priceResult, request.quantity, form])

  // 실시간 총액 계산
  const watchedValues = form.watch()
  const serviceFee = Math.round(watchedValues.productCost * (watchedValues.serviceFeePercent / 100))
  const additionalFeesTotal = additionalFees.reduce((sum, fee) => {
    return sum + (fee.type === 'percentage' 
      ? Math.round(watchedValues.productCost * (fee.amount / 100))
      : fee.amount)
  }, 0)
  const totalAmount = watchedValues.productCost + serviceFee + additionalFeesTotal + watchedValues.domesticShipping

  // 견적서 생성
  const handleCreateQuotation = async (data: QuotationFormData) => {
    try {
      const quotation = await createQuotationWithPriceCheck(request, adminId, {
        notes: data.notes,
        customFees: additionalFees
      })

      if (quotation) {
        setCurrentQuotation(quotation)
        setActiveTab('review')
        toast.success('견적서가 생성되었습니다')
      }
    } catch (error) {
      console.error('Failed to create quotation:', error)
    }
  }

  // 견적서 발송
  const handleSendQuotation = async () => {
    if (!currentQuotation) return

    try {
      const sentQuotation = await sendQuotation({ quotation: currentQuotation, adminId })
      setCurrentQuotation(sentQuotation)
      onQuotationSent?.(sentQuotation)
      toast.success('견적서가 고객에게 발송되었습니다')
    } catch (error) {
      console.error('Failed to send quotation:', error)
    }
  }

  // 자동 견적서 생성
  const handleGenerateAutoQuote = async () => {
    try {
      const result = await generateAutoQuote(request, priceResult || undefined)
      
      if (result) {
        setCurrentQuotation(result.quotation)
        
        // 폼에 자동 생성된 값 설정
        form.setValue('productCost', result.quotation.pricing.productCost)
        form.setValue('serviceFeePercent', result.quotation.pricing.serviceFeePercent)
        form.setValue('domesticShipping', result.quotation.pricing.domesticShipping)
        
        // 탭을 미리보기로 전환
        setActiveTab('preview')
        
        toast.success(
          `자동 견적서가 생성되었습니다 (신뢰도: ${result.confidence}%${result.requiresReview ? ', 검토 필요' : ''})`
        )
        
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            toast.warning(warning)
          })
        }
      }
    } catch (error) {
      console.error('Failed to generate auto quote:', error)
      toast.error('자동 견적서 생성에 실패했습니다')
    }
  }

  // 추가 수수료 관리
  const addAdditionalFee = () => {
    const newFee: QuotationFee = {
      id: `fee-${Date.now()}`,
      name: '',
      description: '',
      type: 'fixed',
      amount: 0,
      isOptional: false,
      category: 'service'
    }
    setAdditionalFees(prev => [...prev, newFee])
  }

  const updateAdditionalFee = (index: number, field: keyof QuotationFee, value: any) => {
    setAdditionalFees(prev => 
      prev.map((fee, i) => i === index ? { ...fee, [field]: value } : fee)
    )
  }

  const removeAdditionalFee = (index: number) => {
    setAdditionalFees(prev => prev.filter((_, i) => i !== index))
  }

  // 가격 변동 알림
  const renderPriceAlert = () => {
    if (!priceResult?.success || !priceChange?.trend || priceChange.trend === 'stable') return null

    const isIncrease = priceChange.trend === 'increase'
    const alertColor = isIncrease ? 'border-red-200' : 'border-green-200'
    const message = isIncrease ? '가격이 상승했습니다' : '가격이 하락했습니다'

    return (
      <Alert className={alertColor}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm">가격 변동 감지</AlertTitle>
        <AlertDescription className="text-xs">
          {message} ({priceChange.changePercent.toFixed(1)}%)
          <br />
          예상: ₩{request.productInfo.discountedPrice.toLocaleString()} → 
          실제: ₩{priceResult.currentPrice?.toLocaleString()}
        </AlertDescription>
      </Alert>
    )
  }

  const validation = currentQuotation ? getValidationResult(currentQuotation.id) : null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          견적서 관리
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">견적 작성</TabsTrigger>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="review">견적 검토</TabsTrigger>
            <TabsTrigger value="history">발송 이력</TabsTrigger>
          </TabsList>

          {/* 견적 작성 탭 */}
          <TabsContent value="create" className="space-y-6">
            {/* 가격 확인 섹션 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">실시간 가격 확인</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshPrice}
                    disabled={isPriceLoading}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isPriceLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>예상 가격</Label>
                    <p className="font-medium">₩{request.productInfo.discountedPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>실제 가격</Label>
                    <p className="font-medium text-blue-600">
                      ₩{(priceResult?.currentPrice || request.productInfo.discountedPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
                {renderPriceAlert()}
              </CardContent>
            </Card>

            {/* 자동화 섹션 */}
            {canAutomate(request) && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      자동 견적서 생성
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      예상 수준: {estimateAutomationLevel(request) === 'full' ? '완전 자동화' : 
                                 estimateAutomationLevel(request) === 'partial' ? '부분 자동화' : '수동 처리'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        AI가 상품 정보와 자동화 규칙을 바탕으로 견적서를 자동 생성합니다.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        생성 후 검토하여 수정할 수 있습니다.
                      </p>
                    </div>
                    <Button 
                      type="button"
                      onClick={handleGenerateAutoQuote}
                      disabled={isGenerating}
                      className="ml-4"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 mr-2" />
                          자동 생성
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 견적 입력 폼 */}
            <form onSubmit={form.handleSubmit(handleCreateQuotation)} className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    상품 및 비용 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productCost">상품 총액 (수량 {request.quantity}개)</Label>
                      <Input
                        {...form.register('productCost', { valueAsNumber: true })}
                        type="number"
                        step="1000"
                      />
                      {form.formState.errors.productCost && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.productCost.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="serviceFeePercent">서비스 수수료 (%)</Label>
                      <Input
                        {...form.register('serviceFeePercent', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        계산된 수수료: ₩{serviceFee.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="domesticShipping">국내 배송비</Label>
                    <Input
                      {...form.register('domesticShipping', { valueAsNumber: true })}
                      type="number"
                      step="500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 추가 수수료 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">추가 수수료</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addAdditionalFee}>
                      <Plus className="w-3 h-3 mr-1" />
                      수수료 추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {additionalFees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      추가 수수료가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {additionalFees.map((fee, index) => (
                        <div key={fee.id} className="flex items-center gap-2 p-3 border rounded-lg">
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <Input
                              placeholder="수수료 명"
                              value={fee.name}
                              onChange={(e) => updateAdditionalFee(index, 'name', e.target.value)}
                            />
                            <Select
                              value={fee.type}
                              onValueChange={(value) => updateAdditionalFee(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">고정 금액</SelectItem>
                                <SelectItem value="percentage">비율(%)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="금액/비율"
                              value={fee.amount}
                              onChange={(e) => updateAdditionalFee(index, 'amount', parseFloat(e.target.value) || 0)}
                            />
                            <div className="flex items-center">
                              <span className="text-sm font-medium">
                                ₩{(fee.type === 'percentage' 
                                  ? Math.round(watchedValues.productCost * (fee.amount / 100))
                                  : fee.amount
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdditionalFee(index)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 총액 표시 */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>상품 금액</span>
                      <span>₩{watchedValues.productCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>서비스 수수료 ({watchedValues.serviceFeePercent}%)</span>
                      <span>₩{serviceFee.toLocaleString()}</span>
                    </div>
                    {additionalFeesTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>추가 수수료</span>
                        <span>₩{additionalFeesTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>배송비</span>
                      <span>₩{watchedValues.domesticShipping.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>총 견적 금액</span>
                      <span className="text-blue-600">₩{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 메모 및 유효기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">관리자 메모</Label>
                  <Textarea
                    {...form.register('notes')}
                    placeholder="고객에게 전달할 특별 안내사항"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="validDays">견적서 유효기간 (일)</Label>
                  <Input
                    {...form.register('validDays', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    견적서 생성 중...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    견적서 생성
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* 견적 검토 탭 */}
          <TabsContent value="review" className="space-y-6">
            {currentQuotation ? (
              <>
                {/* 검증 결과 */}
                {validation && (
                  <Alert className={validation.isValid ? 'border-green-200' : 'border-red-200'}>
                    {validation.isValid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle className="text-sm">
                      견적서 검증 결과 (신뢰도: {validation.confidenceScore}%)
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {validation.isValid ? (
                        <p>견적서가 올바르게 작성되었습니다.</p>
                      ) : (
                        <div>
                          <p>다음 문제들을 확인해주세요:</p>
                          <ul className="list-disc list-inside mt-1">
                            {validation.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validation.warnings.length > 0 && (
                        <div className="mt-2">
                          <p>주의사항:</p>
                          <ul className="list-disc list-inside">
                            {validation.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 견적서 미리보기 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">견적서 미리보기</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{currentQuotation.productInfo.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        수량: {currentQuotation.productInfo.quantity}개 | 
                        판매처: {currentQuotation.productInfo.seller}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {Object.entries({
                        '상품 금액': currentQuotation.pricing.productCost,
                        '서비스 수수료': currentQuotation.pricing.serviceFee,
                        '배송비': currentQuotation.pricing.domesticShipping
                      }).map(([label, amount]) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span>{label}</span>
                          <span>₩{amount.toLocaleString()}</span>
                        </div>
                      ))}
                      
                      {currentQuotation.pricing.additionalFees.map((fee, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{fee.name}</span>
                          <span>₩{fee.amount.toLocaleString()}</span>
                        </div>
                      ))}

                      <Separator />
                      
                      <div className="flex justify-between font-semibold">
                        <span>총 견적 금액</span>
                        <span className="text-blue-600">
                          ₩{currentQuotation.pricing.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>유효기간: {format(currentQuotation.metadata.validUntil, 'yyyy년 MM월 dd일', { locale: ko })}까지</p>
                      {currentQuotation.metadata.notes && (
                        <p className="mt-1">메모: {currentQuotation.metadata.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 발송 버튼 */}
                {currentQuotation.status === 'draft' && (
                  <Button 
                    onClick={handleSendQuotation} 
                    className="w-full"
                    disabled={isSending || (validation && !validation.isValid)}
                  >
                    {isSending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        발송 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        견적서 발송
                      </>
                    )}
                  </Button>
                )}

                {currentQuotation.status === 'sent' && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle className="text-sm">견적서 발송 완료</AlertTitle>
                    <AlertDescription className="text-xs">
                      {currentQuotation.sentAt && (
                        <>발송일시: {format(currentQuotation.sentAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">먼저 견적서를 생성해주세요.</p>
              </div>
            )}
          </TabsContent>

          {/* 미리보기 탭 */}
          <TabsContent value="preview" className="space-y-4">
            {currentQuotation ? (
              <>
                {/* 자동화 정보 (자동 생성된 경우만) */}
                {/* TODO: automationInfo 타입 정의 후 활성화
                {currentQuotation.metadata?.automationInfo && (
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertTitle className="text-sm">자동 생성된 견적서</AlertTitle>
                    <AlertDescription className="text-xs space-y-1">
                      <p>신뢰도: {currentQuotation.metadata.automationInfo.confidence}%</p>
                      <p>자동화 수준: {currentQuotation.metadata.automationInfo.automationLevel}</p>
                      {currentQuotation.metadata.automationInfo.appliedRules.length > 0 && (
                        <p>적용된 규칙: {currentQuotation.metadata.automationInfo.appliedRules.join(', ')}</p>
                      )}
                      {currentQuotation.metadata.automationInfo.requiresReview && (
                        <p className="text-amber-600">⚠ 관리자 검토가 필요합니다</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                */}

                {/* 견적서 미리보기 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">견적서 미리보기</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 상품 정보 */}
                    <div>
                      <h3 className="font-medium mb-2">상품 정보</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">{currentQuotation.productInfo.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          수량: {request.quantity}개
                        </p>
                        {currentQuotation.productInfo.options && (
                          <p className="text-sm text-muted-foreground">
                            옵션: {currentQuotation.productInfo.options}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 가격 정보 */}
                    <div>
                      <h3 className="font-medium mb-2">가격 정보</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>상품 금액</span>
                          <span>₩{currentQuotation.pricing.productCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>서비스 수수료</span>
                          <span>₩{currentQuotation.pricing.serviceFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>배송비</span>
                          <span>₩{currentQuotation.pricing.domesticShipping.toLocaleString()}</span>
                        </div>
                        {currentQuotation.pricing.serviceFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>기타 수수료</span>
                            <span>₩{currentQuotation.pricing.serviceFee.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>총 견적 금액</span>
                          <span className="text-blue-600">
                            ₩{currentQuotation.pricing.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 배송 정보 */}
                    {/* TODO: timeline 타입 정의 후 활성화
                    <div>
                      <h3 className="font-medium mb-2">배송 정보</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">예상 처리 기간: {currentQuotation.timeline.total}</p>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <p>• 검토 및 구매: {currentQuotation.timeline.processing}</p>
                          <p>• 상품 구매: {currentQuotation.timeline.purchasing}</p>
                          <p>• 배송: {currentQuotation.timeline.shipping}</p>
                        </div>
                      </div>
                    </div>
                    */}

                    {/* 약관 및 주의사항 */}
                    {/* TODO: terms 타입 정의 후 활성화
                    {currentQuotation.terms.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">약관 및 주의사항</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <ul className="text-xs space-y-1">
                            {currentQuotation.terms.map((term, index) => (
                              <li key={index}>• {term}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    */}

                    {/* 유효기간 */}
                    <div className="text-center py-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        견적서 유효기간: {format(currentQuotation.metadata.validUntil, 'yyyy년 MM월 dd일', { locale: ko })}까지
                      </p>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('create')}
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        수정하기
                      </Button>
                      {currentQuotation.status === 'draft' && (
                        <Button 
                          onClick={handleSendQuotation}
                          disabled={isSending}
                          className="flex-1"
                        >
                          {isSending ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              발송 중...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              견적서 발송
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">미리볼 견적서가 없습니다.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('create')}
                  className="mt-4"
                >
                  견적서 작성하기
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 발송 이력 탭 */}
          <TabsContent value="history" className="space-y-4">
            {currentQuotation?.history && currentQuotation.history.length > 0 ? (
              <div className="space-y-2">
                {currentQuotation.history.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{entry.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(entry.timestamp, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                          </p>
                        </div>
                        <Badge variant={entry.userType === 'admin' ? 'default' : 'secondary'}>
                          {entry.userType === 'admin' ? '관리자' : '고객'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">이력이 없습니다.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}