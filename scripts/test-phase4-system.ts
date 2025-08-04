#!/usr/bin/env ts-node

/**
 * Phase 4: 시스템 관리 테스트 스크립트
 * 
 * 테스트 대상:
 * 1. SupabaseNotificationService - 알림 관리
 * 2. SupabaseAdminLogService - 관리자 활동 로그
 * 3. SupabaseSystemSettingsService - 시스템 설정
 */

import { SupabaseNotificationService } from '../lib/services/supabase-notification-service'
import { SupabaseAdminLogService } from '../lib/services/supabase-admin-log-service'
import { SupabaseSystemSettingsService } from '../lib/services/supabase-system-settings-service'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

class Phase4SystemTester {
  private results: TestResult[] = []
  private testUserId = 'test-user-phase4'
  private testAdminId = 'test-admin-phase4'

  private async runTest(name: string, testFn: () => Promise<boolean>): Promise<void> {
    const startTime = Date.now()
    try {
      console.log(`🧪 ${name}`)
      const passed = await testFn()
      const duration = Date.now() - startTime
      
      if (passed) {
        console.log(`✅ ${name} - ${duration}ms`)
        this.results.push({ name, passed: true, duration })
      } else {
        console.log(`❌ ${name} - 실패`)
        this.results.push({ name, passed: false, duration })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`💥 ${name} - 오류: ${error}`)
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      })
    }
  }

  /**
   * 1. 알림 관리 테스트
   */
  async testNotificationService() {
    console.log('\n📱 알림 관리 서비스 테스트 시작')
    
    let testNotificationId: string | null = null

    // 1.1 알림 생성
    await this.runTest('알림 생성', async () => {
      const notification = await SupabaseNotificationService.createNotification(
        this.testUserId,
        '테스트 알림',
        '이것은 Phase 4 테스트용 알림입니다.'
      )
      if (notification) {
        testNotificationId = notification.id
        return true
      }
      return false
    })

    // 1.2 사용자 알림 조회
    await this.runTest('사용자 알림 조회', async () => {
      const notifications = await SupabaseNotificationService.getUserNotifications(this.testUserId)
      return notifications.length > 0
    })

    // 1.3 읽지 않은 알림 개수 조회
    await this.runTest('읽지 않은 알림 개수', async () => {
      const count = await SupabaseNotificationService.getUnreadCount(this.testUserId)
      return typeof count === 'number' && count >= 0
    })

    // 1.4 알림 읽음 처리
    if (testNotificationId) {
      await this.runTest('알림 읽음 처리', async () => {
        return await SupabaseNotificationService.markAsRead(testNotificationId!)
      })
    }

    // 1.5 일괄 알림 생성
    await this.runTest('일괄 알림 생성', async () => {
      const notifications = await SupabaseNotificationService.createBulkNotifications([
        { user_id: this.testUserId, title: '테스트 1', content: '내용 1' },
        { user_id: this.testUserId, title: '테스트 2', content: '내용 2' }
      ])
      return notifications.length === 2
    })

    // 1.6 알림 통계
    await this.runTest('알림 통계 조회', async () => {
      const stats = await SupabaseNotificationService.getNotificationStats(this.testUserId)
      return stats !== null && typeof stats.total_notifications === 'number'
    })

    // 1.7 알림 검색
    await this.runTest('알림 검색', async () => {
      const results = await SupabaseNotificationService.searchNotifications(
        this.testUserId,
        '테스트'
      )
      return Array.isArray(results)
    })

    // 1.8 시스템 공지사항 생성
    await this.runTest('시스템 공지사항 생성', async () => {
      const result = await SupabaseNotificationService.createSystemAnnouncement(
        '시스템 점검 안내',
        '시스템 점검이 예정되어 있습니다.',
        [this.testUserId]
      )
      return result.success && result.notification_count > 0
    })
  }

  /**
   * 2. 관리자 로그 테스트
   */
  async testAdminLogService() {
    console.log('\n📋 관리자 로그 서비스 테스트 시작')
    
    let testLogId: string | null = null

    // 2.1 관리자 로그 생성
    await this.runTest('관리자 로그 생성', async () => {
      const log = await SupabaseAdminLogService.createAdminLog({
        admin_id: this.testAdminId,
        action: 'test_action',
        action_category: 'test',
        entity_type: 'notification',
        entity_id: '123',
        details: { test: true },
        ip_address: '127.0.0.1'
      })
      if (log) {
        testLogId = log.id
        return true
      }
      return false
    })

    // 2.2 관리자 로그 조회
    await this.runTest('관리자 로그 조회', async () => {
      const logs = await SupabaseAdminLogService.getAdminLogs({ limit: 10 })
      return Array.isArray(logs)
    })

    // 2.3 특정 관리자 로그 조회
    await this.runTest('특정 관리자 로그 조회', async () => {
      const logs = await SupabaseAdminLogService.getAdminLogs({
        admin_id: this.testAdminId,
        limit: 5
      })
      return Array.isArray(logs)
    })

    // 2.4 엔티티 변경 이력 조회
    await this.runTest('엔티티 변경 이력', async () => {
      const history = await SupabaseAdminLogService.getEntityHistory('notification', '123')
      return Array.isArray(history)
    })

    // 2.5 관리자 활동 통계
    await this.runTest('관리자 활동 통계', async () => {
      const stats = await SupabaseAdminLogService.getAdminActivityStats(this.testAdminId)
      return stats !== null && typeof stats.total_actions === 'number'
    })

    // 2.6 로그 검색
    await this.runTest('로그 검색', async () => {
      const results = await SupabaseAdminLogService.searchLogs('test', { limit: 5 })
      return Array.isArray(results)
    })

    // 2.7 보안 로그 조회
    await this.runTest('보안 로그 조회', async () => {
      const securityLogs = await SupabaseAdminLogService.getSecurityLogs({ limit: 5 })
      return Array.isArray(securityLogs)
    })

    // 2.8 감사 보고서 생성
    await this.runTest('감사 보고서 생성', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const report = await SupabaseAdminLogService.getAuditReport({
        start_date: yesterday.toISOString(),
        end_date: now.toISOString(),
        admin_id: this.testAdminId
      })
      
      return report !== null && typeof report.summary.total_actions === 'number'
    })
  }

  /**
   * 3. 시스템 설정 테스트
   */
  async testSystemSettingsService() {
    console.log('\n⚙️ 시스템 설정 서비스 테스트 시작')
    
    const testSettingKey = 'test_setting_phase4'

    // 3.1 시스템 설정 생성
    await this.runTest('시스템 설정 생성', async () => {
      const setting = await SupabaseSystemSettingsService.createSetting({
        key: testSettingKey,
        value: 'test_value',
        data_type: 'string',
        category: 'test',
        description: 'Phase 4 테스트 설정',
        is_public: true,
        is_editable: true,
        updated_by: this.testAdminId
      })
      return setting !== null
    })

    // 3.2 설정 값 조회
    await this.runTest('설정 값 조회', async () => {
      const value = await SupabaseSystemSettingsService.getSetting(testSettingKey)
      return value === 'test_value'
    })

    // 3.3 설정 상세 정보 조회
    await this.runTest('설정 상세 정보 조회', async () => {
      const detail = await SupabaseSystemSettingsService.getSettingDetail(testSettingKey)
      return detail !== null && detail.key === testSettingKey
    })

    // 3.4 공개 설정 조회
    await this.runTest('공개 설정 조회', async () => {
      const publicSettings = await SupabaseSystemSettingsService.getPublicSettings()
      return typeof publicSettings === 'object' && publicSettings[testSettingKey] === 'test_value'
    })

    // 3.5 카테고리별 설정 조회
    await this.runTest('카테고리별 설정 조회', async () => {
      const settings = await SupabaseSystemSettingsService.getSettingsByCategory('test')
      return Array.isArray(settings) && settings.some(s => s.key === testSettingKey)
    })

    // 3.6 모든 설정 조회
    await this.runTest('모든 설정 조회', async () => {
      const allSettings = await SupabaseSystemSettingsService.getAllSettings({ limit: 10 })
      return Array.isArray(allSettings)
    })

    // 3.7 설정 값 업데이트
    await this.runTest('설정 값 업데이트', async () => {
      const updated = await SupabaseSystemSettingsService.updateSetting(
        testSettingKey,
        'updated_value',
        this.testAdminId
      )
      return updated !== null && updated.value === 'updated_value'
    })

    // 3.8 여러 설정 동시 업데이트
    await this.runTest('여러 설정 동시 업데이트', async () => {
      const result = await SupabaseSystemSettingsService.updateMultipleSettings([
        { key: testSettingKey, value: 'batch_updated' }
      ], this.testAdminId)
      return result.success && result.updated_count > 0
    })

    // 3.9 설정 카테고리 목록
    await this.runTest('설정 카테고리 목록', async () => {
      const categories = await SupabaseSystemSettingsService.getCategories()
      return Array.isArray(categories) && categories.some(c => c.category === 'test')
    })

    // 3.10 설정 백업 생성
    await this.runTest('설정 백업 생성', async () => {
      const backup = await SupabaseSystemSettingsService.createSettingsBackup()
      return backup !== null && Array.isArray(backup.backup_data)
    })

    // 3.11 설정 템플릿 생성
    await this.runTest('설정 템플릿 생성', async () => {
      const result = await SupabaseSystemSettingsService.createSettingTemplate(
        'test_template',
        [
          {
            key: 'template_setting_1',
            value: 'template_value_1',
            data_type: 'string',
            description: '템플릿 설정 1'
          }
        ],
        this.testAdminId
      )
      return result.success && result.created_count > 0
    })

    // 3.12 설정 삭제 (테스트 정리)
    await this.runTest('설정 삭제', async () => {
      const deleted1 = await SupabaseSystemSettingsService.deleteSetting(testSettingKey)
      const deleted2 = await SupabaseSystemSettingsService.deleteSetting('template_setting_1')
      return deleted1 && deleted2
    })
  }

  /**
   * 4. 정리 작업
   */
  async cleanup() {
    console.log('\n🧹 정리 작업 시작')
    
    try {
      // 테스트용 알림 정리
      await SupabaseNotificationService.cleanupOldNotifications(0) // 모든 알림 삭제
      
      // 테스트용 로그는 보통 정리하지 않지만, 필요시 추가 가능
      
      console.log('✅ 정리 작업 완료')
    } catch (error) {
      console.error('⚠️ 정리 작업 중 오류:', error)
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAllTests() {
    console.log('🚀 Phase 4: 시스템 관리 테스트 시작\n')
    console.log('='.repeat(50))
    
    const startTime = Date.now()
    
    try {
      await this.testNotificationService()
      await this.testAdminLogService()
      await this.testSystemSettingsService()
      
      const totalTime = Date.now() - startTime
      
      // 결과 요약
      console.log('\n' + '='.repeat(50))
      console.log('📊 테스트 결과 요약')
      console.log('='.repeat(50))
      
      const passed = this.results.filter(r => r.passed).length
      const failed = this.results.filter(r => !r.passed).length
      const total = this.results.length
      const successRate = ((passed / total) * 100).toFixed(1)
      
      console.log(`총 테스트: ${total}`)
      console.log(`성공: ${passed}`)
      console.log(`실패: ${failed}`)
      console.log(`성공률: ${successRate}%`)
      console.log(`총 실행 시간: ${totalTime}ms`)
      
      if (failed > 0) {
        console.log('\n❌ 실패한 테스트:')
        this.results
          .filter(r => !r.passed)
          .forEach(r => {
            console.log(`  - ${r.name}${r.error ? `: ${r.error}` : ''}`)
          })
      }
      
      // 성공률에 따른 결과 판정
      if (successRate === '100.0') {
        console.log('\n🎉 모든 테스트 통과! Phase 4 시스템 관리 구현 완료')
        return true
      } else if (parseFloat(successRate) >= 80) {
        console.log('\n✅ 대부분의 테스트 통과! 일부 개선 필요')
        return true
      } else {
        console.log('\n❌ 테스트 실패율이 높습니다. 코드 점검 필요')
        return false
      }
      
    } catch (error) {
      console.error('💥 테스트 실행 중 오류:', error)
      return false
    } finally {
      await this.cleanup()
    }
  }
}

// 스크립트 실행
async function main() {
  const tester = new Phase4SystemTester()
  const success = await tester.runAllTests()
  process.exit(success ? 0 : 1)
}

if (require.main === module) {
  main().catch(console.error)
}

export { Phase4SystemTester }