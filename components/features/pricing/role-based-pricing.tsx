'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Crown } from 'lucide-react'
import { RoleBasedContent, ShowForRole } from '@/components/auth/role-based-content'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function RoleBasedPricing() {
  const { currentUser } = useAuth()
  
  const plans = [
    {
      role: 'guest',
      name: '게스트',
      price: '무료',
      description: '기본 핫딜 보기',
      icon: Star,
      features: [
        '핫딜 목록 보기',
        '핫딜 상세 정보',
        '기본 검색 기능',
        '회원가입 필요'
      ],
      cta: '회원가입',
      href: '/register'
    },
    {
      role: 'member',
      name: '멤버',
      price: '무료',
      description: '모든 기본 기능',
      icon: Check,
      features: [
        '핫딜 찜하기',
        '댓글 작성',
        '대리구매 주문',
        '알림 설정',
        '주문 내역 확인'
      ],
      cta: '현재 플랜',
      href: '/mypage',
      current: currentUser?.role === 'member'
    },
    {
      role: 'admin',
      name: '관리자',
      price: '특별',
      description: '모든 관리 기능',
      icon: Crown,
      features: [
        '모든 멤버 기능',
        '사용자 관리',
        '핫딜 관리',
        '주문 관리',
        '통계 대시보드',
        '시스템 설정'
      ],
      cta: '관리자 페이지',
      href: '/admin',
      current: currentUser?.role === 'admin'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const Icon = plan.icon
        const isCurrent = plan.current
        
        return (
          <Card 
            key={plan.role} 
            className={cn(
              "relative transition-all duration-200",
              isCurrent && "ring-2 ring-primary shadow-lg"
            )}
          >
            {isCurrent && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                현재 플랜
              </Badge>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{plan.price}</span>
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Link href={plan.href} className="w-full">
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

// 역할별 다른 가격 표시
export function RoleBasedPriceDisplay({ basePrice }: { basePrice: number }) {
  return (
    <RoleBasedContent
      guest={
        <div className="space-y-1">
          <div className="text-2xl font-bold">₩{basePrice.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">회원가입 시 할인 혜택</p>
        </div>
      }
      member={
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-600">
            ₩{Math.round(basePrice * 0.95).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">멤버 5% 할인 적용</p>
        </div>
      }
      admin={
        <div className="space-y-1">
          <div className="text-2xl font-bold text-blue-600">
            ₩{Math.round(basePrice * 0.9).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">관리자 10% 할인 적용</p>
        </div>
      }
    />
  )
}