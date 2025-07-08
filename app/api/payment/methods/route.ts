import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'

// 사용 가능한 결제 방법 조회 API
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 통화 정보 등을 받을 수 있음
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency') || 'KRW'
    const amount = searchParams.get('amount')

    // 결제 방법 목록 조회
    const paymentMethods = await paymentService.getAvailablePaymentMethods()

    // 통화에 따른 필터링
    const filteredMethods = paymentMethods.filter(method => 
      method.supportedCurrencies.includes(currency)
    )

    // 금액에 따른 필터링 (최소/최대 금액 체크)
    const finalMethods = amount ? filteredMethods.filter(method => {
      const numAmount = parseInt(amount)
      if (isNaN(numAmount)) return true
      
      if (method.minAmount && numAmount < method.minAmount) return false
      if (method.maxAmount && numAmount > method.maxAmount) return false
      
      return true
    }) : filteredMethods

    // 응답 데이터 정리 (민감한 정보 제외)
    const safeMethods = finalMethods.map(method => ({
      id: method.id,
      provider: method.provider,
      name: method.name,
      description: method.description,
      isActive: method.isActive,
      supportedCurrencies: method.supportedCurrencies,
      minAmount: method.minAmount,
      maxAmount: method.maxAmount,
      processingTimeMinutes: method.processingTimeMinutes,
      fees: method.fees
    }))

    return NextResponse.json({
      success: true,
      currency,
      amount: amount ? parseInt(amount) : null,
      methods: safeMethods,
      total: safeMethods.length
    })

  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch payment methods' 
      }, 
      { status: 500 }
    )
  }
}

// POST 요청으로 특정 조건에 맞는 결제 방법 검색
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currency = 'KRW', amount, userLocation, preferredProviders } = body

    // 모든 결제 방법 조회
    const allMethods = await paymentService.getAvailablePaymentMethods()

    // 필터링 로직
    let filteredMethods = allMethods.filter(method => method.isActive)

    // 통화 필터링
    filteredMethods = filteredMethods.filter(method => 
      method.supportedCurrencies.includes(currency)
    )

    // 금액 필터링
    if (amount) {
      filteredMethods = filteredMethods.filter(method => {
        if (method.minAmount && amount < method.minAmount) return false
        if (method.maxAmount && amount > method.maxAmount) return false
        return true
      })
    }

    // 사용자 위치 기반 필터링 (예: 한국 사용자에게는 한국 결제 방법 우선)
    if (userLocation === 'KR') {
      // 한국 결제 방법을 상위에 배치
      const koreanMethods = filteredMethods.filter(method => 
        ['kakao_pay', 'naver_pay', 'toss_pay', 'bank_transfer'].includes(method.provider)
      )
      const otherMethods = filteredMethods.filter(method => 
        !['kakao_pay', 'naver_pay', 'toss_pay', 'bank_transfer'].includes(method.provider)
      )
      filteredMethods = [...koreanMethods, ...otherMethods]
    }

    // 선호 결제 방법 우선 정렬
    if (preferredProviders && Array.isArray(preferredProviders)) {
      const preferredMethods = filteredMethods.filter(method => 
        preferredProviders.includes(method.provider)
      )
      const otherMethods = filteredMethods.filter(method => 
        !preferredProviders.includes(method.provider)
      )
      filteredMethods = [...preferredMethods, ...otherMethods]
    }

    // 응답 데이터 정리
    const safeMethods = filteredMethods.map(method => ({
      id: method.id,
      provider: method.provider,
      name: method.name,
      description: method.description,
      isActive: method.isActive,
      supportedCurrencies: method.supportedCurrencies,
      minAmount: method.minAmount,
      maxAmount: method.maxAmount,
      processingTimeMinutes: method.processingTimeMinutes,
      fees: method.fees
    }))

    return NextResponse.json({
      success: true,
      filters: {
        currency,
        amount,
        userLocation,
        preferredProviders
      },
      methods: safeMethods,
      total: safeMethods.length
    })

  } catch (error) {
    console.error('Error searching payment methods:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search payment methods' 
      }, 
      { status: 500 }
    )
  }
}

// 기타 메서드는 허용하지 않음
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}