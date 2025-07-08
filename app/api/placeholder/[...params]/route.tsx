import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// 이미지 프리셋
const presets: Record<string, { width: number; height: number; bg: string; text: string }> = {
  'hero-desktop': { width: 1920, height: 1080, bg: '#FF6B00', text: '히어로 섹션' },
  'hero-tablet': { width: 1024, height: 768, bg: '#FF6B00', text: '히어로 섹션' },
  'hero-mobile': { width: 768, height: 1024, bg: '#FF6B00', text: '히어로 섹션' },
  'hotdeal-thumb': { width: 400, height: 300, bg: '#0066FF', text: '핫딜' },
  'hotdeal-detail': { width: 800, height: 600, bg: '#0066FF', text: '핫딜 상세' },
  'category-icon': { width: 120, height: 120, bg: '#00C896', text: '' },
  'category-banner': { width: 360, height: 200, bg: '#00C896', text: '카테고리' },
  'avatar': { width: 200, height: 200, bg: '#666666', text: '' },
  'og-image': { width: 1200, height: 630, bg: '#FF6F0F', text: 'HiKo' },
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  const params = await context.params
  const [type, ...rest] = params.params
  const preset = presets[type] || presets['hotdeal-thumb']
  
  // 커스텀 파라미터 파싱
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text') || preset.text
  const bg = searchParams.get('bg') || preset.bg
  const width = parseInt(searchParams.get('w') || preset.width.toString())
  const height = parseInt(searchParams.get('h') || preset.height.toString())

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${bg} 0%, ${adjustColor(bg, -30)} 100%)`,
          position: 'relative',
        }}
      >
        {/* 패턴 오버레이 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,.05) 10px,
              rgba(255,255,255,.05) 20px
            )`,
          }}
        />
        
        {/* 메인 텍스트 */}
        {text && (
          <div
            style={{
              fontSize: Math.min(width, height) / 8,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 4px 6px rgba(0,0,0,0.3)',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            {text}
          </div>
        )}
        
        {/* 크기 정보 */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {width}x{height}
        </div>
        
        {/* HiKo 로고 */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            opacity: 0.8,
          }}
        >
          HiKo
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  )
}

function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}