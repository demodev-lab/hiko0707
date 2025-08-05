/**
 * @deprecated 이 파일은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: auth-store.ts는 LocalStorage 기반 인증 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 시스템:
 * - Clerk: 인증 및 세션 관리
 * - Supabase: 사용자 데이터 저장
 * 
 * 📋 사용할 훅들:
 * - useClerkRole() - 인증 상태 및 역할 확인
 * - useSupabaseUser() - 사용자 정보 및 프로필 관리
 * - useClerk().signOut() - 로그아웃
 * 
 * 이 파일은 Phase 3에서 완전히 제거되었습니다.
 */

import { atom } from 'jotai'

// Deprecated atoms - DO NOT USE
export const currentUserAtom = atom<null>(null)
export const setCurrentUserAtom = atom(null, () => {
  console.error('❌ auth-store.ts is deprecated! Use useClerkRole() and useSupabaseUser() instead')
})
export const isAuthenticatedAtom = atom(() => {
  console.error('❌ auth-store.ts is deprecated! Use useClerkRole().isAuthenticated instead')
  return false
})
export const isLoadingAuthAtom = atom(false)