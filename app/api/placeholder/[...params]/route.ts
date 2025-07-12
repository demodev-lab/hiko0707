import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ params: string[] }> }
) {
  const params = await props.params
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || 'No Image'
    const bg = searchParams.get('bg') || '#f3f4f6'
    const color = searchParams.get('color') || '#6b7280'
    const width = parseInt(searchParams.get('width') || '400')
    const height = parseInt(searchParams.get('height') || '300')

    // SVG placeholder 생성
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}"/>
        <rect x="20%" y="20%" width="60%" height="60%" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5,5" rx="8"/>
        <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="${color}" text-anchor="middle" dy="0.3em">
          ${text.length > 20 ? text.substring(0, 20) + '...' : text}
        </text>
        <circle cx="40%" cy="35%" r="6" fill="${color}" opacity="0.3"/>
      </svg>
    `

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Placeholder image error:', error)
    
    // 기본 SVG 반환
    const defaultSvg = `
      <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="80" y="60" width="240" height="180" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="5,5" rx="8"/>
        <text x="200" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#6b7280" text-anchor="middle" dy="0.3em">
          이미지 없음
        </text>
        <circle cx="160" cy="105" r="6" fill="#6b7280" opacity="0.3"/>
      </svg>
    `
    
    return new NextResponse(defaultSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}