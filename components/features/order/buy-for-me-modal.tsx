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
  ChevronDown,
  Plus,
  BookmarkCheck,
  Search,
  Globe,
  Home
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBuyForMe } from '@/hooks/use-buy-for-me'
import { useAddresses } from '@/hooks/use-addresses'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCurrency } from '@/hooks/use-currency'
import { currencies } from '@/lib/services/currency-service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddressSearchModal } from '@/components/features/address/address-search-modal'

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
  const { addresses, defaultAddress, createAddress } = useAddresses()
  const router = useRouter()
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [showAddressSearch, setShowAddressSearch] = useState(false)
  const [searchType, setSearchType] = useState<'korean' | 'english'>('korean')
  const [currentStep, setCurrentStep] = useState(1)
  const { convert, format, formatWithDecimals } = useCurrency()

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

  // 기본 배송지 설정 (모달이 열릴 때)
  useEffect(() => {
    if (open) {
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        form.setValue('shippingInfo.fullName', defaultAddress.recipientName)
        form.setValue('shippingInfo.phoneNumber', defaultAddress.phoneNumber)
        form.setValue('shippingInfo.email', defaultAddress.email)
        form.setValue('shippingInfo.address', defaultAddress.address)
        form.setValue('shippingInfo.postalCode', defaultAddress.postalCode)
        form.setValue('shippingInfo.detailAddress', defaultAddress.detailAddress || '')
      } else {
        // 저장된 배송지가 없으면 새 배송지 폼으로 설정하고 저장 체크박스 기본 선택
        setSelectedAddressId('new')
        setShowNewAddressForm(true)
        setSaveAddress(true)
      }
    }
  }, [open, defaultAddress, form])

  // 배송지 선택 시 폼 자동 입력
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    setShowNewAddressForm(false)
    
    if (addressId === 'new') {
      setShowNewAddressForm(true)
      // 폼 초기화
      form.setValue('shippingInfo.fullName', currentUser?.name || '')
      form.setValue('shippingInfo.phoneNumber', currentUser?.phone || '')
      form.setValue('shippingInfo.email', currentUser?.email || '')
      form.setValue('shippingInfo.address', '')
      form.setValue('shippingInfo.postalCode', '')
      form.setValue('shippingInfo.detailAddress', '')
      return
    }

    const selectedAddress = addresses.find(addr => addr.id === addressId)
    if (selectedAddress) {
      form.setValue('shippingInfo.fullName', selectedAddress.recipientName)
      form.setValue('shippingInfo.phoneNumber', selectedAddress.phoneNumber)
      form.setValue('shippingInfo.email', selectedAddress.email)
      form.setValue('shippingInfo.address', selectedAddress.address)
      form.setValue('shippingInfo.postalCode', selectedAddress.postalCode)
      form.setValue('shippingInfo.detailAddress', selectedAddress.detailAddress || '')
    }
  }

  // 주소 검색 모달에서 선택한 주소 처리
  const handleAddressSearchSelect = (addressData: {
    fullAddress: string
    postalCode: string
    city: string
    state: string
    country: string
    detailAddress?: string
  }) => {
    // 주소 정보를 폼에 입력
    form.setValue('shippingInfo.address', addressData.fullAddress)
    form.setValue('shippingInfo.postalCode', addressData.postalCode)
    if (addressData.detailAddress) {
      form.setValue('shippingInfo.detailAddress', addressData.detailAddress)
    }
    setShowAddressSearch(false)
  }

  const onSubmit = async (data: BuyForMeFormData) => {
    console.log('=== onSubmit 호출됨 ===')
    console.log('현재 단계:', currentStep)
    console.log('폼 데이터:', data)
    
    // 3단계가 아니면 제출하지 않음
    if (currentStep !== 3) {
      console.log('3단계가 아니므로 제출하지 않음')
      return
    }
    
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    if (!hotdeal) {
      toast.error('상품 정보를 찾을 수 없습니다')
      return
    }

    // 새 배송지 저장 (저장 체크박스가 선택되고 새 배송지인 경우)
    console.log('=== 배송지 저장 프로세스 시작 ===')
    console.log('저장 조건:', {
      saveAddress,
      selectedAddressId,
      showNewAddressForm,
      addressesLength: addresses.length,
      currentUserId: currentUser?.id
    })
    
    if (saveAddress && (selectedAddressId === 'new' || showNewAddressForm)) {
      console.log('✅ 배송지 저장 조건 만족 - 저장 시작')
      try {
        const addressData = {
          name: addresses.length === 0 ? '기본 배송지' : `배송지 ${addresses.length + 1}`,
          recipientName: data.shippingInfo.fullName,
          phoneNumber: data.shippingInfo.phoneNumber,
          email: data.shippingInfo.email,
          postalCode: data.shippingInfo.postalCode,
          address: data.shippingInfo.address,
          detailAddress: data.shippingInfo.detailAddress || '',
          isDefault: addresses.length === 0, // 첫 번째 배송지면 기본으로 설정
        }
        
        console.log('💾 저장할 배송지 데이터:', addressData)
        
        // 저장 전 LocalStorage 상태 확인
        const beforeSave = localStorage.getItem('addresses')
        console.log('💿 저장 전 LocalStorage addresses:', beforeSave)
        
        const savedAddress = await createAddress(addressData)
        
        // 저장 후 LocalStorage 상태 확인
        const afterSave = localStorage.getItem('addresses')
        console.log('💿 저장 후 LocalStorage addresses:', afterSave)
        
        if (!savedAddress) {
          console.error('❌ 배송지 저장 실패: createAddress returned null')
          toast.error('배송지 저장에 실패했습니다')
          return
        }
        
        console.log('✅ 배송지 저장 완료:', savedAddress)
        console.log('📍 현재 addresses 상태:', addresses)
        toast.success('배송지가 저장되었습니다')
      } catch (error) {
        console.error('❌ 배송지 저장 오류:', error)
        toast.error('배송지 저장 중 오류가 발생했습니다')
        return
      }
    } else {
      console.log('❌ 배송지 저장 조건을 만족하지 않음')
    }
    console.log('=== 배송지 저장 프로세스 완료 ===')

    const estimatedPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '')) || 0
    const subtotal = estimatedPrice * data.quantity
    const serviceFee = Math.round(subtotal * 0.08) // 8% 서비스 수수료
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
        setSelectedAddressId('')
        setShowNewAddressForm(false)
        setSaveAddress(false)
        // Redirect to my page to see the request status
        router.push('/mypage')
      }
    })
  }

  if (!hotdeal) return null

  // 단계 이동 함수
  const handleNextStep = (e?: React.MouseEvent) => {
    // 이벤트 전파 중지
    e?.preventDefault()
    e?.stopPropagation()
    
    console.log('현재 단계:', currentStep)
    
    // 각 단계별 필수 입력 확인
    if (currentStep === 1) {
      // 1단계: 수량 검증
      const quantity = form.getValues('quantity')
      console.log('수량:', quantity)
      if (!quantity || quantity < 1) {
        toast.error('수량을 입력해주세요')
        return
      }
    } else if (currentStep === 2) {
      // 2단계: 주소 정보 확인
      const { address, postalCode } = form.getValues('shippingInfo')
      console.log('주소 정보:', { address, postalCode })
      if (!address || !postalCode) {
        toast.error('배송 주소를 입력해주세요')
        return
      }
    }
    
    if (currentStep < 3) {
      console.log('다음 단계로 이동:', currentStep + 1)
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 모달 닫을 때 단계 초기화
  const handleClose = (open: boolean) => {
    if (!open) {
      setCurrentStep(1)
      form.reset()
      setSelectedAddressId('')
      setShowNewAddressForm(false)
      setSaveAddress(false)
    }
    onOpenChange(open)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              대리 구매 신청
            </DialogTitle>
            <DialogDescription className="text-sm">
              한국 쇼핑몰에서 상품을 구매하여 배송해드립니다. 서비스 수수료: 8%
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator - 균형 잡힌 디자인 */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 -mx-3 sm:-mx-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                진행 단계 {currentStep} / 3
              </h3>
              <span className="text-xs text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                {Math.round((currentStep / 3) * 100)}% 완료
              </span>
            </div>
            
            {/* 진행 바 전체 */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: '상품 정보 확인', icon: '🛍️' },
                  { step: 2, label: '배송지 입력', icon: '📍' },
                  { step: 3, label: '최종 확인', icon: '✅' }
                ].map(({ step, label, icon }) => (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    {/* 아이콘 원형 */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300 border-2 ${
                        currentStep >= step
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                          : 'bg-white text-gray-400 border-gray-300'
                      }`}
                    >
                      {currentStep > step ? '✓' : icon}
                    </div>
                    
                    {/* 단계 라벨 */}
                    <div className="mt-3 text-center">
                      <p className={`text-xs font-medium transition-all ${
                        currentStep === step 
                          ? 'text-blue-600' 
                          : currentStep > step 
                          ? 'text-green-600' 
                          : 'text-gray-500'
                      }`}>
                        Step {step}
                      </p>
                      <p className={`text-xs mt-0.5 transition-all max-w-20 leading-tight ${
                        currentStep === step 
                          ? 'text-blue-600 font-medium' 
                          : currentStep > step 
                          ? 'text-green-600' 
                          : 'text-gray-500'
                      }`}>
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 연결 라인 */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-300 -z-0">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ 
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' 
                  }}
                />
              </div>
            </div>
          </div>

          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
            onKeyDown={(e) => {
              // Enter 키로 인한 자동 제출 방지 (마지막 단계가 아닐 때)
              if (e.key === 'Enter' && currentStep < 3) {
                e.preventDefault()
              }
            }}
          >
          {/* Step 1: Product Information & Order Details */}
          {currentStep === 1 && (
            <>
              {/* Step Helper Text */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📋 상품 정보를 확인하고 주문하실 수량을 입력해주세요.
                </p>
              </div>
              
              {/* Product Information */}
              <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* 모바일: 상단 전체 너비 이미지, 데스크톱: 좌측 작은 이미지 */}
                <div className="relative w-full sm:w-24 h-48 sm:h-auto bg-gray-100 sm:flex-shrink-0">
                  {hotdeal.imageUrl ? (
                    <Image
                      src={hotdeal.imageUrl}
                      alt={hotdeal.title}
                      width={400}
                      height={300}
                      sizes="(max-width: 640px) 100vw, 96px"
                      className="object-contain w-full h-full"
                      priority={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 sm:w-8 h-12 sm:h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* 상품 정보 영역 */}
                <div className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 min-w-0">
                  <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2">{hotdeal.title}</h3>
                  
                  {/* 가격 정보 섹션 */}
                  <div className="space-y-2">
                    {/* 현재 가격 */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        {/* 한국원화 가격 (항상 표시) */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">KRW</span>
                          <span className="text-base sm:text-xl font-bold text-blue-600">
                            ₩{parseInt(hotdeal.price.replace(/[^0-9]/g, '') || '0').toLocaleString()}
                          </span>
                        </div>
                        
                        {/* 변환된 가격 표시 영역 */}
                        <div className="flex items-center gap-2">
                          {selectedCurrency !== 'KRW' && (
                            <>
                              <span className="text-xs text-gray-500 font-medium">{selectedCurrency}</span>
                              <span className="text-sm sm:text-base font-semibold text-green-600">
                                {(() => {
                                  const krwPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '') || '0')
                                  const convertedPrice = convert(krwPrice, 'KRW', selectedCurrency)
                                  return convertedPrice ? formatWithDecimals(convertedPrice, selectedCurrency) : 'N/A'
                                })()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* 통화 선택기 */}
                      <div className="flex-shrink-0 self-start sm:self-auto">
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger className="w-20 sm:w-24 h-7 sm:h-8 text-xs border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.filter(currency => currency.code !== 'KRW').map((currency) => (
                              <SelectItem key={currency.code} value={currency.code} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{currency.flag}</span>
                                  <span>{currency.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* 원가 정보 */}
                    {hotdeal.originalPrice && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">정가</span>
                          <span className="text-xs sm:text-sm text-gray-500 line-through">
                            ₩{parseInt(hotdeal.originalPrice.replace(/[^0-9]/g, '') || '0').toLocaleString()}
                          </span>
                        </div>
                        
                        {selectedCurrency !== 'KRW' && (
                          <span className="text-xs text-gray-400 line-through">
                            {(() => {
                              const krwOriginalPrice = parseInt(hotdeal.originalPrice.replace(/[^0-9]/g, '') || '0')
                              const convertedPrice = convert(krwOriginalPrice, 'KRW', selectedCurrency)
                              return convertedPrice ? formatWithDecimals(convertedPrice, selectedCurrency) : 'N/A'
                            })()}
                          </span>
                        )}
                        
                        {hotdeal.discountRate && (
                          <Badge variant="destructive" className="text-xs">
                            {hotdeal.discountRate}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* 환율 정보 */}
                    {selectedCurrency !== 'KRW' && (
                      <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                        1 KRW = {(() => {
                          const rate = convert(1, 'KRW', selectedCurrency)
                          return rate ? rate.toFixed(4) : 'N/A'
                        })()} {selectedCurrency}
                      </div>
                    )}
                  </div>
                  
                  {/* Estimated Fee Info */}
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                      <p>
                        <span className="font-medium">예상 서비스 수수료:</span> 상품가격의 8%
                      </p>
                      <p className="font-semibold">
                        {(() => {
                          const krwPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '') || '0')
                          const quantity = form.watch('quantity') || 1
                          const totalPrice = krwPrice * quantity
                          const serviceFee = Math.round(totalPrice * 0.08) // 정확히 8% 계산 후 반올림
                          return (
                            <>
                              ₩{serviceFee.toLocaleString()}
                              {selectedCurrency !== 'KRW' && (
                                <span className="ml-2">
                                  ({(() => {
                                    const convertedFee = convert(serviceFee, 'KRW', selectedCurrency)
                                    return convertedFee ? formatWithDecimals(convertedFee, selectedCurrency) : 'N/A'
                                  })()})
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </p>
                      {form.watch('quantity') > 1 && (
                        <p className="text-[10px] opacity-75">
                          * 수량 {form.watch('quantity')}개 기준
                        </p>
                      )}
                    </div>
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
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              주문 정보
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  수량 <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="productOptions" className="text-sm font-medium">
                  상품 옵션 <span className="text-xs text-gray-500">(선택사항)</span>
                </Label>
                <Input
                  {...form.register('productOptions')}
                  placeholder="색상, 사이즈 등"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
            </>
          )}

          {/* Step 2: Address Information Only */}
          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4">
            {/* Step Helper Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📍 배송받으실 주소를 입력해주세요. 자주 사용하는 주소는 저장할 수 있습니다.
              </p>
            </div>
            
            <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              배송지 주소
            </h4>
            
            {addresses.length > 0 && (
              <Card className="bg-gray-50 dark:bg-gray-800 border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">저장된 배송지</Label>
                    <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                      <SelectTrigger className="w-auto text-xs h-8">
                        <SelectValue placeholder="배송지 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            <div className="flex items-center gap-2">
                              {address.isDefault && <BookmarkCheck className="w-3 h-3 text-blue-600" />}
                              <span>{address.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Plus className="w-3 h-3" />
                            <span>새 배송지</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Save Address Checkbox */}
            {(showNewAddressForm || selectedAddressId === 'new' || addresses.length === 0) && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                      이 배송지를 저장하기
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Address Input Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="shippingInfo.postalCode" className="text-sm font-medium">
                    우편번호 <span className="text-red-500">*</span>
                  </Label>
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
                <Label htmlFor="shippingInfo.address" className="text-sm font-medium mb-2 block">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">주소검색:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchType('korean')
                      setShowAddressSearch(true)
                    }}
                    className="h-8 text-xs px-3"
                  >
                    <Home className="w-3 h-3 mr-1.5" />
                    국문
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchType('english')
                      setShowAddressSearch(true)
                    }}
                    className="h-8 text-xs px-3"
                  >
                    <Globe className="w-3 h-3 mr-1.5" />
                    영문
                  </Button>
                </div>
                <Input
                  {...form.register('shippingInfo.address')}
                  placeholder="주소를 입력하거나 위 버튼으로 검색하세요"
                  className="text-sm"
                />
                {form.formState.errors.shippingInfo?.address && (
                  <p className="text-xs sm:text-sm text-red-500 mt-1">
                    {form.formState.errors.shippingInfo.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingInfo.detailAddress" className="text-sm font-medium">
                  상세 주소 <span className="text-xs text-gray-500">(선택사항)</span>
                </Label>
                <Input
                  {...form.register('shippingInfo.detailAddress')}
                  placeholder="동/호수, 층 등"
                  className="text-sm"
                />
              </div>
            </div>

          </div>
          )}

          {/* Step 3: Name and Contact Information */}
          {currentStep === 3 && (
            <>
              {/* Step Helper Text */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✅ 주문 정보를 최종 확인하고 수령인 정보를 입력해주세요.
                </p>
              </div>
              
              {/* Recipient Information */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  수령인 정보
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="shippingInfo.fullName" className="text-sm font-medium">
                      이름 <span className="text-red-500">*</span>
                    </Label>
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
                    <Label htmlFor="shippingInfo.phoneNumber" className="text-sm font-medium">
                      전화번호 <span className="text-red-500">*</span>
                    </Label>
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

                  <div className="sm:col-span-2">
                    <Label htmlFor="shippingInfo.email" className="text-sm font-medium">
                      이메일 <span className="text-red-500">*</span>
                    </Label>
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
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  추가 요청사항
                </h4>
                <Textarea
                  {...form.register('specialRequests')}
                  placeholder="특별한 요청사항이 있으시면 입력해주세요 (예: 선물 포장, 특정 배송 요청 등)"
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Order Summary */}
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4 space-y-3">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-600" />
                    주문 요약
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">상품명:</span>
                      <span className="font-medium break-all line-clamp-2">{hotdeal.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">수량:</span>
                      <span className="font-medium">{form.watch('quantity') || 1}개</span>
                    </div>
                    {form.watch('productOptions') && (
                      <div className="flex gap-2">
                        <span className="text-gray-600 flex-shrink-0">옵션:</span>
                        <span className="font-medium break-all">{form.watch('productOptions')}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-gray-600 flex-shrink-0">배송지:</span>
                      <span className="font-medium break-all line-clamp-2">
                        {form.watch('shippingInfo.address') || '미입력'}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    {(() => {
                      const quantity = form.watch('quantity') || 1
                      const unitPrice = parseInt(hotdeal.price.replace(/[^0-9]/g, '') || '0')
                      const subtotal = unitPrice * quantity
                      const serviceFee = Math.round(subtotal * 0.08) // 정확히 8% 계산 후 반올림
                      const estimatedShipping = 3000
                      const estimatedTotal = subtotal + serviceFee + estimatedShipping
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">상품가격:</span>
                            <span>₩{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">서비스 수수료 (8%):</span>
                            <span>₩{serviceFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">예상 배송비:</span>
                            <span>₩{estimatedShipping.toLocaleString()}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold text-base">
                            <span>예상 총액:</span>
                            <span className="text-blue-600">₩{estimatedTotal.toLocaleString()}</span>
                          </div>
                        </>
                      )
                    })()}
                    <div className="text-xs text-gray-500 mt-2">
                      * 정확한 금액은 견적서에서 확인하실 수 있습니다
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Information */}
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">진행 절차 안내</AlertTitle>
                <AlertDescription className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>실제 쇼핑몰에서 상품 가격과 재고를 확인합니다</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>상품가격, 배송비, 서비스 수수료(8%)가 포함된 견적서를 보내드립니다</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>견적 승인 및 결제 후 구매 대행을 진행합니다</span>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Action Buttons - 국제 표준 UX 패턴 (외국인 친화적) */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t bg-gray-50 dark:bg-gray-800 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 px-3 sm:px-6 py-4">
            {/* 왼쪽: 보조 액션 버튼들 */}
            <div className="flex gap-2 sm:mr-auto">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-initial text-sm px-4"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial text-sm px-4"
                  onClick={handlePrevStep}
                >
                  ← 이전
                </Button>
              )}
            </div>
            
            {/* 오른쪽: 주요 액션 버튼 */}
            <div className="flex gap-2 sm:ml-auto">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  className="flex-1 sm:flex-initial text-sm bg-blue-600 hover:bg-blue-700 px-6 font-medium"
                  onClick={(e) => handleNextStep(e)}
                >
                  다음 단계 →
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 sm:flex-initial text-sm bg-green-600 hover:bg-green-700 px-6 font-medium"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      처리중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      주문 신청
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 주소 검색 모달 */}
      <AddressSearchModal
        open={showAddressSearch}
        onOpenChange={setShowAddressSearch}
        onSelect={handleAddressSearchSelect}
        initialSearchType={searchType}
      />
    </>
  )
}