'use client'

import { useState, useEffect } from 'react'
import { Globe, Heart, ShoppingBag, Zap, ArrowRight, X } from 'lucide-react'
import { AccessibleButton } from '@/components/common/accessible-button'
import { AccessibleModal } from '@/components/common/accessible-modal'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onStartTour: () => void
  userLanguage?: string
}

export function WelcomeModal({
  isOpen,
  onClose,
  onStartTour,
  userLanguage = 'ko'
}: WelcomeModalProps) {
  const { t } = useLanguage()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: <Globe className="w-12 h-12 text-blue-600" />,
      title: 'HiKo에 오신 것을 환영합니다!',
      subtitle: '한국 거주 외국인을 위한 쇼핑 도우미',
      description: '한국의 최고 핫딜을 놓치지 마세요. 7개 언어로 번역되어 더욱 편리하게 쇼핑할 수 있습니다.',
      features: [
        '실시간 핫딜 정보',
        '7개 언어 지원',
        '간편한 주문 대행 서비스'
      ]
    },
    {
      icon: <Zap className="w-12 h-12 text-orange-600" />,
      title: '실시간 핫딜 알림',
      subtitle: '놓치지 마세요!',
      description: '뽐뿌, 루리웹, 클리앙 등 주요 커뮤니티의 핫딜을 실시간으로 모아서 보여드립니다.',
      features: [
        '6개 주요 커뮤니티 크롤링',
        '실시간 업데이트',
        '카테고리별 필터링'
      ]
    },
    {
      icon: <ShoppingBag className="w-12 h-12 text-green-600" />,
      title: '대신 사줘요 서비스',
      subtitle: '복잡한 한국 쇼핑몰도 문제없어요',
      description: '한국어가 어려운 쇼핑몰에서도 저희가 대신 주문해드립니다. 간편하고 안전하게 쇼핑하세요.',
      features: [
        '전문 상담원 지원',
        '안전한 결제 시스템',
        '배송 추적 서비스'
      ]
    },
    {
      icon: <Heart className="w-12 h-12 text-pink-600" />,
      title: '시작할 준비 완료!',
      subtitle: '이제 HiKo와 함께 쇼핑을 시작해보세요',
      description: '가이드 투어를 통해 HiKo의 모든 기능을 익혀보세요. 또는 바로 핫딜 탐색을 시작할 수 있습니다.',
      features: [
        '개인맞춤 추천',
        '찜 목록 관리',
        '주문 내역 추적'
      ]
    }
  ]

  const currentSlideData = slides[currentSlide]
  const isLastSlide = currentSlide === slides.length - 1

  // 자동 슬라이드 진행
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1)
      }
    }, 5000) // 5초마다 자동 진행

    return () => clearTimeout(timer)
  }, [currentSlide, isOpen, slides.length])

  const handleNext = () => {
    if (isLastSlide) {
      onStartTour()
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const handleSlideClick = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="HiKo에 오신 것을 환영합니다"
      size="lg"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <div className="text-center">
        {/* 슬라이드 콘텐츠 */}
        <div className="mb-8">
          {/* 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full">
              {currentSlideData.icon}
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentSlideData.title}
          </h2>
          
          {/* 부제목 */}
          <p className="text-lg text-blue-600 dark:text-blue-400 mb-4">
            {currentSlideData.subtitle}
          </p>

          {/* 설명 */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {currentSlideData.description}
          </p>

          {/* 기능 목록 */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentSlideData.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-sm text-gray-700 dark:text-gray-300"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideClick(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  index === currentSlide
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                )}
                aria-label={`슬라이드 ${index + 1}로 이동`}
              />
            ))}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex items-center justify-between">
          <AccessibleButton
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="flex items-center gap-2"
          >
            이전
          </AccessibleButton>

          <div className="flex items-center gap-3">
            <AccessibleButton
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              건너뛰기
            </AccessibleButton>

            <AccessibleButton
              variant="default"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {isLastSlide ? '가이드 투어 시작' : '다음'}
              <ArrowRight className="w-4 h-4" />
            </AccessibleButton>
          </div>
        </div>

        {/* 언어별 메시지 */}
        {userLanguage !== 'ko' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {userLanguage === 'en' && 'Welcome to HiKo! We help foreigners shop Korean deals easily.'}
              {userLanguage === 'zh' && '欢迎来到HiKo！我们帮助外国人轻松购买韩国优惠商品。'}
              {userLanguage === 'ja' && 'HiKoへようこそ！外国人の韓国ショッピングをサポートします。'}
              {userLanguage === 'vi' && 'Chào mừng đến HiKo! Chúng tôi giúp người nước ngoài mua sắm deals Hàn Quốc.'}
              {userLanguage === 'th' && 'ยินดีต้อนรับสู่ HiKo! เราช่วยชาวต่างชาติซื้อของดีลเกาหลี'}
              {userLanguage === 'mn' && 'HiKo-д тавтай морилно уу! Бид гадаадынхунд солонгос хямдрал худалдаж авахад тусалдаг.'}
              {userLanguage === 'ru' && 'Добро пожаловать в HiKo! Мы помогаем иностранцам покупать корейские товары со скидкой.'}
            </p>
          </div>
        )}

        {/* 키보드 단축키 안내 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            화살표 키로 탐색 | Enter: 다음 | Esc: 건너뛰기
          </p>
        </div>
      </div>
    </AccessibleModal>
  )
}