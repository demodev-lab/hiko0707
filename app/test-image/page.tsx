'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function TestImagePage() {
  const [imageStatus, setImageStatus] = useState<{[key: string]: string}>({})
  
  const testImages = [
    '/images/products/home/home_1_original.jpg',
    '/images/products/electronics/electronics_1_original.jpg',
    '/images/products/food/food_1_original.jpg'
  ]

  const handleImageLoad = (src: string) => {
    setImageStatus(prev => ({ ...prev, [src]: 'loaded' }))
    console.log('✅ Test image loaded:', src)
  }

  const handleImageError = (src: string) => {
    setImageStatus(prev => ({ ...prev, [src]: 'error' }))
    console.log('❌ Test image failed:', src)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">이미지 로딩 테스트</h1>
      
      <div className="grid gap-6">
        {testImages.map((src, index) => (
          <div key={index} className="border p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">테스트 이미지 {index + 1}</h2>
            <p className="text-sm text-gray-600 mb-2">경로: {src}</p>
            <p className="text-sm mb-4">
              상태: <span className={`font-bold ${
                imageStatus[src] === 'loaded' ? 'text-green-600' : 
                imageStatus[src] === 'error' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {imageStatus[src] || 'loading...'}
              </span>
            </p>
            
            {/* Next.js Image 컴포넌트 테스트 */}
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Next.js Image (최적화)</h3>
              <div className="w-64 h-48 bg-gray-100 relative">
                <Image
                  src={src}
                  alt={`Test image ${index + 1}`}
                  fill
                  className="object-cover"
                  onLoad={() => handleImageLoad(`${src}-nextjs`)}
                  onError={() => handleImageError(`${src}-nextjs`)}
                />
              </div>
            </div>
            
            {/* 일반 img 태그 테스트 */}
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">일반 img 태그</h3>
              <div className="w-64 h-48 bg-gray-100">
                <img
                  src={src}
                  alt={`Test image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(`${src}-img`)}
                  onError={() => handleImageError(`${src}-img`)}
                />
              </div>
            </div>
            
            {/* unoptimized Next.js Image 테스트 */}
            <div>
              <h3 className="text-md font-medium mb-2">Next.js Image (unoptimized)</h3>
              <div className="w-64 h-48 bg-gray-100 relative">
                <Image
                  src={src}
                  alt={`Test image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onLoad={() => handleImageLoad(`${src}-unopt`)}
                  onError={() => handleImageError(`${src}-unopt`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}