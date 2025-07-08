import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Truck, CreditCard, Globe, Star, TrendingUp, ShoppingBag } from 'lucide-react'
import { HotDealsSection } from '@/components/features/home/hotdeals-section'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              HiKo
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-2">
              한국 쇼핑의 새로운 경험
            </p>
            <p className="text-lg text-gray-500">
              한국 거주 외국인을 위한 핫딜 쇼핑 도우미
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
                대신 사줘요
              </Link>
            </Button>
          </div>

          {/* 특징 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="text-center p-6">
              <Globe className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">다국어 지원</h3>
              <p className="text-gray-600">7개 언어로 쉽고 편리하게</p>
            </Card>
            <Card className="text-center p-6">
              <Truck className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">대신 사줘요</h3>
              <p className="text-gray-600">복잡한 한국 쇼핑을 대신 해드려요</p>
            </Card>
            <Card className="text-center p-6">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">간편 결제</h3>
              <p className="text-gray-600">다양한 결제 방법 지원</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 핫딜 섹션 */}
      <div className="max-w-6xl mx-auto px-4">
        <HotDealsSection />
      </div>

      {/* 통계 섹션 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">HiKo와 함께하는 스마트 쇼핑</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">오늘의 핫딜</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">7</div>
              <div className="text-gray-600">지원 언어</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">6개</div>
              <div className="text-gray-600">한국 커뮤니티</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">실시간 업데이트</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">지금 시작해보세요!</h2>
          <p className="text-xl text-gray-600 mb-8">
            한국의 최고 핫딜을 언어 장벽 없이 쉽게 만나보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/dashboard">
                <Star className="w-5 h-5 mr-2" />
                지금 시작하기
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/dashboard/payments">
                결제 내역 보기
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}