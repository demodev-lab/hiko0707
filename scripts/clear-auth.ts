// 개발 중 인증 상태를 클리어하는 스크립트
import { LocalStorage } from '../lib/db/storage'

function clearAuthData() {
  console.log('🧹 인증 데이터 클리어 중...')
  
  const storage = LocalStorage.getInstance()
  
  // localStorage에서 현재 사용자 정보 제거
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('currentUser')
    console.log('✅ localStorage에서 currentUser 제거됨')
  }
  
  // 다른 인증 관련 데이터도 클리어
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
    console.log('✅ sessionStorage 클리어됨')
  }
  
  console.log('🎉 인증 데이터 클리어 완료!')
  console.log('이제 브라우저를 새로고침하면 로그아웃 상태가 됩니다.')
}

// Node.js 환경에서 실행될 때만
if (require.main === module) {
  clearAuthData()
}

export { clearAuthData }