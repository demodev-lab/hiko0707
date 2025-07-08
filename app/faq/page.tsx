'use client'

import { useState } from 'react'
import { Search, ChevronDown, ShoppingBag, Truck, CreditCard, Globe, User, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  tags?: string[]
}

const faqData: FAQItem[] = [
  // 서비스 이용
  {
    id: '1',
    category: '서비스 이용',
    question: 'HiKo(하이코)는 어떤 서비스인가요?',
    answer: 'HiKo는 한국 거주 외국인을 위한 핫딜 정보 및 구매 대행 서비스입니다. 한국의 주요 커뮤니티에서 실시간으로 핫딜 정보를 수집하고, 8개 언어로 번역하여 제공합니다. 또한 한국 온라인 쇼핑이 어려운 외국인을 위해 구매 대행 서비스도 제공하고 있습니다.',
    tags: ['서비스', '소개']
  },
  {
    id: '2',
    category: '서비스 이용',
    question: '지원하는 언어는 어떤 것들이 있나요?',
    answer: '현재 한국어, 영어, 중국어(간체/번체), 일본어, 베트남어, 태국어, 인도네시아어, 아랍어 총 8개 언어를 지원하고 있습니다. 앱 상단의 언어 선택 메뉴에서 원하는 언어로 변경할 수 있습니다.',
    tags: ['언어', '번역']
  },
  {
    id: '3',
    category: '서비스 이용',
    question: '회원가입이 필요한가요?',
    answer: '핫딜 정보 조회는 회원가입 없이도 가능합니다. 하지만 찜하기, 댓글 작성, 구매 대행 서비스 이용을 위해서는 회원가입이 필요합니다. 이메일 또는 소셜 로그인(구글, 페이스북 등)으로 간편하게 가입할 수 있습니다.',
    tags: ['회원가입', '로그인']
  },

  // 핫딜 정보
  {
    id: '4',
    category: '핫딜 정보',
    question: '핫딜 정보는 어디에서 가져오나요?',
    answer: '뽐뿌, FM코리아, 루리웹, 클리앙, 쿨엔조이, DVD프라임 등 한국의 주요 커뮤니티에서 실시간으로 핫딜 정보를 수집합니다. 각 커뮤니티에서 인기 있는 핫딜을 AI가 분석하여 가장 좋은 딜을 선별해 제공합니다.',
    tags: ['핫딜', '커뮤니티']
  },
  {
    id: '5',
    category: '핫딜 정보',
    question: '핫딜 정보는 얼마나 자주 업데이트되나요?',
    answer: '핫딜 정보는 24시간 실시간으로 업데이트됩니다. 각 커뮤니티의 새로운 핫딜이 올라오면 평균 5-10분 이내에 HiKo에서 확인할 수 있습니다.',
    tags: ['업데이트', '실시간']
  },
  {
    id: '6',
    category: '핫딜 정보',
    question: '핫딜의 가격이 실제와 다른 경우가 있나요?',
    answer: '핫딜 정보는 커뮤니티에 게시된 시점의 가격을 표시합니다. 시간이 지나면서 가격이 변동되거나 품절될 수 있으므로, 구매 전 실제 쇼핑몰에서 최신 가격을 확인하시기 바랍니다.',
    tags: ['가격', '정확도']
  },

  // 구매 대행
  {
    id: '7',
    category: '구매 대행',
    question: '"대신 사줘요" 서비스는 어떻게 이용하나요?',
    answer: '1) 원하는 상품의 핫딜 페이지에서 "대신 사줘요" 버튼 클릭\n2) 주문 정보(상품 정보, 옵션, 배송지 등) 입력\n3) 예상 비용 확인 및 결제\n4) HiKo가 대신 구매 진행\n5) 상품 수령 후 해외 배송\n6) 배송 완료',
    tags: ['구매대행', '이용방법']
  },
  {
    id: '8',
    category: '구매 대행',
    question: '구매 대행 수수료는 얼마인가요?',
    answer: '구매 대행 수수료는 상품 금액의 10% (최소 5,000원)입니다. 여기에 한국 내 배송비, 국제 배송비, 관세 및 부가세가 추가됩니다. 주문 시 예상 총 비용을 미리 확인할 수 있습니다.',
    tags: ['수수료', '비용']
  },
  {
    id: '9',
    category: '구매 대행',
    question: '모든 상품을 구매 대행할 수 있나요?',
    answer: '대부분의 상품이 가능하지만, 다음은 제외됩니다:\n- 식품, 의약품, 화장품 등 수입 규제 품목\n- 배터리 포함 제품 (항공 운송 제한)\n- 무기, 위험물품\n- 지적재산권 침해 제품\n- 기타 각국 세관 규정에 위반되는 품목',
    tags: ['구매대행', '제한사항']
  },

  // 배송
  {
    id: '10',
    category: '배송',
    question: '배송은 얼마나 걸리나요?',
    answer: '한국 내 구매: 2-3일\n국제 배송:\n- 특급 배송(EMS/DHL): 3-5일\n- 일반 배송: 7-14일\n- 선박 배송: 30-45일\n\n실제 배송 기간은 통관 상황에 따라 달라질 수 있습니다.',
    tags: ['배송', '기간']
  },
  {
    id: '11',
    category: '배송',
    question: '배송 추적은 어떻게 하나요?',
    answer: '주문 내역 페이지에서 실시간으로 배송 상태를 확인할 수 있습니다. 한국 내 배송과 국제 배송 모두 추적 번호가 제공되며, 각 단계별로 알림을 받을 수 있습니다.',
    tags: ['배송', '추적']
  },
  {
    id: '12',
    category: '배송',
    question: '관세는 어떻게 처리되나요?',
    answer: '관세와 부가세는 수령 국가의 규정에 따라 부과됩니다. 주문 시 예상 관세를 안내해드리며, 실제 관세는 통관 시 확정됩니다. 일부 국가는 일정 금액 이하 면세 혜택이 있습니다.',
    tags: ['관세', '세금']
  },

  // 결제
  {
    id: '13',
    category: '결제',
    question: '어떤 결제 수단을 사용할 수 있나요?',
    answer: '국내 결제: 신용/체크카드, 계좌이체, 카카오페이, 네이버페이, 토스\n해외 결제: Visa, Mastercard, PayPal, Alipay, WeChat Pay\n\n모든 결제는 안전한 PG사를 통해 처리됩니다.',
    tags: ['결제', '결제수단']
  },
  {
    id: '14',
    category: '결제',
    question: '환불은 어떻게 받나요?',
    answer: '상품 구매 전: 100% 환불\n상품 구매 후 배송 전: 수수료 제외 환불\n배송 시작 후: 환불 불가\n\n상품 하자나 오배송의 경우 전액 환불 또는 재배송해드립니다.',
    tags: ['환불', '취소']
  },
  {
    id: '15',
    category: '결제',
    question: '결제 오류가 발생했어요',
    answer: '결제 오류 시 다음을 확인해주세요:\n1) 카드 잔액 및 한도\n2) 해외 결제 차단 설정\n3) 결제 정보 정확성\n\n문제가 지속되면 고객센터로 문의주세요.',
    tags: ['결제오류', '문제해결']
  },

  // 계정
  {
    id: '16',
    category: '계정',
    question: '비밀번호를 잊어버렸어요',
    answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하고 가입한 이메일을 입력하세요. 비밀번호 재설정 링크가 이메일로 발송됩니다. 이메일이 오지 않는다면 스팸함을 확인해주세요.',
    tags: ['비밀번호', '계정']
  },
  {
    id: '17',
    category: '계정',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '마이페이지 > 계정 설정 > 회원 탈퇴에서 진행할 수 있습니다. 탈퇴 시 모든 주문 내역과 개인정보가 삭제되며, 진행 중인 주문이 있는 경우 탈퇴가 제한됩니다.',
    tags: ['탈퇴', '계정']
  },

  // 기타
  {
    id: '18',
    category: '기타',
    question: '고객센터 연락처는 어떻게 되나요?',
    answer: '이메일: support@hiko.kr\n카카오톡: @hiko\n운영시간: 평일 09:00-18:00 (한국 시간)\n\n긴급한 문의는 카카오톡을 이용해주세요.',
    tags: ['고객센터', '문의']
  },
  {
    id: '19',
    category: '기타',
    question: '파트너십 문의는 어떻게 하나요?',
    answer: '비즈니스 파트너십, 대량 구매, 기업 제휴 등의 문의는 business@hiko.kr로 연락주세요. 제안서와 함께 보내주시면 빠른 검토가 가능합니다.',
    tags: ['파트너십', '제휴']
  },
  {
    id: '20',
    category: '기타',
    question: '앱은 어디서 다운로드하나요?',
    answer: '현재 웹 서비스만 제공 중이며, 모바일 앱은 2024년 상반기 출시 예정입니다. 웹사이트는 모바일 환경에 최적화되어 있어 스마트폰에서도 편리하게 이용할 수 있습니다.',
    tags: ['앱', '모바일']
  }
]

const categories = ['전체', '서비스 이용', '핫딜 정보', '구매 대행', '배송', '결제', '계정', '기타']

const categoryIcons: Record<string, React.ReactNode> = {
  '서비스 이용': <Globe className="w-5 h-5" />,
  '핫딜 정보': <ShoppingBag className="w-5 h-5" />,
  '구매 대행': <ShoppingBag className="w-5 h-5" />,
  '배송': <Truck className="w-5 h-5" />,
  '결제': <CreditCard className="w-5 h-5" />,
  '계정': <User className="w-5 h-5" />,
  '기타': <MessageCircle className="w-5 h-5" />
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  
  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === '전체' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQItem[]>)
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">자주 묻는 질문</h1>
        <p className="text-gray-600">HiKo 서비스 이용에 대한 궁금증을 해결해드립니다</p>
      </div>
      
      {/* 검색바 */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="질문을 검색해보세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 h-12"
        />
      </div>
      
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex items-center gap-2"
          >
            {category !== '전체' && categoryIcons[category]}
            {category}
            {category === '전체' && (
              <Badge variant="secondary" className="ml-1">
                {faqData.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      {/* FAQ 목록 */}
      {filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">검색 결과가 없습니다</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('')
              setSelectedCategory('전체')
            }}>
              전체 FAQ 보기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFAQs).map(([category, faqs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryIcons[category]}
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex-1 pr-4">
                          <p className="font-medium">{faq.question}</p>
                          {faq.tags && (
                            <div className="flex gap-1 mt-1">
                              {faq.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-gray-600 whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 추가 도움말 */}
      <Card className="mt-12 bg-blue-50 border-blue-200">
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">원하는 답변을 찾지 못하셨나요?</h3>
          <p className="text-gray-600 mb-4">고객센터에서 직접 문의해주세요</p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                고객센터 문의
              </Button>
            </Link>
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              support@hiko.kr
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  )
}