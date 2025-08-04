import { NextRequest, NextResponse } from 'next/server'

/**
 * 이미지 프록시 API - 허용되지 않은 도메인의 이미지를 프록시로 제공
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  const width = searchParams.get('w')
  const height = searchParams.get('h')
  const quality = searchParams.get('q')

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 }
    )
  }

  try {
    // URL 유효성 검사
    const url = new URL(imageUrl)
    
    // 로컬 URL 차단
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.')) {
      return NextResponse.json(
        { error: 'Local URLs are not allowed' },
        { status: 403 }
      )
    }

    // 이미지 fetch
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'HiKo-ImageProxy/1.0',
        'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=3600',
      },
      // 10초 타임아웃
      signal: AbortSignal.timeout(10000)
    })

    if (!imageResponse.ok) {
      console.warn('이미지 프록시 fetch 실패:', imageUrl, imageResponse.status)
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      )
    }

    // Content-Type 검증
    const contentType = imageResponse.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // 이미지 데이터 읽기
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // 파일 크기 제한 (10MB)
    if (imageBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      )
    }

    // 응답 헤더 설정
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400') // 24시간 캐시
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('X-Proxy-Cache', 'MISS')
    
    // 이미지 최적화 파라미터가 있으면 헤더에 추가
    if (width || height || quality) {
      headers.set('X-Image-Optimized', 'true')
      if (width) headers.set('X-Requested-Width', width)
      if (height) headers.set('X-Requested-Height', height)
      if (quality) headers.set('X-Requested-Quality', quality)
    }

    // 원본 서버의 캐시 헤더 활용
    const originalCacheControl = imageResponse.headers.get('cache-control')
    const originalEtag = imageResponse.headers.get('etag')
    const originalLastModified = imageResponse.headers.get('last-modified')

    if (originalEtag) headers.set('ETag', originalEtag)
    if (originalLastModified) headers.set('Last-Modified', originalLastModified)

    return new NextResponse(imageBuffer, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('이미지 프록시 오류:', error)
    
    // 타임아웃 에러
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      )
    }

    // 네트워크 에러
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Network error' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// HEAD 요청 지원 (이미지 메타데이터만 필요한 경우)
export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const url = new URL(imageUrl)
    
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.')) {
      return new NextResponse(null, { status: 403 })
    }

    const imageResponse = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'HiKo-ImageProxy/1.0',
      },
      signal: AbortSignal.timeout(5000)
    })

    const headers = new Headers()
    const contentType = imageResponse.headers.get('content-type')
    const contentLength = imageResponse.headers.get('content-length')

    if (contentType) headers.set('Content-Type', contentType)
    if (contentLength) headers.set('Content-Length', contentLength)
    
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(null, {
      status: imageResponse.status,
      headers
    })

  } catch (error) {
    console.error('이미지 프록시 HEAD 오류:', error)
    return new NextResponse(null, { status: 500 })
  }
}

// OPTIONS 요청 지원 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}