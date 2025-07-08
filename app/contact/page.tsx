'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Phone, MessageCircle, Send, Paperclip, AlertCircle, CheckCircle, Loader2, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

interface ContactForm {
  category: string
  subject: string
  message: string
  name: string
  email: string
  phone: string
  orderId?: string
  attachments?: File[]
  agreeToPrivacy: boolean
}

interface ContactFormErrors {
  category?: string
  subject?: string
  message?: string
  name?: string
  email?: string
  phone?: string
  orderId?: string
  agreeToPrivacy?: string
}

const categories = [
  { value: 'general', label: '일반 문의' },
  { value: 'hotdeal', label: '핫딜 관련' },
  { value: 'order', label: '구매대행 문의' },
  { value: 'payment', label: '결제 문의' },
  { value: 'shipping', label: '배송 문의' },
  { value: 'account', label: '계정 문의' },
  { value: 'bug', label: '오류 신고' },
  { value: 'suggestion', label: '제안사항' },
  { value: 'partnership', label: '제휴 문의' },
  { value: 'other', label: '기타' }
]

export default function ContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<ContactForm>({
    category: '',
    subject: '',
    message: '',
    name: '',
    email: '',
    phone: '',
    orderId: '',
    attachments: [],
    agreeToPrivacy: false
  })
  const [errors, setErrors] = useState<ContactFormErrors>({})

  const validateForm = () => {
    const newErrors: ContactFormErrors = {}

    if (!form.category) newErrors.category = '문의 유형을 선택해주세요'
    if (!form.subject) newErrors.subject = '제목을 입력해주세요'
    if (!form.message) newErrors.message = '문의 내용을 입력해주세요'
    if (!form.name) newErrors.name = '이름을 입력해주세요'
    if (!form.email) newErrors.email = '이메일을 입력해주세요'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }
    if (!form.agreeToPrivacy) newErrors.agreeToPrivacy = '개인정보 수집 및 이용에 동의해주세요'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setLoading(false)
    setSubmitted(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // 파일 크기 제한 (10MB)
      const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024)
      
      if (validFiles.length < files.length) {
        alert('10MB 이하의 파일만 첨부 가능합니다')
      }
      
      setForm({ ...form, attachments: validFiles })
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">문의가 접수되었습니다</h2>
            <p className="text-gray-600 mb-6">
              빠른 시일 내에 답변 드리도록 하겠습니다.<br />
              답변은 입력하신 이메일로 발송됩니다.
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-500">
                문의 접수 번호: <span className="font-mono">INQ-{Date.now()}</span>
              </p>
              <p className="text-sm text-gray-500">
                예상 답변 시간: 영업일 기준 1-2일
              </p>
            </div>
            <Button onClick={() => router.push('/')}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">고객센터</h1>
        <p className="text-gray-600">
          HiKo 서비스 이용 중 궁금하신 점이나 불편사항을 문의해주세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* 연락처 정보 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연락처 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">이메일</p>
                  <p className="text-sm text-gray-600">support@hiko.kr</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">전화</p>
                  <p className="text-sm text-gray-600">02-1234-5678</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">카카오톡</p>
                  <p className="text-sm text-gray-600">@hiko</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">운영시간</p>
                  <p className="text-sm text-gray-600">
                    평일 09:00 - 18:00<br />
                    (주말 및 공휴일 휴무)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">오시는 길</p>
                  <p className="text-sm text-gray-600">
                    서울특별시 강남구 테헤란로<br />
                    지하철 2호선 강남역 3번 출구
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 자주 묻는 질문 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">도움이 필요하신가요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                문의하시기 전에 자주 묻는 질문을 확인해보세요
              </p>
              <Link href="/faq">
                <Button variant="outline" className="w-full">
                  FAQ 보러가기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 문의 폼 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>문의하기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 문의 유형 */}
                <div className="space-y-2">
                  <Label htmlFor="category">문의 유형 *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger id="category" className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="문의 유형을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category}</p>
                  )}
                </div>

                {/* 주문번호 (구매대행 문의인 경우) */}
                {form.category === 'order' && (
                  <div className="space-y-2">
                    <Label htmlFor="orderId">주문번호</Label>
                    <Input
                      id="orderId"
                      placeholder="주문번호를 입력해주세요 (선택)"
                      value={form.orderId}
                      onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                    />
                  </div>
                )}

                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="subject">제목 *</Label>
                  <Input
                    id="subject"
                    placeholder="문의 제목을 입력해주세요"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className={errors.subject ? 'border-red-500' : ''}
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject}</p>
                  )}
                </div>

                {/* 문의 내용 */}
                <div className="space-y-2">
                  <Label htmlFor="message">문의 내용 *</Label>
                  <Textarea
                    id="message"
                    placeholder="문의하실 내용을 자세히 작성해주세요"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={errors.message ? 'border-red-500' : ''}
                    rows={6}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500">{errors.message}</p>
                  )}
                </div>

                {/* 첨부파일 */}
                <div className="space-y-2">
                  <Label htmlFor="attachments">첨부파일</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments')?.click()}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      파일 첨부
                    </Button>
                    <span className="text-sm text-gray-500">
                      최대 10MB, 이미지/PDF/문서
                    </span>
                  </div>
                  {form.attachments && form.attachments.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {form.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Paperclip className="w-3 h-3" />
                          <span>{file.name}</span>
                          <span className="text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)}MB)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 이름 */}
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      placeholder="이름을 입력해주세요"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="답변받으실 이메일"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* 전화번호 */}
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    placeholder="연락 가능한 전화번호 (선택)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* 개인정보 동의 */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={form.agreeToPrivacy}
                      onCheckedChange={(checked) => 
                        setForm({ ...form, agreeToPrivacy: checked as boolean })
                      }
                    />
                    <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
                      개인정보 수집 및 이용에 동의합니다. 수집된 개인정보는 문의 답변 용도로만 사용되며,
                      답변 완료 후 3개월 뒤 자동 삭제됩니다.{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        자세히 보기
                      </Link>
                    </Label>
                  </div>
                  {errors.agreeToPrivacy && (
                    <p className="text-sm text-red-500">{errors.agreeToPrivacy}</p>
                  )}
                </div>

                {/* 안내 메시지 */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    문의 접수 후 영업일 기준 1-2일 이내에 답변 드립니다.
                    긴급한 문의는 카카오톡 @hiko로 연락주세요.
                  </AlertDescription>
                </Alert>

                {/* 제출 버튼 */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      문의 접수 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      문의 접수하기
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}