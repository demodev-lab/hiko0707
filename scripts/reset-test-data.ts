#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { supabaseAdmin } from '@/lib/supabase/client'
import chalk from 'chalk'

dotenv.config()

async function resetTestData() {
  const supabase = supabaseAdmin()
  if (!supabase) {
    console.error(chalk.red('❌ Supabase 클라이언트 초기화 실패'))
    process.exit(1)
  }

  try {
    console.log(chalk.blue('🔄 테스트 데이터 정리 시작'))
    
    // 만료된 핫딜들을 다시 활성화
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후
    const { data, error } = await supabase
      .from('hot_deals')
      .update({ 
        status: 'active', 
        end_date: futureDate,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'ended')
      .select('id, title')

    if (error) {
      throw new Error(`정리 실패: ${error.message}`)
    }

    console.log(chalk.green(`✅ ${data.length}개 핫딜을 다시 활성화했습니다`))
    
    // 최종 통계 확인
    const { count } = await supabase
      .from('hot_deals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    console.log(chalk.cyan(`📊 현재 활성 핫딜: ${count}개`))

  } catch (error) {
    console.error(chalk.red('❌ 정리 실패:'), error)
    process.exit(1)
  }
}

resetTestData()