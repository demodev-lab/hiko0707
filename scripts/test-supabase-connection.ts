#!/usr/bin/env tsx

import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config()

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...')
  
  // 환경 변수 확인
  console.log('\n📋 환경 변수 확인:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 누락')
  console.log('USE_SUPABASE:', process.env.USE_SUPABASE)

  try {
    // Admin 클라이언트로 테이블 목록 조회
    console.log('\n🔧 Admin 클라이언트 테스트...')
    const adminClient = supabaseAdmin()
    
    if (!adminClient) {
      console.log('❌ Admin 클라이언트 초기화 실패')
      return
    }

    // 테이블 목록 조회
    const { data: tables, error: tablesError } = await adminClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10)

    if (tablesError) {
      console.log('❌ 테이블 목록 조회 실패:', tablesError.message)
    } else {
      console.log('✅ 테이블 목록 조회 성공:')
      tables?.forEach(table => console.log('  -', table.table_name))
    }

    // hotdeals 테이블 확인
    console.log('\n📊 hotdeals 테이블 확인...')
    const { data: hotdeals, error: hotdealsError } = await adminClient
      .from('hotdeals')
      .select('id, title, source')
      .limit(5)

    if (hotdealsError) {
      console.log('❌ hotdeals 테이블 접근 실패:', hotdealsError.message)
    } else {
      console.log(`✅ hotdeals 테이블 접근 성공 (${hotdeals?.length || 0}개 항목 확인)`)
      hotdeals?.forEach(deal => console.log(`  - ${deal.title?.substring(0, 50)}...`))
    }

    // 일반 클라이언트 테스트
    console.log('\n👤 일반 클라이언트 테스트...')
    const client = supabase()
    const { data: publicData, error: publicError } = await client
      .from('hotdeals')
      .select('id, title')
      .limit(3)

    if (publicError) {
      console.log('❌ 일반 클라이언트 접근 실패:', publicError.message)
    } else {
      console.log(`✅ 일반 클라이언트 접근 성공 (${publicData?.length || 0}개 항목 확인)`)
    }

  } catch (error) {
    console.log('❌ 연결 테스트 중 오류 발생:', error)
  }

  console.log('\n🎯 Supabase 연결 테스트 완료!')
}

// 실행
testSupabaseConnection()