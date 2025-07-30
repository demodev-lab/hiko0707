import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 관리자 전용 라우트 정의
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// 공개 라우트 정의 (로그인 없이 접근 가능)
const isPublicRoute = createRouteMatcher([
  '/',
  '/hotdeals(.*)',
  '/search(.*)',
  '/about',
  '/contact',
  '/api/public(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth()
  
  // 관리자 페이지 접근 시 체크
  if (isAdminRoute(req)) {
    // 로그인하지 않은 경우
    if (!authObject.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Private Metadata는 서버 사이드에서 별도로 확인해야 함
    // middleware에서는 sessionClaims를 통해 확인 불가능하므로
    // 각 admin 페이지에서 checkRole 함수로 검증
  }
  
  // 비공개 라우트는 로그인 필요
  if (!isPublicRoute(req) && !authObject.userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}