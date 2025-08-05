import { atom } from 'jotai'
import { User } from '@/types/user'

// 로컬 스토리지에서 사용자 정보를 가져오는 함수
const getUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

// 로컬 스토리지에 사용자 정보를 저장하는 함수
const setUserToStorage = (user: User | null) => {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('currentUser')
    }
  } catch {
    // 로컬 스토리지 오류 무시
  }
}

// 초기값은 항상 null로 설정 (SSR 호환성을 위해)
// 클라이언트에서는 useAuth 훅의 useEffect에서 로컬스토리지에서 가져옴
export const currentUserAtom = atom<User | null>(null)

// 사용자 상태 변경 시 로컬 스토리지에도 저장
export const setCurrentUserAtom = atom(
  null,
  (get, set, user: User | null) => {
    set(currentUserAtom, user)
    setUserToStorage(user)
  }
)

export const isAuthenticatedAtom = atom((get) => get(currentUserAtom) !== null)
// 초기 로딩 상태를 true로 설정하여 하이드레이션 문제 방지
export const isLoadingAuthAtom = atom(true)