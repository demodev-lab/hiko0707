'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Kakao?: any
  }
}

export function KakaoProvider({ children }: { children: React.ReactNode }) {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false)
  
  useEffect(() => {
    if (isKakaoLoaded && window.Kakao && !window.Kakao.isInitialized()) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY
      if (kakaoKey) {
        window.Kakao.init(kakaoKey)
        console.log('Kakao SDK initialized')
      }
    }
  }, [isKakaoLoaded])
  
  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setIsKakaoLoaded(true)
        }}
      />
      {children}
    </>
  )
}