import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Globe, 
  ShoppingBag, 
  Users, 
  Heart, 
  Truck, 
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'HiKo 소개 - 한국 쇼핑의 새로운 시작',
  description: 'HiKo는 외국인들이 한국 온라인 쇼핑을 쉽고 편리하게 즐길 수 있도록 돕는 서비스입니다.'
}

export default function AboutPage() {
  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: '7개 언어 지원',
      description: '영어, 중국어, 일본어, 베트남어, 태국어, 스페인어, 아랍어로 한국 쇼핑을 즐기세요'
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: '대리 구매 서비스',
      description: '복잡한 한국 쇼핑몰도 걱정 없어요. HiKo가 대리 구매해드립니다'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: '실시간 핫딜 정보',
      description: '6개 주요 커뮤니티의 핫딜을 실시간으로 모아서 보여드려요'
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: '안전한 국제 배송',
      description: '검증된 물류 파트너와 함께 안전하고 빠른 배송을 제공합니다'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '구매자 보호',
      description: '100% 환불 보장 정책으로 안심하고 쇼핑하세요'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: '24/7 고객 지원',
      description: '언제든지 도움이 필요하면 연락주세요. 모국어로 상담 가능합니다'
    }
  ]

  const stats = [
    { number: '50K+', label: '활성 사용자' },
    { number: '1M+', label: '처리된 주문' },
    { number: '98%', label: '고객 만족도' },
    { number: '7', label: '지원 언어' }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      country: '🇺🇸 미국',
      comment: '한국 쇼핑이 이렇게 쉬울 줄 몰랐어요! HiKo 덕분에 좋아하는 K-뷰티 제품을 쉽게 구매할 수 있게 되었습니다.',
      rating: 5
    },
    {
      name: 'Nguyen Minh',
      country: '🇻🇳 베트남',
      comment: '베트남어로 모든 정보를 볼 수 있어서 정말 편해요. 대리 구매 서비스도 너무 만족스럽습니다!',
      rating: 5
    },
    {
      name: 'Ahmed Hassan',
      country: '🇸🇦 사우디아라비아',
      comment: '아랍어 지원이 완벽해요. 한국 전자제품을 안전하게 구매할 수 있는 최고의 플랫폼입니다.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 히어로 섹션 */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            한국 쇼핑의 새로운 시작, HiKo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            외국인을 위한 한국 온라인 쇼핑 도우미 서비스.<br />
            언어 장벽 없이, 복잡함 없이, 안전하게 한국 제품을 만나보세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/hotdeals">
              <Button size="lg" className="gap-2">
                핫딜 둘러보기 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/order">
              <Button size="lg" variant="outline" className="gap-2">
                대리 구매 신청 <ShoppingBag className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-blue-600 dark:bg-blue-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            HiKo가 특별한 이유
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 서비스 흐름 섹션 */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            간단한 이용 방법
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: '상품 찾기', desc: '핫딜을 둘러보거나 원하는 상품 URL을 입력하세요' },
              { step: '2', title: '주문 신청', desc: '배송 정보와 결제 정보를 입력하세요' },
              { step: '3', title: 'HiKo가 대리 구매', desc: '전문 구매팀이 한국 사이트에서 구매를 진행합니다' },
              { step: '4', title: '안전한 배송', desc: '검수 후 고객님께 안전하게 배송해드립니다' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 고객 후기 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            전 세계 고객들의 이야기
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                    &ldquo;{testimonial.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{testimonial.country}</div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            지금 바로 시작하세요!
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            회원가입하고 첫 주문 시 10% 할인 혜택을 받으세요
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                무료 회원가입 <CheckCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600 gap-2">
                문의하기 <Users className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 파트너 섹션 */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-8">
            신뢰할 수 있는 파트너들과 함께합니다
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">쿠팡</div>
            <div className="text-2xl font-bold text-gray-400">네이버</div>
            <div className="text-2xl font-bold text-gray-400">G마켓</div>
            <div className="text-2xl font-bold text-gray-400">11번가</div>
            <div className="text-2xl font-bold text-gray-400">SSG</div>
          </div>
        </div>
      </section>
    </div>
  )
}