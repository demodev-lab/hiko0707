import { supabaseAdmin } from '@/lib/supabase/client'
import chalk from 'chalk'

export interface ExpiryStats {
  totalChecked: number
  expired: number
  expiringSoon: number
  errors: number
  processingTime: number
}

export interface ExpiryConfig {
  batchSize?: number
  warningHours?: number // 만료 예정 알림 기준 (시간)
  dryRun?: boolean
}

/**
 * 핫딜 만료 자동 관리 서비스
 * - 만료된 핫딜 상태를 'ended'로 업데이트
 * - 만료 예정 핫딜 식별
 * - 배치 처리로 성능 최적화
 */
export class HotDealExpiryService {
  private static readonly DEFAULT_CONFIG: Required<ExpiryConfig> = {
    batchSize: 500,
    warningHours: 24,
    dryRun: false
  }

  /**
   * 만료된 핫딜들을 자동으로 처리합니다
   */
  static async processExpiredDeals(config: ExpiryConfig = {}): Promise<ExpiryStats> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    const startTime = Date.now()
    
    const stats: ExpiryStats = {
      totalChecked: 0,
      expired: 0,
      expiringSoon: 0,
      errors: 0,
      processingTime: 0
    }

    try {
      // 1. 전체 활성 핫딜 개수 확인
      const { count: totalCount, error: countError } = await supabase
        .from('hot_deals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      if (countError) {
        throw new Error(`활성 핫딜 개수 조회 실패: ${countError.message}`)
      }

      console.log(chalk.cyan(`📊 총 ${totalCount}개의 활성 핫딜을 확인합니다`))
      if (finalConfig.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN 모드: 실제 업데이트는 하지 않습니다'))
      }

      // 2. 배치 단위로 처리
      const totalBatches = Math.ceil((totalCount || 0) / finalConfig.batchSize)
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const startIndex = batch * finalConfig.batchSize
        const endIndex = startIndex + finalConfig.batchSize - 1

        console.log(chalk.gray(`배치 ${batch + 1}/${totalBatches} 처리 중...`))

        // 배치 데이터 조회 (만료 상태 계산 포함)
        const { data: hotdeals, error: batchError } = await supabase
          .from('hot_deals')
          .select('id, title, end_date, status')
          .eq('status', 'active')
          .range(startIndex, endIndex)
          .order('end_date', { ascending: true })

        if (batchError) {
          console.error(chalk.red(`배치 ${batch + 1} 조회 실패:`, batchError.message))
          stats.errors += finalConfig.batchSize
          continue
        }

        // 각 핫딜 처리
        for (const hotdeal of hotdeals || []) {
          try {
            stats.totalChecked++
            
            const now = new Date()
            const endDate = new Date(hotdeal.end_date)
            const hoursUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            // 만료된 경우
            if (hoursUntilExpiry <= 0) {
              stats.expired++
              
              if (!finalConfig.dryRun) {
                const { error: updateError } = await supabase
                  .from('hot_deals')
                  .update({ 
                    status: 'ended',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', hotdeal.id)

                if (updateError) {
                  throw new Error(`업데이트 실패: ${updateError.message}`)
                }
              }

              if (stats.expired % 10 === 0) {
                console.log(chalk.yellow(`  ⏰ ${stats.expired}개 만료됨`))
              }
            }
            // 만료 예정인 경우
            else if (hoursUntilExpiry <= finalConfig.warningHours) {
              stats.expiringSoon++
              
              if (stats.expiringSoon % 20 === 0) {
                console.log(chalk.blue(`  ⚠️  ${stats.expiringSoon}개 만료 예정`))
              }
            }

          } catch (error) {
            stats.errors++
            console.error(chalk.red(`핫딜 ${hotdeal.id} 처리 실패:`, error))
          }
        }

        // 배치 간 짧은 대기 (DB 부하 방지)
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      stats.processingTime = Date.now() - startTime
      
      console.log(chalk.green('✅ 만료 처리 완료'))
      
    } catch (error) {
      console.error(chalk.red('❌ 만료 처리 실패:'), error)
      throw error
    }

    return stats
  }

  /**
   * 만료 예정 핫딜 목록을 조회합니다
   */
  static async getExpiringSoonDeals(hours: number = 24, limit: number = 50) {
    const supabase = supabaseAdmin()
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }

    try {
      const { data, error } = await supabase
        .from('hot_deals')
        .select('id, title, category, end_date, views, like_count')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .lte('end_date', new Date(Date.now() + hours * 60 * 60 * 1000).toISOString())
        .order('end_date', { ascending: true })
        .limit(limit)

      if (error) {
        throw new Error(`만료 예정 핫딜 조회 실패: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('만료 예정 핫딜 조회 실패:', error)
      return []
    }
  }

  /**
   * 만료 통계를 조회합니다
   */
  static async getExpiryStatistics() {
    const supabase = supabaseAdmin()
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }

    try {
      const [
        activeResult,
        endedResult,
        expiringSoonResult,
        expiredTodayResult
      ] = await Promise.all([
        // 활성 핫딜
        supabase
          .from('hot_deals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // 만료된 핫딜
        supabase
          .from('hot_deals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ended'),
        
        // 24시간 내 만료 예정
        supabase
          .from('hot_deals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .lte('end_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
        
        // 오늘 만료된 핫딜
        supabase
          .from('hot_deals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ended')
          .gte('updated_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ])

      return {
        active: activeResult.count || 0,
        ended: endedResult.count || 0,
        expiringSoon: expiringSoonResult.count || 0,
        expiredToday: expiredTodayResult.count || 0
      }
    } catch (error) {
      console.error('만료 통계 조회 실패:', error)
      return {
        active: 0,
        ended: 0,
        expiringSoon: 0,
        expiredToday: 0
      }
    }
  }

  /**
   * 핫딜의 만료 시간을 연장합니다
   */
  static async extendExpiry(hotdealId: string, additionalHours: number = 24): Promise<boolean> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }

    try {
      // 현재 핫딜 정보 조회
      const { data: hotdeal, error: fetchError } = await supabase
        .from('hot_deals')
        .select('id, title, end_date, status')
        .eq('id', hotdealId)
        .single()

      if (fetchError || !hotdeal) {
        throw new Error(`핫딜 조회 실패: ${fetchError?.message}`)
      }

      // 새로운 만료 시간 계산
      const currentEndDate = new Date(hotdeal.end_date)
      const newEndDate = new Date(currentEndDate.getTime() + additionalHours * 60 * 60 * 1000)

      // 만료 시간 업데이트
      const { error: updateError } = await supabase
        .from('hot_deals')
        .update({
          end_date: newEndDate.toISOString(),
          status: 'active', // 만료된 상태였다면 다시 활성화
          updated_at: new Date().toISOString()
        })
        .eq('id', hotdealId)

      if (updateError) {
        throw new Error(`만료 시간 업데이트 실패: ${updateError.message}`)
      }

      console.log(chalk.green(`✅ 핫딜 "${hotdeal.title}" 만료 시간을 ${additionalHours}시간 연장했습니다`))
      return true
    } catch (error) {
      console.error(chalk.red('만료 시간 연장 실패:'), error)
      return false
    }
  }

  /**
   * 만료된 핫딜을 다시 활성화합니다
   */
  static async reactivateExpiredDeal(hotdealId: string, extendHours: number = 168): Promise<boolean> {
    const supabase = supabaseAdmin()
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }

    try {
      const newEndDate = new Date(Date.now() + extendHours * 60 * 60 * 1000)
      
      const { error } = await supabase
        .from('hot_deals')
        .update({
          status: 'active',
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', hotdealId)
        .eq('status', 'ended') // 만료된 핫딜만 재활성화

      if (error) {
        throw new Error(`재활성화 실패: ${error.message}`)
      }

      console.log(chalk.green(`✅ 핫딜이 재활성화되었습니다 (${extendHours}시간 연장)`))
      return true
    } catch (error) {
      console.error(chalk.red('핫딜 재활성화 실패:'), error)
      return false
    }
  }
}