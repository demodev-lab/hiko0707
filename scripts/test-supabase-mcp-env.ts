import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load environment variables
dotenv.config()

console.log('=== Supabase MCP 환경 변수 확인 ===\n')

// 1. .env 파일에서 로드된 환경 변수
console.log('📄 .env 파일에서 로드된 값:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...')
console.log('   SUPABASE_ACCESS_TOKEN:', process.env.SUPABASE_ACCESS_TOKEN)
console.log('   SUPABASE_DATABASE_PASSWORD:', process.env.SUPABASE_DATABASE_PASSWORD)

// 2. .mcp.json 파일 내용
console.log('\n📋 .mcp.json 파일 내용:')
try {
  const mcpConfig = require('../.mcp.json')
  console.log(JSON.stringify(mcpConfig.mcpServers.supabase, null, 2))
} catch (err) {
  console.error('   .mcp.json 파일을 읽을 수 없습니다:', err)
}

// 3. MCP 서버 상태 확인
console.log('\n🔌 MCP 서버 상태:')
try {
  const mcpStatus = execSync('claude mcp get supabase', { encoding: 'utf-8' })
  console.log(mcpStatus)
} catch (err) {
  console.error('   MCP 상태를 확인할 수 없습니다:', err)
}

// 4. 권장 설정
console.log('\n💡 권장 설정:')
console.log('1. .mcp.json의 SUPABASE_ACCESS_TOKEN이 올바른지 확인')
console.log('2. 프로젝트 참조(project-ref)가 URL과 일치하는지 확인')
console.log('3. MCP 서버가 --read-only 모드로 실행 중 (쓰기 작업은 제한됨)')

// 5. 환경 변수 export 스크립트 생성
console.log('\n📝 환경 변수 export 스크립트 생성 중...')
const exportScript = `#!/bin/bash
# Supabase 환경 변수 설정 스크립트

export NEXT_PUBLIC_SUPABASE_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
export SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY}"
export SUPABASE_ACCESS_TOKEN="${process.env.SUPABASE_ACCESS_TOKEN}"
export SUPABASE_DATABASE_PASSWORD="${process.env.SUPABASE_DATABASE_PASSWORD}"

echo "✅ Supabase 환경 변수가 설정되었습니다."
`

try {
  require('fs').writeFileSync('./scripts/export-supabase-env.sh', exportScript, { mode: 0o755 })
  console.log('   ✅ scripts/export-supabase-env.sh 파일이 생성되었습니다.')
  console.log('   사용법: source scripts/export-supabase-env.sh')
} catch (err) {
  console.error('   ❌ 스크립트 생성 실패:', err)
}