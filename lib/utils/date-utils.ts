/**
 * 한국어 상대적 시간 표시 유틸리티
 * 24시간 이내: "0분전", "1시간전" 등
 * 1-3일: "어제", "그저께"
 * 3일 이후: "3월 15일" 형태
 */
export function getRelativeTimeKorean(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  
  // 시간 차이 계산 (밀리초)
  const timeDiff = now.getTime() - targetDate.getTime()
  
  // 밀리초를 분/시간/일로 변환
  const minutes = Math.floor(timeDiff / (1000 * 60))
  const hours = Math.floor(timeDiff / (1000 * 60 * 60))
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  
  // 1분 이내
  if (minutes < 1) {
    return '방금전'
  }
  
  // 1시간 이내
  if (minutes < 60) {
    return `${minutes}분전`
  }
  
  // 24시간 이내
  if (hours < 24) {
    return `${hours}시간전`
  }
  
  // 1일 (어제)
  if (days === 1) {
    return '어제'
  }
  
  // 2일 (그저께)
  if (days === 2) {
    return '그저께'
  }
  
  // 3일 이후는 날짜로 표시
  if (days >= 3) {
    return targetDate.toLocaleDateString('ko-KR', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  }
  
  // 기본값 (혹시 모를 경우)
  return targetDate.toLocaleDateString('ko-KR', { 
    month: 'numeric', 
    day: 'numeric' 
  })
}

/**
 * 짧은 형태의 상대적 시간 (모바일용)
 */
export function getRelativeTimeKoreanShort(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  
  const timeDiff = now.getTime() - targetDate.getTime()
  const minutes = Math.floor(timeDiff / (1000 * 60))
  const hours = Math.floor(timeDiff / (1000 * 60 * 60))
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분`
  if (hours < 24) return `${hours}시간`
  if (days === 1) return '어제'
  if (days === 2) return '그저께'
  
  return targetDate.toLocaleDateString('ko-KR', { 
    month: 'numeric', 
    day: 'numeric' 
  })
}