'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Users, FileCheck, AlertCircle, Mail } from 'lucide-react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface PrivacySection {
  id: string
  title: string
  icon: React.ReactNode
  content: string[]
  table?: {
    headers: string[]
    rows: string[][]
  }
}

const privacyData: PrivacySection[] = [
  {
    id: 'intro',
    title: '개인정보처리방침 소개',
    icon: <Shield className="w-5 h-5" />,
    content: [
      'HiKo(하이코) (이하 "회사")는 이용자의 개인정보를 중요시하며, "개인정보보호법", "정보통신망 이용촉진 및 정보보호에 관한 법률" 등 관련 법령을 준수하고 있습니다.',
      '본 개인정보처리방침은 회사가 제공하는 HiKo 서비스(이하 "서비스")를 이용하는 과정에서 회사가 이용자로부터 수집하는 개인정보가 무엇이며, 수집한 개인정보를 어떻게 사용하고, 누구와 공유하며, 어떻게 보호하는지 등에 대한 정보를 담고 있습니다.'
    ]
  },
  {
    id: 'collection',
    title: '1. 수집하는 개인정보의 항목 및 수집방법',
    icon: <Database className="w-5 h-5" />,
    content: [
      '회사는 서비스 제공을 위해 필요한 최소한의 개인정보를 수집합니다.',
      '',
      '① 회원가입 시 수집항목',
      '• 필수항목: 이메일 주소, 비밀번호, 닉네임, 선호 언어',
      '• 선택항목: 프로필 사진, 생년월일, 성별, 거주 국가',
      '• 소셜로그인 시: 소셜 계정 정보(이메일, 닉네임, 프로필 사진)',
      '',
      '② 구매대행 서비스 이용 시 수집항목',
      '• 필수항목: 수령인 성명, 연락처, 배송지 주소, 여권번호(통관용)',
      '• 결제정보: 신용카드 정보, 계좌정보 등 결제수단 정보',
      '',
      '③ 서비스 이용 과정에서 자동 수집항목',
      '• IP 주소, 쿠키, 방문일시, 서비스 이용기록, 기기정보(기기종류, OS 버전 등)',
      '• 위치정보(선택적, 사용자 동의 시)',
      '',
      '④ 고객 문의 시 수집항목',
      '• 이메일 주소, 문의 내용, 첨부 파일(선택)'
    ]
  },
  {
    id: 'purpose',
    title: '2. 개인정보의 수집 및 이용목적',
    icon: <Eye className="w-5 h-5" />,
    content: [
      '회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다:',
      '',
      '① 서비스 제공에 관한 계약 이행 및 서비스 제공',
      '• 핫딜 정보 제공, 다국어 번역 서비스',
      '• 구매대행 서비스 제공',
      '• 콘텐츠 제공, 맞춤형 서비스 제공',
      '• 본인인증, 구매 및 요금 결제, 상품 배송',
      '',
      '② 회원 관리',
      '• 회원제 서비스 이용에 따른 본인확인',
      '• 개인식별, 불량회원의 부정 이용 방지',
      '• 가입 의사 확인, 연령 확인',
      '• 고지사항 전달, 불만처리 등을 위한 원활한 의사소통 경로의 확보',
      '',
      '③ 마케팅 및 광고 활용',
      '• 신규 서비스 개발 및 맞춤 서비스 제공',
      '• 이벤트 및 광고성 정보 제공 및 참여기회 제공(동의한 회원에 한함)',
      '• 인구통계학적 특성에 따른 서비스 제공',
      '• 서비스의 유효성 확인, 접속빈도 파악, 회원의 서비스 이용에 대한 통계'
    ]
  },
  {
    id: 'sharing',
    title: '3. 개인정보의 제공 및 공유',
    icon: <Users className="w-5 h-5" />,
    content: [
      '회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:',
      '',
      '① 이용자가 사전에 동의한 경우',
      '② 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우',
      '',
      '구매대행 서비스 제공을 위한 최소한의 개인정보 제공:',
    ],
    table: {
      headers: ['제공받는 자', '제공 목적', '제공 항목', '보유 및 이용기간'],
      rows: [
        ['배송업체 (DHL, EMS 등)', '상품 배송', '수령인명, 연락처, 배송지 주소', '배송 완료 후 1년'],
        ['PG사 (토스페이먼츠 등)', '결제 처리', '결제정보', '관련 법령에 따름'],
        ['통관업체', '수입통관', '수령인명, 여권번호', '통관 완료 후 5년']
      ]
    }
  },
  {
    id: 'retention',
    title: '4. 개인정보의 보유 및 이용기간',
    icon: <Lock className="w-5 h-5" />,
    content: [
      '회사는 개인정보 수집 및 이용목적이 달성된 후에는 예외 없이 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관련 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.',
      '',
      '① 회사 내부 방침에 의한 정보 보유',
      '• 부정 이용 방지를 위한 정보: 1년',
      '',
      '② 관련 법령에 의한 정보 보유',
      '• 계약 또는 청약철회 등에 관한 기록',
      '  - 보존 이유: 전자상거래법',
      '  - 보존 기간: 5년',
      '',
      '• 대금결제 및 재화 등의 공급에 관한 기록',
      '  - 보존 이유: 전자상거래법',
      '  - 보존 기간: 5년',
      '',
      '• 소비자의 불만 또는 분쟁처리에 관한 기록',
      '  - 보존 이유: 전자상거래법',
      '  - 보존 기간: 3년',
      '',
      '• 표시/광고에 관한 기록',
      '  - 보존 이유: 전자상거래법',
      '  - 보존 기간: 6개월',
      '',
      '• 웹사이트 방문기록',
      '  - 보존 이유: 통신비밀보호법',
      '  - 보존 기간: 3개월'
    ]
  },
  {
    id: 'destruction',
    title: '5. 개인정보의 파기절차 및 방법',
    icon: <FileCheck className="w-5 h-5" />,
    content: [
      '회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.',
      '',
      '① 파기절차',
      '• 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.',
      '• 이 때, DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.',
      '',
      '② 파기방법',
      '• 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 완전하게 삭제합니다.',
      '• 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.'
    ]
  },
  {
    id: 'rights',
    title: '6. 이용자의 권리와 그 행사방법',
    icon: <Shield className="w-5 h-5" />,
    content: [
      '이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.',
      '',
      '① 개인정보 조회 및 수정',
      '• 마이페이지 > 개인정보 관리 메뉴를 통해 직접 열람, 정정 가능',
      '',
      '② 가입해지(동의철회)',
      '• 마이페이지 > 회원탈퇴 메뉴를 통해 직접 탈퇴 가능',
      '• 고객센터(support@hiko.kr)로 연락하여 탈퇴 요청',
      '',
      '③ 개인정보 수집 및 이용 동의 철회',
      '• 회원가입 시 개인정보 수집 및 이용에 대해 동의하신 내용을 언제든지 철회할 수 있습니다.',
      '',
      '④ 만 14세 미만 아동의 개인정보 보호',
      '• 만 14세 미만 아동의 경우, 법정대리인의 동의를 받은 경우에만 회원가입이 가능합니다.',
      '• 법정대리인은 아동의 개인정보 열람, 정정, 삭제를 요청할 수 있습니다.'
    ]
  },
  {
    id: 'security',
    title: '7. 개인정보의 안전성 확보 조치',
    icon: <Lock className="w-5 h-5" />,
    content: [
      '회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.',
      '',
      '① 기술적 조치',
      '• 개인정보의 암호화: 비밀번호는 단방향 암호화되어 저장 및 관리됩니다.',
      '• 해킹 등에 대비한 기술적 대책: 보안프로그램 설치 및 주기적 업데이트',
      '• 접속기록의 보관 및 위변조 방지',
      '• 개인정보에 대한 접근 제한',
      '',
      '② 관리적 조치',
      '• 개인정보 취급 직원의 최소화 및 교육',
      '• 내부관리계획의 수립 및 시행',
      '• 정기적인 자체 감사 실시',
      '',
      '③ 물리적 조치',
      '• 전산실, 자료보관실 등의 접근통제'
    ]
  },
  {
    id: 'cookies',
    title: '8. 쿠키(Cookie)의 운영',
    icon: <Globe className="w-5 h-5" />,
    content: [
      '회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키를 사용합니다.',
      '',
      '① 쿠키란?',
      '• 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에 보내는 작은 텍스트 파일',
      '• 이용자의 컴퓨터 하드디스크에 저장됩니다.',
      '',
      '② 쿠키의 사용 목적',
      '• 이용자의 선호 언어 설정 저장',
      '• 로그인 상태 유지',
      '• 이용자의 방문 및 이용형태 분석',
      '• 맞춤형 서비스 제공',
      '',
      '③ 쿠키의 설치/운영 및 거부',
      '• 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.',
      '• 웹브라우저 설정을 통해 쿠키를 허용/거부할 수 있습니다.',
      '• 쿠키 설치를 거부할 경우, 일부 서비스 이용에 제한이 있을 수 있습니다.'
    ]
  },
  {
    id: 'international',
    title: '9. 국외 이전',
    icon: <Globe className="w-5 h-5" />,
    content: [
      '회사는 서비스 제공을 위해 다음과 같이 개인정보를 국외로 이전할 수 있습니다:',
      '',
      '① 구매대행 서비스 이용 시',
      '• 이전받는 자: 각국 배송업체',
      '• 이전 국가: 이용자가 지정한 배송지 국가',
      '• 이전 항목: 수령인명, 연락처, 배송지 주소',
      '• 이전 일시 및 방법: 구매대행 신청 시, 암호화된 전송',
      '• 보유 및 이용기간: 배송 완료 후 1년',
      '',
      '② 클라우드 서비스 이용',
      '• 이전받는 자: Amazon Web Services, Inc.',
      '• 이전 국가: 미국',
      '• 이전 항목: 서비스 이용 시 수집되는 모든 정보',
      '• 이전 일시 및 방법: 서비스 이용 시 실시간, 암호화된 전송',
      '• 보유 및 이용기간: 회원탈퇴 시까지'
    ]
  },
  {
    id: 'officer',
    title: '10. 개인정보보호책임자',
    icon: <Shield className="w-5 h-5" />,
    content: [
      '회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.',
      '',
      '▶ 개인정보보호책임자',
      '• 성명: 김하이',
      '• 직책: 개인정보보호팀장',
      '• 이메일: privacy@hiko.kr',
      '• 전화번호: 02-1234-5678',
      '',
      '▶ 개인정보보호 담당부서',
      '• 부서명: 개인정보보호팀',
      '• 이메일: privacy@hiko.kr',
      '',
      '이용자는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보보호책임자 및 담당부서로 문의하실 수 있습니다.'
    ]
  },
  {
    id: 'remedy',
    title: '11. 권익침해 구제방법',
    icon: <AlertCircle className="w-5 h-5" />,
    content: [
      '이용자는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.',
      '',
      '▶ 개인정보분쟁조정위원회',
      '• 전화: (국번없이) 1833-6972',
      '• 홈페이지: www.kopico.kisa.or.kr',
      '',
      '▶ 개인정보침해신고센터',
      '• 전화: (국번없이) 118',
      '• 홈페이지: privacy.kisa.or.kr',
      '',
      '▶ 대검찰청',
      '• 전화: (국번없이) 1301',
      '• 홈페이지: www.spo.go.kr',
      '',
      '▶ 경찰청',
      '• 전화: (국번없이) 182',
      '• 홈페이지: ecrm.cyber.go.kr'
    ]
  },
  {
    id: 'changes',
    title: '12. 개인정보처리방침의 변경',
    icon: <FileCheck className="w-5 h-5" />,
    content: [
      '① 이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.',
      '',
      '② 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.',
      '• 2024년 1월 1일 ~ 2024년 12월 31일 (보기)',
      '',
      '③ 회사는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.'
    ]
  }
]

export default function PrivacyPage() {
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
        
        <h1 className="text-3xl font-bold mb-4">개인정보처리방침</h1>
        <p className="text-gray-600">
          HiKo는 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수하고 있습니다.
        </p>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span>시행일: 2025년 1월 1일</span>
          <span>버전: 1.0</span>
          <Badge variant="secondary">개인정보보호법 준수</Badge>
        </div>
      </div>
      
      {/* 개인정보처리방침 내용 */}
      <div className="space-y-6">
        {privacyData.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {section.icon}
                <span>{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.content.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
                
                {section.table && (
                  <div className="overflow-x-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {section.table.headers.map((header, idx) => (
                            <TableHead key={idx}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.table.rows.map((row, rowIdx) => (
                          <TableRow key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                              <TableCell key={cellIdx}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* 문의 정보 */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            개인정보 관련 문의
          </h3>
          <p className="text-gray-700 mb-4">
            개인정보처리방침에 대한 문의사항이나 개인정보 관련 민원이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">개인정보보호책임자:</span> 김하이
            </div>
            <div>
              <span className="font-medium">이메일:</span> privacy@hiko.kr
            </div>
            <div>
              <span className="font-medium">전화:</span> 02-1234-5678
            </div>
            <div>
              <span className="font-medium">운영시간:</span> 평일 09:00-18:00 (한국 시간)
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 관련 링크 */}
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/terms">
          <Button variant="outline">
            <FileCheck className="w-4 h-4 mr-2" />
            이용약관 보기
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