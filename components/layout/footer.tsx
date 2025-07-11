'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 뉴스레터 구독 로직 구현
    console.log('Newsletter subscription:', email)
    setEmail('')
    alert('뉴스레터 구독이 완료되었습니다!')
  }

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      {/* 메인 푸터 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                HiKo
              </h2>
              <p className="text-gray-300 mt-2">
                한국 거주 외국인을 위한<br />
                핫딜 쇼핑 도우미
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>서울특별시 강남구 테헤란로</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>02-1234-5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@hiko.kr</span>
              </div>
            </div>
          </div>

          {/* 서비스 링크 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">서비스</h3>
            <div className="space-y-2">
              <Link href="/hotdeals" className="block text-gray-300 hover:text-white transition-colors">
                핫딜 보기
              </Link>
              <Link href="/order" className="block text-gray-300 hover:text-white transition-colors">
                대리 구매
              </Link>
              <Link href="/dashboard" className="block text-gray-300 hover:text-white transition-colors">
                대시보드
              </Link>
              <Link href="/tracking" className="block text-gray-300 hover:text-white transition-colors">
                배송 추적
              </Link>
            </div>
          </div>

          {/* 고객 지원 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">고객 지원</h3>
            <div className="space-y-2">
              <Link href="/help" className="block text-gray-300 hover:text-white transition-colors">
                도움말
              </Link>
              <Link href="/faq" className="block text-gray-300 hover:text-white transition-colors">
                자주 묻는 질문
              </Link>
              <Link href="/contact" className="block text-gray-300 hover:text-white transition-colors">
                문의하기
              </Link>
              <Link href="/terms" className="block text-gray-300 hover:text-white transition-colors">
                이용약관
              </Link>
              <Link href="/privacy" className="block text-gray-300 hover:text-white transition-colors">
                개인정보처리방침
              </Link>
            </div>
          </div>

          {/* 뉴스레터 구독 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">뉴스레터</h3>
            <p className="text-gray-300 text-sm">
              최신 핫딜 정보를 이메일로 받아보세요
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                required
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                구독하기
              </Button>
            </form>
            
            {/* 소셜 미디어 링크 */}
            <div className="flex space-x-4 pt-2">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* 하단 저작권 */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              © 2025 HiKo. All rights reserved.
            </div>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <Link href="/terms" className="hover:text-white transition-colors">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">
                사이트맵
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}