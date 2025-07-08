'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FileText, Shield, User, CreditCard, Globe, Scale, Mail } from 'lucide-react'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: string[]
}

const termsData: Section[] = [
  {
    id: 'general',
    title: '제1조 (목적)',
    icon: <FileText className="w-5 h-5" />,
    content: [
      '이 약관은 HiKo(하이코) (이하 "회사"라 합니다)가 운영하는 온라인 플랫폼 HiKo (이하 "서비스"라 합니다)에서 제공하는 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
      '본 서비스는 한국 거주 외국인을 위한 핫딜 정보 제공 및 구매 대행 서비스를 제공하며, 이용자의 편의를 위해 다국어 번역 서비스를 함께 제공합니다.'
    ]
  },
  {
    id: 'definitions',
    title: '제2조 (정의)',
    icon: <FileText className="w-5 h-5" />,
    content: [
      '① "서비스"란 회사가 제공하는 핫딜 정보 수집, 번역, 구매 대행 등 일체의 서비스를 의미합니다.',
      '② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.',
      '③ "회원"이란 회사와 서비스 이용계약을 체결하고 이용자 아이디(ID)를 부여받은 이용자를 말합니다.',
      '④ "비회원"이란 회원가입 없이 회사가 제공하는 서비스를 이용하는 자를 말합니다.',
      '⑤ "핫딜"이란 한국의 온라인 커뮤니티에서 공유되는 할인 정보, 특가 상품 정보를 말합니다.',
      '⑥ "구매대행"이란 회원의 요청에 따라 회사가 대신 상품을 구매하여 배송하는 서비스를 말합니다.'
    ]
  },
  {
    id: 'membership',
    title: '제3조 (회원가입 및 탈퇴)',
    icon: <User className="w-5 h-5" />,
    content: [
      '① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.',
      '② 회사는 다음 각 호에 해당하는 신청에 대하여 승낙하지 않거나 사후에 이용계약을 해지할 수 있습니다:',
      '  1. 실명이 아니거나 타인의 명의를 이용한 경우',
      '  2. 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우',
      '  3. 14세 미만 아동이 법정대리인의 동의를 얻지 않은 경우',
      '  4. 이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우',
      '③ 회원은 언제든지 서비스 내 "회원탈퇴" 메뉴를 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.',
      '④ 회원탈퇴 시 회원의 개인정보는 개인정보처리방침에 따라 처리됩니다.'
    ]
  },
  {
    id: 'service',
    title: '제4조 (서비스의 제공 및 변경)',
    icon: <Globe className="w-5 h-5" />,
    content: [
      '① 회사는 다음과 같은 서비스를 제공합니다:',
      '  1. 한국 온라인 커뮤니티의 핫딜 정보 수집 및 제공',
      '  2. 핫딜 정보의 다국어 번역 서비스 (8개 언어)',
      '  3. 구매 대행 서비스',
      '  4. 배송 추적 서비스',
      '  5. 기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스',
      '② 회사는 서비스의 내용을 변경할 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등을 변경 전 7일 이상 서비스 내에 공지합니다.',
      '③ 회사는 천재지변, 시스템 정기점검, 긴급 보수 등 불가피한 사유가 있는 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다.'
    ]
  },
  {
    id: 'purchase',
    title: '제5조 (구매대행 서비스)',
    icon: <CreditCard className="w-5 h-5" />,
    content: [
      '① 구매대행 서비스는 회원에 한하여 제공됩니다.',
      '② 구매대행 수수료는 상품 금액의 10% (최소 5,000원)이며, 별도의 배송비가 부과됩니다.',
      '③ 회원은 구매대행 신청 시 정확한 상품 정보와 배송지 정보를 제공해야 합니다.',
      '④ 다음 상품은 구매대행이 제한됩니다:',
      '  1. 식품, 의약품, 화장품 등 수입 규제 품목',
      '  2. 배터리 포함 제품 (항공 운송 제한)',
      '  3. 무기, 위험물품',
      '  4. 지적재산권을 침해하는 제품',
      '  5. 기타 각국 세관 규정에 위반되는 품목',
      '⑤ 구매대행 진행 상태는 다음과 같이 구분됩니다:',
      '  1. 주문 확인: 구매대행 요청이 접수됨',
      '  2. 구매 진행: 실제 상품 구매 진행 중',
      '  3. 배송 중: 상품이 배송되고 있음',
      '  4. 배송 완료: 상품이 회원에게 전달됨',
      '⑥ 관세 및 부가세는 수령 국가의 규정에 따라 회원이 부담합니다.'
    ]
  },
  {
    id: 'payment',
    title: '제6조 (결제 및 환불)',
    icon: <CreditCard className="w-5 h-5" />,
    content: [
      '① 서비스 이용요금의 결제는 신용카드, 계좌이체, 전자결제 등 회사가 제공하는 방법으로 할 수 있습니다.',
      '② 환불 정책은 다음과 같습니다:',
      '  1. 상품 구매 전: 수수료 포함 전액 환불',
      '  2. 상품 구매 후 배송 전: 수수료를 제외한 금액 환불',
      '  3. 배송 시작 후: 환불 불가 (단, 상품 하자 또는 오배송의 경우 제외)',
      '③ 회원의 귀책사유로 인한 환불 시 발생하는 수수료는 회원이 부담합니다.',
      '④ 환불은 환불 요청 후 영업일 기준 7일 이내에 처리됩니다.'
    ]
  },
  {
    id: 'obligations',
    title: '제7조 (회사와 회원의 의무)',
    icon: <Shield className="w-5 h-5" />,
    content: [
      '① 회사의 의무:',
      '  1. 회사는 안정적인 서비스 제공을 위해 최선을 다합니다.',
      '  2. 회사는 회원의 개인정보를 보호하기 위해 보안시스템을 구축하며 개인정보처리방침을 공시하고 준수합니다.',
      '  3. 회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 인정될 경우 이를 신속하게 처리합니다.',
      '② 회원의 의무:',
      '  1. 회원은 회원가입 시 정확한 정보를 제공해야 하며, 변경사항이 있을 경우 즉시 수정해야 합니다.',
      '  2. 회원은 타인의 정보를 도용해서는 안 됩니다.',
      '  3. 회원은 본 약관 및 관계법령을 준수해야 합니다.',
      '  4. 회원은 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 영리목적으로 이용하거나 제3자에게 제공해서는 안 됩니다.',
      '  5. 회원은 서비스를 이용하여 법령과 본 약관이 금지하는 행위를 해서는 안 됩니다.'
    ]
  },
  {
    id: 'liability',
    title: '제8조 (책임제한)',
    icon: <Scale className="w-5 h-5" />,
    content: [
      '① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.',
      '② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.',
      '③ 회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.',
      '④ 회사는 서비스를 통해 제공되는 핫딜 정보의 정확성을 보장하지 않으며, 실제 구매 시 가격이나 조건이 변경될 수 있습니다.',
      '⑤ 구매대행 서비스 이용 시 발생하는 관세, 부가세 등은 회원이 부담하며, 회사는 이에 대한 책임을 지지 않습니다.'
    ]
  },
  {
    id: 'privacy',
    title: '제9조 (개인정보보호)',
    icon: <Shield className="w-5 h-5" />,
    content: [
      '① 회사는 회원의 개인정보를 보호하기 위하여 정보통신망법 및 개인정보보호법 등 관련 법령이 정하는 바를 준수합니다.',
      '② 회사는 회원의 개인정보를 보호하기 위한 개인정보처리방침을 수립하고 서비스 내에 공시합니다.',
      '③ 회사는 관련 법령에 의한 경우를 제외하고는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.'
    ]
  },
  {
    id: 'termination',
    title: '제10조 (계약해지)',
    icon: <FileText className="w-5 h-5" />,
    content: [
      '① 회원은 언제든지 서비스 내 "회원탈퇴" 메뉴를 통해 이용계약 해지를 요청할 수 있습니다.',
      '② 회사는 회원이 다음 각 호의 사유에 해당하는 경우, 사전통지 없이 이용계약을 해지할 수 있습니다:',
      '  1. 타인의 서비스 ID 및 비밀번호를 도용한 경우',
      '  2. 서비스 운영을 고의로 방해한 경우',
      '  3. 허위로 가입 신청을 한 경우',
      '  4. 같은 사용자가 다른 ID로 이중 등록을 한 경우',
      '  5. 공공질서 및 미풍양속에 저해되는 내용을 유포시킨 경우',
      '  6. 타인의 명예를 손상시키거나 불이익을 주는 행위를 한 경우',
      '  7. 기타 본 약관에 위배되는 행위를 한 경우'
    ]
  },
  {
    id: 'dispute',
    title: '제11조 (분쟁해결)',
    icon: <Scale className="w-5 h-5" />,
    content: [
      '① 회사와 회원 간에 발생한 분쟁은 상호 협의하여 해결하는 것을 원칙으로 합니다.',
      '② 이용자는 서비스 이용과 관련하여 불만이 있는 경우 회사의 고객센터 또는 한국소비자원 등에 그 해결을 요청할 수 있습니다.',
      '③ 회사와 회원 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.'
    ]
  },
  {
    id: 'others',
    title: '제12조 (기타)',
    icon: <FileText className="w-5 h-5" />,
    content: [
      '① 본 약관은 2025년 1월 1일부터 시행됩니다.',
      '② 본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.',
      '③ 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.',
      '④ 변경된 약관은 공지한 날로부터 7일 후부터 효력이 발생합니다.'
    ]
  }
]

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 헤더 */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold mb-4">이용약관</h1>
        <p className="text-gray-600">
          HiKo 서비스를 이용해 주셔서 감사합니다. 본 약관은 HiKo 서비스 이용에 관한 조건 및 절차를 규정합니다.
        </p>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span>시행일: 2025년 1월 1일</span>
          <span>버전: 1.0</span>
        </div>
      </div>
      
      {/* 약관 내용 */}
      <Card>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {termsData.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <span className="font-semibold text-left">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {section.content.map((paragraph, index) => (
                      <p key={index} className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      {/* 문의 정보 */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">약관에 대한 문의</h3>
          <p className="text-gray-700 mb-4">
            본 약관에 대한 문의사항이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>이메일: legal@hiko.kr</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span>고객센터: support@hiko.kr</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 관련 링크 */}
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/privacy">
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            개인정보처리방침 보기
          </Button>
        </Link>
        <Link href="/faq">
          <Button variant="outline">
            자주 묻는 질문
          </Button>
        </Link>
      </div>
    </div>
  )
}