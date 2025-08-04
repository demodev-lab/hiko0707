'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  CreditCard, 
  Link, 
  Info,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Home,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calculator,
  Search,
  Globe,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/context'
import { OrderFormData, calculateServiceFee } from '@/types/order'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/lib/notifications/notification-service'
import { UrlParser, ParsedProduct } from './url-parser'
import { FeeCalculator } from './fee-calculator'
import { AddressSearchModal } from '@/components/features/address/address-search-modal'
import { useCurrency } from '@/hooks/use-currency'
import { useSupabaseOrders, useSupabaseUserAddresses } from '@/hooks/use-supabase-order'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingUrlParser } from '@/lib/url-parser/shopping-url-parser'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookmarkCheck } from 'lucide-react'

const orderFormSchema = z.object({
  items: z.array(z.object({
    productName: z.string().min(1, '상품명을 입력해주세요'),
    productUrl: z.string().url('올바른 URL을 입력해주세요').min(1, '상품 URL은 필수 항목입니다'),
    price: z.number().min(0, '가격은 0 이상이어야 합니다'),
    quantity: z.number().min(1, '수량은 1 이상이어야 합니다'),
    options: z.record(z.string()).optional(),
    notes: z.string().optional(),
    imageUrl: z.string().optional()
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

const steps = [
  { id: 1, name: '상품 정보', icon: Package },
  { id: 2, name: '배송 정보', icon: Truck },
  { id: 3, name: '확인 및 결제', icon: CreditCard }
]

export function OrderFormV2({ initialData, hotdealId, onSuccess }: OrderFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { currentUser } = useAuth()
  const { createOrderAsync, isCreatingOrder } = useSupabaseOrders(currentUser?.id || '')
  const { convert, format } = useCurrency()
  const { addresses, defaultAddress, createAddressAsync, isCreatingAddress } = useSupabaseUserAddresses(currentUser?.id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showUrlParser, setShowUrlParser] = useState(false)
  const [showAddressSearch, setShowAddressSearch] = useState(false)
  const [searchType, setSearchType] = useState<'korean' | 'english'>('korean')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('KRW')

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      items: initialData?.items || [{
        productName: '',
        productUrl: '',
        price: 0,
        quantity: 1,
        options: {},
        notes: '',
        imageUrl: ''
      }],
      shippingAddress: initialData?.shippingAddress || {
        fullName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        email: currentUser?.email || '',
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

  // 기본 배송지 설정 (컴포넌트 로드 시)
  useEffect(() => {
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id)
      form.setValue('shippingAddress.fullName', defaultAddress.name)
      form.setValue('shippingAddress.phone', defaultAddress.phone)
      form.setValue('shippingAddress.email', currentUser?.email || '')
      form.setValue('shippingAddress.address', defaultAddress.address)
      form.setValue('shippingAddress.post_code', defaultAddress.post_code)
      form.setValue('shippingAddress.address_detail', defaultAddress.address_detail || '')
    } else {
      // 저장된 배송지가 없으면 새 배송지 폼으로 설정
      setSelectedAddressId('new')
      setShowNewAddressForm(true)
      setSaveAddress(true)
    }
  }, [defaultAddress, form, currentUser?.email])

  // 배송지 선택 핸들러
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    setShowNewAddressForm(false)
    
    if (addressId === 'new') {
      setShowNewAddressForm(true)
      // 폼 초기화
      form.setValue('shippingAddress.fullName', currentUser?.name || '')
      form.setValue('shippingAddress.phone', currentUser?.phone || '')
      form.setValue('shippingAddress.email', currentUser?.email || '')
      form.setValue('shippingAddress.address', '')
      form.setValue('shippingAddress.post_code', '')
      form.setValue('shippingAddress.address_detail', '')
      return
    }

    const selectedAddress = addresses.find(addr => addr.id === addressId)
    if (selectedAddress) {
      form.setValue('shippingAddress.fullName', selectedAddress.name)
      form.setValue('shippingAddress.phone', selectedAddress.phone)
      form.setValue('shippingAddress.email', currentUser?.email || '')
      form.setValue('shippingAddress.address', selectedAddress.address)
      form.setValue('shippingAddress.post_code', selectedAddress.post_code)
      form.setValue('shippingAddress.address_detail', selectedAddress.address_detail || '')
    }
  }

  // 비용 계산
  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  const serviceFee = Math.max(Math.round(subtotal * 0.08), subtotal > 0 ? 3000 : 0) // 8% 서비스 수수료 (최소 3,000원)
  const totalAmount = subtotal + serviceFee // 배송비는 별도

  // URL 파싱으로 상품 추가
  const handleProductParsed = (product: ParsedProduct) => {
    append({
      productName: product.title,
      productUrl: product.sourceUrl,
      price: product.price,
      quantity: 1,
      options: {},
      notes: '',
      imageUrl: product.imageUrl || ''
    })
    setShowUrlParser(false)
    toast.success('상품이 추가되었습니다')
  }

  // 단계 이동
  const goToNextStep = async () => {
    if (currentStep === 1) {
      // 상품 정보 검증
      const itemsValid = await form.trigger('items')
      if (!itemsValid) {
        toast.error('상품 정보를 모두 입력해주세요')
        return
      }
    } else if (currentStep === 2) {
      // 배송 정보 검증
      const shippingValid = await form.trigger('shippingAddress')
      if (!shippingValid) {
        toast.error('배송 정보를 모두 입력해주세요')
        return
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 주소 검색 결과 처리
  const handleAddressSearchSelect = (addressData: {
    fullAddress: string
    postalCode: string
    city: string
    state: string
    country: string
    detailAddress?: string
  }) => {
    form.setValue('shippingAddress.address', addressData.fullAddress)
    form.setValue('shippingAddress.post_code', addressData.postalCode)
    if (addressData.detailAddress) {
      form.setValue('shippingAddress.address_detail', addressData.detailAddress)
    }
    setShowAddressSearch(false)
  }

  const onSubmit = async (data: OrderFormData) => {
    console.log('=== 주문 생성 시작 ===')
    console.log('폼 데이터:', data)
    
    if (!currentUser) {
      toast.error('로그인이 필요합니다')
      router.push('/login')
      return
    }

    console.log('현재 사용자:', currentUser)

    setIsSubmitting(true)
    try {
      // 새 배송지 저장 (저장 체크박스가 선택되고 새 배송지인 경우)
      if (saveAddress && (selectedAddressId === 'new' || showNewAddressForm)) {
        try {
          const addressData = {
            user_id: currentUser.id,
            label: addresses.length === 0 ? '기본 배송지' : `배송지 ${addresses.length + 1}`,
            name: data.shippingAddress.fullName,
            phone: data.shippingAddress.phone,
            post_code: data.shippingAddress.post_code,
            address: data.shippingAddress.address,
            address_detail: data.shippingAddress.address_detail || '',
            is_default: addresses.length === 0, // 첫 번째 배송지면 기본으로 설정
          }
          
          console.log('배송지 저장 시도:', addressData)
          
          const savedAddress = await createAddressAsync(addressData)
          
          if (savedAddress) {
            console.log('배송지 저장 완료:', savedAddress)
            // toast.success('배송지가 저장되었습니다') // 중복 알림 제거
          }
        } catch (error) {
          console.error('배송지 저장 오류:', error)
          toast.error('배송지 저장 중 오류가 발생했습니다')
          // 배송지 저장 실패해도 주문은 계속 진행
        }
      }

      const orderData = {
        ...data,
        userId: currentUser.id
      }
      
      console.log('주문 데이터:', orderData)
      
      // Order 테이블에 저장
      const result = await createOrderAsync(orderData)
      
      console.log('주문 생성 결과:', result)

      // BuyForMeRequest 테이블에도 저장 (마이페이지에서 표시용)
      if (result && data.items.length > 0) {
        try {
          const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          const serviceFee = Math.max(3000, Math.round(subtotal * 0.08))
          const domesticShippingFee = 3000
          const totalAmount = subtotal + serviceFee + domesticShippingFee
          
          const buyForMeData = {
            userId: currentUser.id,
            hotdealId: 'direct-order', // 직접 주문을 나타내는 특별한 ID
            productInfo: {
              title: data.items[0].productName,
              originalPrice: data.items[0].price, // 원가와 할인가를 동일하게 설정
              discountedPrice: data.items[0].price,
              discountRate: 0, // 직접 주문이므로 할인율 0
              shippingFee: 0, // 배송비 정보가 없으므로 0
              imageUrl: data.items[0].imageUrl,
              originalUrl: data.items[0].productUrl || '',
              siteName: '직접 주문' // 사이트명을 '직접 주문'으로 표시
            },
            quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
            productOptions: data.items.map(item => 
              item.options ? Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ') : ''
            ).filter(Boolean).join(' | '),
            shippingInfo: {
              name: data.shippingAddress.fullName, // fullName → name
              phone: data.shippingAddress.phone, // phone field
              email: data.shippingAddress.email,
              address: data.shippingAddress.address, // address field
              postalCode: data.shippingAddress.post_code, // post_code field
              detailAddress: data.shippingAddress.address_detail || '' // address_detail field
            },
            specialRequests: data.customerNotes || '',
            estimatedServiceFee: serviceFee, // 서비스 수수료
            estimatedTotalAmount: totalAmount // 총액
          }
          
          console.log('BuyForMeRequest 데이터:', buyForMeData)
          
          // Buy-for-me 요청은 Supabase proxy_purchases_request 테이블에 이미 저장됨
          console.log('BuyForMeRequest는 proxy_purchases_request 테이블에 저장됨')
        } catch (error) {
          console.error('주문 처리 중 오류:', error)
          // Order는 이미 성공적으로 생성되었으므로 사용자는 계속 진행 가능
        }
      }

      // 하나의 통합된 성공 메시지만 표시
      if (result) {
        // 배송지 저장 여부와 관계없이 하나의 메시지만 표시
        const message = '대리 구매 요청이 접수되었습니다! 곧 견적서를 보내드리겠습니다.';
        
        toast.success(message, {
          duration: 5000,
          position: 'top-center',
          style: {
            fontSize: '16px',
            padding: '16px',
            maxWidth: '500px'
          }
        });
        
        // 알림 센터에도 저장
        notificationService.info(
          '대리 구매 요청 완료',
          message,
          '/mypage'
        );
        
        // 마이페이지로 리다이렉트 (약간의 딜레이 후)
        setTimeout(() => {
          router.push('/mypage')
        }, 1000)
      }
    } catch (error) {
      console.error('Order creation error:', error)
      toast.error('대리 구매 요청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 이 함수는 더 이상 사용하지 않음 (form 태그를 제거했으므로)

  return (
    <div className="space-y-6 pb-20">
      {/* 개선된 진행 상태 표시 - 핫딜 모달과 일관된 디자인 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-5 -mx-4 sm:-mx-0">
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
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                {/* 아이콘 원형 */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all duration-300 border-2",
                    currentStep >= step.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                      : "bg-white text-gray-400 border-gray-300"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                
                {/* 단계 라벨 */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-medium transition-all",
                    currentStep === step.id 
                      ? "text-blue-600" 
                      : currentStep > step.id 
                      ? "text-green-600" 
                      : "text-gray-500"
                  )}>
                    Step {step.id}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5 transition-all max-w-20 sm:max-w-none leading-tight",
                    currentStep === step.id 
                      ? "text-blue-600 font-medium" 
                      : currentStep > step.id 
                      ? "text-green-600" 
                      : "text-gray-500"
                  )}>
                    {step.name}
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
                width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%" 
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: 상품 정보 */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step Helper Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📋 구매하실 상품의 URL과 정보를 입력해주세요. URL 자동 입력을 사용하거나 아래 입력란에 직접 작성할 수 있습니다.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  상품 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* URL 파서 - 항상 표시 */}
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <Link className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">URL로 빠르게 상품 정보 입력</h3>
                        <p className="text-sm text-gray-600">쇼핑몰 상품 URL을 입력하면 정보가 자동으로 채워집니다</p>
                      </div>
                    </div>
                    {fields.length > 0 && (
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                        <ShoppingBag className="w-4 h-4 text-green-700" />
                        <span className="text-sm font-semibold text-green-700">{fields.length}개 추가됨</span>
                      </div>
                    )}
                  </div>
                  <UrlParser onProductParsed={handleProductParsed} />
                </div>

                {/* 상품 목록 */}
                {fields.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        상품 목록
                      </h4>
                      <span className="text-sm text-gray-500">총 {fields.length}개 상품</span>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="relative p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                        >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-xl"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold text-gray-800">상품 정보</h4>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        )}
                      </div>

                    {/* 상품 이미지 미리보기 */}
                    {watchedItems[index]?.imageUrl && (
                      <div className="mb-4">
                        <div className="w-24 h-24 relative bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={watchedItems[index].imageUrl}
                            alt={watchedItems[index].productName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 96px, 96px"
                            priority={index < 2}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor={`items.${index}.productUrl`} className="flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          상품 URL *
                        </Label>
                        <Input
                          {...form.register(`items.${index}.productUrl`)}
                          placeholder="구매하실 상품의 쇼핑몰 URL을 입력해주세요"
                          className="font-mono text-sm"
                        />
                        {form.formState.errors.items?.[index]?.productUrl && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.items[index]?.productUrl?.message}
                          </p>
                        )}
                      </div>

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
                        <Label htmlFor={`items.${index}.quantity`}>
                          수량 *
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentQty = form.getValues(`items.${index}.quantity`)
                              if (currentQty > 1) {
                                form.setValue(`items.${index}.quantity`, currentQty - 1)
                              }
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="text-center"
                            min="1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentQty = form.getValues(`items.${index}.quantity`)
                              form.setValue(`items.${index}.quantity`, currentQty + 1)
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {form.formState.errors.items?.[index]?.quantity && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor={`items.${index}.price`} className="flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          예상 가격 (원) *
                        </Label>
                        <Input
                          type="number"
                          {...form.register(`items.${index}.price`, { valueAsNumber: true })}
                          placeholder="0"
                          className="text-lg font-semibold"
                        />
                        {form.formState.errors.items?.[index]?.price && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.items[index]?.price?.message}
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
                      </motion.div>
                    ))}
                    </div>
                  </div>
                )}

                {/* 수동으로 상품 추가 버튼 */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-blue-50/30 hover:bg-blue-50/50 transition-all cursor-pointer"
                  onClick={() => append({
                    productName: '',
                    productUrl: '',
                    price: 0,
                    quantity: 1,
                    options: {},
                    notes: '',
                    imageUrl: ''
                  })}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">추가 상품 입력하기</h4>
                  <p className="text-sm text-gray-600">
                    더 많은 상품을 주문하시려면 클릭하세요
                  </p>
                </motion.div>

                {/* 현재 비용 계산 표시 */}
                {fields.length > 0 && (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">예상 비용</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                          {fields.length}개 상품
                        </Badge>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger className="w-auto h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KRW">원 (KRW)</SelectItem>
                            <SelectItem value="USD">달러 (USD)</SelectItem>
                            <SelectItem value="EUR">유로 (EUR)</SelectItem>
                            <SelectItem value="JPY">엔 (JPY)</SelectItem>
                            <SelectItem value="CNY">위안 (CNY)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">상품 금액</span>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-gray-400">KRW</span>
                            <span className="font-semibold text-gray-900 text-lg">{format(subtotal)}</span>
                          </div>
                          {selectedCurrency !== 'KRW' && (
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <span className="text-xs text-gray-400">{selectedCurrency}</span>
                              <span className="text-sm font-medium text-green-600">
                                {convert(subtotal, 'KRW', selectedCurrency) 
                                  ? format(convert(subtotal, 'KRW', selectedCurrency)!)
                                  : 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>수수료 (8%, 최소 3,000원)</span>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-gray-400">KRW</span>
                            <span className="text-sm font-medium">{format(serviceFee)}</span>
                          </div>
                          {selectedCurrency !== 'KRW' && (
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <span className="text-xs text-gray-400">{selectedCurrency}</span>
                              <span className="text-xs text-green-600">
                                {convert(serviceFee, 'KRW', selectedCurrency) 
                                  ? format(convert(serviceFee, 'KRW', selectedCurrency)!)
                                  : 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">예상 총액</span>
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm text-gray-400">KRW</span>
                              <span className="text-lg font-bold text-blue-600">{format(totalAmount)}</span>
                            </div>
                            {selectedCurrency !== 'KRW' && (
                              <div className="flex items-center gap-2 justify-end mt-1">
                                <span className="text-sm text-gray-400">{selectedCurrency}</span>
                                <span className="text-lg font-bold text-green-600">
                                  {convert(totalAmount, 'KRW', selectedCurrency) 
                                    ? format(convert(totalAmount, 'KRW', selectedCurrency)!)
                                    : 'N/A'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 환율 정보 */}
                        {selectedCurrency !== 'KRW' && (
                          <div className="mt-2 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                            1 KRW = {convert(1, 'KRW', selectedCurrency)?.toFixed(4) || 'N/A'} {selectedCurrency}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          * 배송비는 쇼핑몰별 실제 배송비가 별도 적용됩니다
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: 배송 정보 */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step Helper Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📍 배송받으실 주소와 연락처를 입력해주세요. 자주 사용하는 주소는 저장할 수 있습니다.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 저장된 배송지 선택 */}
                {addresses.length > 0 && (
                  <Card className="bg-gray-50 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-medium">저장된 배송지</Label>
                        <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                          <SelectTrigger className="w-auto min-w-[150px]">
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

                {/* 배송지 저장 옵션 */}
                {(showNewAddressForm || selectedAddressId === 'new' || addresses.length === 0) && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveAddress"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="saveAddress" className="cursor-pointer">
                          이 배송지를 저장하기
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingAddress.fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
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
                    <Label htmlFor="shippingAddress.phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
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

                  <div className="md:col-span-2">
                    <Label htmlFor="shippingAddress.email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
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
                </div>

                <Separator />

                {/* 주소 검색 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">주소검색:</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchType('korean')
                        setShowAddressSearch(true)
                      }}
                      className="flex-1"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      국문
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchType('english')
                        setShowAddressSearch(true)
                      }}
                      className="flex-1"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      영문
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="shippingAddress.post_code" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
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
          </motion.div>
        )}

        {/* Step 3: 확인 및 결제 */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Step Helper Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✅ 주문 정보를 최종 확인해주세요. 견적서는 실제 쇼핑몰 확인 후 발송됩니다.
              </p>
            </div>
            {/* 주문 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  주문 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.imageUrl && (
                      <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 64px, 64px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-gray-600">
                        {format(item.price)}원 × {item.quantity}개
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{format(item.price * item.quantity)}원</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 배송 정보 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{form.watch('shippingAddress.fullName')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{form.watch('shippingAddress.phone')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{form.watch('shippingAddress.email')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p>{form.watch('shippingAddress.address')}</p>
                      {form.watch('shippingAddress.address_detail') && (
                        <p>{form.watch('shippingAddress.address_detail')}</p>
                      )}
                      <p>우편번호: {form.watch('shippingAddress.post_code')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 비용 정보 */}
            <FeeCalculator 
              amount={subtotal}
              showDetailBreakdown={true}
              variant="default"
            />

            {/* 안내 사항 */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>대리 구매 진행 절차</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>주문 접수 후 실제 구매가 가능한지 확인합니다</li>
                  <li>최종 견적서를 보내드립니다 (실제 가격 반영)</li>
                  <li>견적 승인 후 상품을 구매합니다</li>
                  <li>상품 수령 후 검수 및 포장을 진행합니다</li>
                  <li>고객님께 배송해 드립니다</li>
                </ol>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개선된 하단 버튼 - 핫딜 모달과 일관된 스타일 */}
      <div className="sticky bottom-0 z-10 flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 -mx-4 sm:-mx-0 px-4 sm:px-6 py-4 sm:rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        {/* 왼쪽: 보조 액션 버튼들 */}
        <div className="flex gap-2 sm:mr-auto">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-initial text-sm px-4"
              onClick={goToPreviousStep}
              disabled={isSubmitting}
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
              className="flex-1 sm:flex-initial text-sm bg-blue-600 hover:bg-blue-700 px-8 py-2.5 font-medium shadow-md hover:shadow-lg transition-all"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToNextStep()
              }}
            >
              다음 단계 →
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 sm:flex-initial text-sm bg-green-600 hover:bg-green-700 px-8 py-2.5 font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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

      {/* 주소 검색 모달 */}
      <AddressSearchModal
        open={showAddressSearch}
        onOpenChange={setShowAddressSearch}
        searchType={searchType}
        onSelect={handleAddressSearchSelect}
      />
    </div>
  )
}