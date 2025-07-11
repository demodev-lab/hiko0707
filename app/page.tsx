import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { 
  Truck, 
  CreditCard, 
  Globe, 
  Star, 
  TrendingUp, 
  ShoppingBag,
  Shield,
  Heart,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { HotDealsSection } from '@/components/features/home/hotdeals-section'

export default function Home() {
  const features = [
    {
      icon: Globe,
      title: '7개 언어 지원',
      description: '영어, 중국어, 일본어, 베트남어, 태국어, 스페인어, 아랍어로 한국 쇼핑을 즐기세요',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: ShoppingBag,
      title: '대리 구매 서비스',
      description: '복잡한 한국 쇼핑몰도 걱정 없어요. HiKo가 대리 구매해드립니다',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: TrendingUp,
      title: '실시간 핫딜 정보',
      description: '6개 주요 커뮤니티의 핫딜을 실시간으로 모아서 보여드려요',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Truck,
      title: '안전한 국제 배송',
      description: '검증된 물류 파트너와 함께 안전하고 빠른 배송을 제공합니다',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: Shield,
      title: '구매자 보호',
      description: '100% 환불 보장 정책으로 안심하고 쇼핑하세요',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: Heart,
      title: '24/7 고객 지원',
      description: '언제든지 도움이 필요하면 연락주세요. 모국어로 상담 가능합니다',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              한국 쇼핑의 모든 것, HiKo
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-4 max-w-3xl mx-auto">
              외국인을 위한 똑똑한 한국 쇼핑 도우미
            </p>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              언어 장벽 없이, 복잡함 없이, 안전하게 한국 제품을 만나보세요
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/hotdeals">
                <TrendingUp className="w-5 h-5 mr-2" />
                핫딜 보러가기
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/order">
                <ShoppingBag className="w-5 h-5 mr-2" />
                대리 구매
              </Link>
            </Button>
          </div>

          {/* 간단 소개 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">다국어 지원</h3>
              <p className="text-gray-600">7개 언어로 쉽고 편리하게</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">대리 구매</h3>
              <p className="text-gray-600">복잡한 한국 쇼핑을 대신 해드려요</p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">간편 결제</h3>
              <p className="text-gray-600">다양한 결제 방법 지원</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">HiKo가 특별한 이유</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            한국 쇼핑의 모든 어려움을 HiKo가 해결해드립니다
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${feature.bgColor} rounded-lg`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 핫딜 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">오늘의 핫딜</h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            실시간으로 업데이트되는 최고의 할인 상품들
          </p>
          <HotDealsSection />
        </div>
      </section>

      {/* 서비스 흐름 섹션 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">간단한 이용 방법</h2>
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
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: '활성 사용자', color: 'text-white' },
              { number: '1M+', label: '처리된 주문', color: 'text-white' },
              { number: '98%', label: '고객 만족도', color: 'text-white' },
              { number: '24/7', label: '고객 지원', color: 'text-white' }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 고객 후기 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">전 세계 고객들의 이야기</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                country: '🇺🇸 미국',
                comment: '한국 쇼핑이 이렇게 쉬울 줄 몰랐어요! HiKo 덕분에 좋아하는 K-뷰티 제품을 쉽게 구매할 수 있게 되었습니다.'
              },
              {
                name: 'Nguyen Minh',
                country: '🇻🇳 베트남',
                comment: '베트남어로 모든 정보를 볼 수 있어서 정말 편해요. 대리 구매 서비스도 너무 만족스럽습니다!'
              },
              {
                name: 'Ahmed Hassan',
                country: '🇸🇦 사우디아라비아',
                comment: '아랍어 지원이 완벽해요. 한국 전자제품을 안전하게 구매할 수 있는 최고의 플랫폼입니다.'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{testimonial.country}</div>
                    <div className="font-semibold">{testimonial.name}</div>
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
          <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요!</h2>
          <p className="text-xl mb-8 text-blue-100">
            회원가입하고 첫 주문 시 10% 할인 혜택을 받으세요
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                무료 회원가입 <CheckCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/hotdeals">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600 gap-2">
                핫딜 둘러보기 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 파트너 섹션 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-8">
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