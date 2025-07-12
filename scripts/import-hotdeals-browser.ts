// 브라우저 환경에서 실행할 스크립트
// 개발자 콘솔에서 실행하세요

async function importLatestHotdeals() {
  const response = await fetch('/api/placeholder/import-hotdeals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath: 'hotdeal-ppomppu-2025-07-12T11-08-55-696Z.json'
    })
  })
  
  const result = await response.json()
  console.log(result)
}

// 실행
importLatestHotdeals()