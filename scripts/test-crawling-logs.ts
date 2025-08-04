import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase/client'
import type { Database } from '../database.types'

type CrawlingLogInsert = Database['public']['Tables']['crawling_logs']['Insert']
type CrawlingLogRow = Database['public']['Tables']['crawling_logs']['Row']

async function testCrawlingLogs() {
  console.log('🧪 크롤링 로그 시스템 테스트 시작...\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    console.error('환경 변수를 확인해주세요:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
    return
  }

  console.log('✅ Supabase 클라이언트 초기화 성공')

  // 1. crawling_logs 테이블 스키마 확인
  console.log('\n1️⃣ crawling_logs 테이블 스키마 확인')
  const { data: existingLogs, error: schemaError } = await client
    .from('crawling_logs')
    .select('*')
    .limit(1)

  if (schemaError) {
    console.error('❌ crawling_logs 테이블 접근 실패:', schemaError.message)
    return
  }

  console.log('✅ crawling_logs 테이블 접근 성공')
  if (existingLogs && existingLogs.length > 0) {
    console.log('   기존 로그 샘플:', existingLogs[0])
  } else {
    console.log('   기존 로그 없음 (첫 실행)')
  }

  // 2. 크롤링 로그 생성 테스트
  console.log('\n2️⃣ 크롤링 로그 생성 테스트')
  const testLogData: CrawlingLogInsert = {
    source: 'ppomppu',
    status: 'running',
    started_at: new Date().toISOString(),
    items_found: 0,
    items_added: 0,
    items_updated: 0,
    duplicates: 0
  }

  const { data: createdLog, error: createError } = await client
    .from('crawling_logs')
    .insert(testLogData)
    .select()
    .single()

  if (createError || !createdLog) {
    console.error('❌ 크롤링 로그 생성 실패:', createError)
    return
  }

  console.log('✅ 크롤링 로그 생성 성공!')
  console.log('   로그 ID:', createdLog.id)
  console.log('   소스:', createdLog.source)
  console.log('   상태:', createdLog.status)
  console.log('   시작 시간:', createdLog.started_at)

  // 3. 크롤링 로그 업데이트 테스트 (완료 처리)
  console.log('\n3️⃣ 크롤링 로그 업데이트 테스트')
  const completedAt = new Date()
  const startedAt = new Date(createdLog.started_at)
  const durationMs = completedAt.getTime() - startedAt.getTime()

  const { data: updatedLog, error: updateError } = await client
    .from('crawling_logs')
    .update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      items_found: 25,
      items_added: 15,
      items_updated: 5,
      duplicates: 5
    })
    .eq('id', createdLog.id)
    .select()
    .single()

  if (updateError || !updatedLog) {
    console.error('❌ 크롤링 로그 업데이트 실패:', updateError)
    return
  }

  console.log('✅ 크롤링 로그 업데이트 성공!')
  console.log('   상태:', updatedLog.status)
  console.log('   완료 시간:', updatedLog.completed_at)
  console.log('   소요 시간:', updatedLog.duration_ms, 'ms')
  console.log('   발견 아이템:', updatedLog.items_found)
  console.log('   추가 아이템:', updatedLog.items_added)
  console.log('   업데이트 아이템:', updatedLog.items_updated)
  console.log('   중복 아이템:', updatedLog.duplicates)

  // 4. 에러 로그 테스트
  console.log('\n4️⃣ 에러 로그 테스트')
  const errorLogData: CrawlingLogInsert = {
    source: 'ruliweb',
    status: 'failed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: 5000,
    items_found: 0,
    items_added: 0,
    items_updated: 0,
    duplicates: 0,
    error_message: '테스트 에러: 네트워크 연결 실패',
    error_details: {
      code: 'NETWORK_ERROR',
      url: 'https://bbs.ruliweb.com/market/board/1020',
      stack: 'Error at testCrawler line 123'
    }
  }

  const { data: errorLog, error: errorCreateError } = await client
    .from('crawling_logs')
    .insert(errorLogData)
    .select()
    .single()

  if (errorCreateError || !errorLog) {
    console.error('❌ 에러 로그 생성 실패:', errorCreateError)
    return
  }

  console.log('✅ 에러 로그 생성 성공!')
  console.log('   로그 ID:', errorLog.id)
  console.log('   상태:', errorLog.status)
  console.log('   에러 메시지:', errorLog.error_message)
  console.log('   에러 상세:', errorLog.error_details)

  // 5. 로그 목록 조회 테스트
  console.log('\n5️⃣ 로그 목록 조회 테스트')
  const { data: allLogs, error: listError } = await client
    .from('crawling_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5)

  if (listError) {
    console.error('❌ 로그 목록 조회 실패:', listError)
    return
  }

  console.log(`✅ 최근 ${allLogs?.length || 0}개 로그 조회 성공!`)
  allLogs?.forEach((log, index) => {
    console.log(`   ${index + 1}. [${log.source}] ${log.status} - ${log.started_at}`)
  })

  // 6. 특정 소스별 통계 조회 테스트
  console.log('\n6️⃣ 소스별 통계 조회 테스트')
  const { data: ppomppuLogs, error: statsError } = await client
    .from('crawling_logs')
    .select('status, items_added, items_updated, duplicates')
    .eq('source', 'ppomppu')
    .eq('status', 'completed')

  if (statsError) {
    console.error('❌ 통계 조회 실패:', statsError)
  } else {
    const totalAdded = ppomppuLogs?.reduce((sum, log) => sum + (log.items_added || 0), 0) || 0
    const totalUpdated = ppomppuLogs?.reduce((sum, log) => sum + (log.items_updated || 0), 0) || 0
    const totalDuplicates = ppomppuLogs?.reduce((sum, log) => sum + (log.duplicates || 0), 0) || 0
    
    console.log('✅ 뽐뿌 크롤링 통계:')
    console.log(`   완료된 크롤링: ${ppomppuLogs?.length || 0}회`)
    console.log(`   총 추가 아이템: ${totalAdded}개`)
    console.log(`   총 업데이트 아이템: ${totalUpdated}개`)
    console.log(`   총 중복 아이템: ${totalDuplicates}개`)
  }

  // 7. 정리 - 테스트 데이터 삭제
  console.log('\n7️⃣ 테스트 데이터 정리')
  const testLogIds = [createdLog.id, errorLog.id]
  
  const { error: cleanupError } = await client
    .from('crawling_logs')
    .delete()
    .in('id', testLogIds)

  if (cleanupError) {
    console.error('❌ 테스트 데이터 정리 실패:', cleanupError)
  } else {
    console.log('✅ 테스트 데이터 정리 완료')
  }

  console.log('\n✅ 크롤링 로그 시스템 테스트 완료!')
}

// 스크립트 실행
testCrawlingLogs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('테스트 중 오류 발생:', error)
    process.exit(1)
  })