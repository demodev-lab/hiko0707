// 개발 중 인증 상태를 클리어하는 스크립트
// 주의: 이 스크립트는 더 이상 사용되지 않습니다.
// HiKo는 이제 Clerk를 사용하여 인증을 관리합니다.

function clearAuthData() {
  console.log('⚠️  주의: 이 스크립트는 더 이상 사용되지 않습니다!')
  console.log('📝 HiKo는 이제 Clerk를 사용하여 인증을 관리합니다.')
  console.log('🔗 로그아웃하려면 Clerk 대시보드를 사용하거나 앱에서 로그아웃 버튼을 사용하세요.')
  
  // 레거시 데이터 정리 (혹시 남아있을 수 있는 경우를 위해)
  if (typeof localStorage !== 'undefined') {
    // 이전 LocalStorage 기반 인증 데이터 제거
    localStorage.removeItem('currentUser')
    localStorage.removeItem('hiko-auth')
    console.log('✅ 레거시 LocalStorage 인증 데이터가 제거되었습니다.')
  }
  
  console.log('💡 Clerk 인증 정보는 Clerk 자체적으로 관리됩니다.')
}

// Node.js 환경에서 실행될 때만
if (require.main === module) {
  clearAuthData()
}

export { clearAuthData }