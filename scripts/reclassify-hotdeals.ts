#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { supabaseAdmin } from '@/lib/supabase/client'
import { HotDealClassificationService } from '@/lib/services/hotdeal-classification-service'
import chalk from 'chalk'
import ora from 'ora'

// 환경 변수 로드
dotenv.config()

/**
 * Supabase의 모든 핫딜을 새로운 분류 시스템으로 재분류하는 배치 작업
 */

// Supabase 클라이언트 초기화 (관리자 권한)
const supabase = supabaseAdmin()

if (!supabase) {
  console.error(chalk.red('❌ Supabase 클라이언트 초기화 실패'))
  console.error(chalk.yellow('환경 변수를 확인하세요:'))
  console.error(chalk.gray('- NEXT_PUBLIC_SUPABASE_URL'))
  console.error(chalk.gray('- SUPABASE_SERVICE_ROLE_KEY'))
  process.exit(1)
}

interface ReclassificationStats {
  totalProcessed: number
  updated: number
  skipped: number
  errors: number
  categoryChanges: Record<string, number>
}

async function reclassifyAllHotdeals(dryRun: boolean = false): Promise<ReclassificationStats> {
  const spinner = ora('핫딜 재분류 작업 시작...').start()
  
  const stats: ReclassificationStats = {
    totalProcessed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    categoryChanges: {}
  }

  try {
    // 1. 전체 핫딜 개수 확인
    const { count: totalCount, error: countError } = await supabase
      .from('hot_deals')
      .select('id', { count: 'exact', head: true })
    
    if (countError) {
      throw new Error(`핫딜 개수 조회 실패: ${countError.message}`)
    }

    console.log(chalk.cyan(`\n📊 총 ${totalCount}개의 핫딜을 재분류합니다`))
    if (dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN 모드: 실제 업데이트는 하지 않습니다'))
    }

    // 2. 배치 단위로 처리 (500개씩)
    const batchSize = 500
    const totalBatches = Math.ceil((totalCount || 0) / batchSize)

    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * batchSize
      const endIndex = startIndex + batchSize - 1

      spinner.text = `배치 ${batch + 1}/${totalBatches} 처리 중... (${startIndex + 1}-${Math.min(endIndex + 1, totalCount || 0)})`

      // 배치 데이터 조회
      const { data: hotdeals, error: batchError } = await supabase
        .from('hot_deals')
        .select('id, title, category, description, shopping_comment')
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false })

      if (batchError) {
        console.error(chalk.red(`배치 ${batch + 1} 조회 실패:`, batchError.message))
        stats.errors += batchSize
        continue
      }

      // 각 핫딜 재분류
      for (const hotdeal of hotdeals || []) {
        try {
          stats.totalProcessed++

          // 현재 카테고리 정규화
          const currentCategory = HotDealClassificationService.normalizeCategory(hotdeal.category)
          
          // HotDeal 객체 구성 (분류에 필요한 정보만)
          const hotdealForClassification = {
            id: hotdeal.id,
            title: hotdeal.title,
            category: currentCategory,
            productComment: hotdeal.shopping_comment || hotdeal.description || ''
          }

          // 새로운 카테고리 결정
          const newCategory = HotDealClassificationService.reclassifyHotDeal(hotdealForClassification)

          if (newCategory !== currentCategory) {
            // 카테고리 변경이 필요한 경우
            const changeKey = `${currentCategory} → ${newCategory}`
            stats.categoryChanges[changeKey] = (stats.categoryChanges[changeKey] || 0) + 1

            if (!dryRun) {
              // 실제 업데이트 수행
              const { error: updateError } = await supabase
                .from('hot_deals')
                .update({ 
                  category: newCategory,
                  updated_at: new Date().toISOString()
                })
                .eq('id', hotdeal.id)

              if (updateError) {
                throw new Error(`업데이트 실패: ${updateError.message}`)
              }
            }

            stats.updated++
            
            if (stats.updated % 10 === 0) {
              console.log(chalk.green(`  ✓ ${stats.updated}개 업데이트 완료`))
            }
          } else {
            stats.skipped++
          }

        } catch (error) {
          stats.errors++
          console.error(chalk.red(`핫딜 ${hotdeal.id} 처리 실패:`, error))
        }

        // 진행률 표시
        if (stats.totalProcessed % 100 === 0) {
          const progress = (stats.totalProcessed / (totalCount || 1)) * 100
          spinner.text = `진행률: ${progress.toFixed(1)}% (${stats.totalProcessed}/${totalCount})`
        }
      }

      // 배치 간 짧은 대기 (Supabase rate limit 고려)
      if (batch < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    spinner.succeed(chalk.green('핫딜 재분류 작업 완료!'))

  } catch (error) {
    spinner.fail(chalk.red('핫딜 재분류 작업 실패'))
    console.error(error)
    throw error
  }

  return stats
}

/**
 * 분류 통계 출력
 */
function printStatistics(stats: ReclassificationStats, dryRun: boolean) {
  console.log(chalk.cyan('\n📈 재분류 결과:'))
  console.log(chalk.gray(`- 총 처리된 핫딜: ${stats.totalProcessed.toLocaleString()}개`))
  console.log(chalk.green(`- 카테고리 변경: ${stats.updated.toLocaleString()}개`))
  console.log(chalk.gray(`- 변경 없음: ${stats.skipped.toLocaleString()}개`))
  if (stats.errors > 0) {
    console.log(chalk.red(`- 오류: ${stats.errors.toLocaleString()}개`))
  }

  if (Object.keys(stats.categoryChanges).length > 0) {
    console.log(chalk.cyan('\n🔄 카테고리 변경 내역:'))
    Object.entries(stats.categoryChanges)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // 상위 20개만 표시
      .forEach(([change, count]) => {
        console.log(chalk.gray(`  ${change}: ${count.toLocaleString()}개`))
      })
  }

  const successRate = stats.totalProcessed > 0 
    ? ((stats.totalProcessed - stats.errors) / stats.totalProcessed * 100).toFixed(1)
    : '0'

  console.log(chalk.cyan(`\n✨ 성공률: ${successRate}%`))
  
  if (dryRun) {
    console.log(chalk.yellow('\n💡 실제 적용하려면 --apply 옵션을 사용하세요'))
  }
}

/**
 * 현재 카테고리 분포 조회
 */
async function getCurrentCategoryDistribution(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('hot_deals')
    .select('category')

  if (error) {
    console.error('카테고리 분포 조회 실패:', error)
    return {}
  }

  const distribution: Record<string, number> = {}
  
  for (const deal of data || []) {
    const category = HotDealClassificationService.normalizeCategory(deal.category || '기타')
    distribution[category] = (distribution[category] || 0) + 1
  }

  return distribution
}

/**
 * 카테고리 분포 출력
 */
function printCategoryDistribution(distribution: Record<string, number>, title: string) {
  console.log(chalk.cyan(`\n📊 ${title}:`))
  
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  
  Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0'
      console.log(chalk.gray(`  ${category}: ${count.toLocaleString()}개 (${percentage}%)`))
    })
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const showDistribution = args.includes('--distribution')

  try {
    console.log(chalk.blue('🚀 핫딜 재분류 시스템'))
    console.log(chalk.blue('=' .repeat(50)))

    // 현재 카테고리 분포 표시
    if (showDistribution) {
      console.log(chalk.cyan('현재 카테고리 분포 조회 중...'))
      const currentDistribution = await getCurrentCategoryDistribution()
      printCategoryDistribution(currentDistribution, '현재 카테고리 분포')
    }

    // 사용 가능한 카테고리 목록 표시
    const availableCategories = HotDealClassificationService.getAvailableCategories()
    console.log(chalk.cyan(`\n🏷️  사용 가능한 카테고리 (${availableCategories.length}개):`))
    availableCategories.forEach(category => {
      console.log(chalk.gray(`  - ${category}`))
    })

    // 재분류 실행
    const stats = await reclassifyAllHotdeals(dryRun)
    printStatistics(stats, dryRun)

    // 업데이트 후 분포 표시 (실제 적용시에만)
    if (!dryRun && showDistribution && stats.updated > 0) {
      console.log(chalk.cyan('\n업데이트 후 카테고리 분포 조회 중...'))
      const updatedDistribution = await getCurrentCategoryDistribution()
      printCategoryDistribution(updatedDistribution, '업데이트 후 카테고리 분포')
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 작업 실패:'), error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
}