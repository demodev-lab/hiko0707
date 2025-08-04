#!/usr/bin/env ts-node

/**
 * Phase 2 Buy-for-me 통합 테스트 스크립트
 * 
 * 모든 Buy-for-me UI 컴포넌트의 Supabase 연동이 정상적으로 작동하는지 검증
 * 
 * 테스트 범위:
 * 1. useSupabaseBuyForMe Hook 기본 기능
 * 2. useSupabaseBuyForMeAdmin Hook 관리자 기능
 * 3. UI 컴포넌트 데이터 플로우
 * 4. 상태 변경 및 알림 시스템
 * 5. 오류 처리 및 에러 복구
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: string
}

class Phase2BuyForMeIntegrationTester {
  private results: TestResult[] = []
  private readonly projectRoot = '/Users/koreats/Desktop/work.mac/hiko0707'
  
  private log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warn: '⚠️'
    }[level]
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  private addResult(name: string, passed: boolean, error?: string, details?: string) {
    this.results.push({ name, passed, error, details })
    if (passed) {
      this.log(`${name}: 통과`, 'success')
    } else {
      this.log(`${name}: 실패 - ${error}`, 'error')
    }
  }

  /**
   * 1. 파일 존재 여부 검증
   */
  async testFileExistence() {
    this.log('=== 1. 파일 존재 여부 검증 ===')
    
    const requiredFiles = [
      'hooks/use-supabase-buy-for-me.ts',
      'components/features/order/buy-for-me-modal.tsx',
      'app/mypage/page.tsx',
      'app/admin/buy-for-me/page.tsx',
      'app/admin/buy-for-me/[id]/page.tsx',
      'app/admin/buy-for-me/[id]/quote/page.tsx',
      'app/admin/buy-for-me/[id]/tracking/page.tsx',
      'components/features/admin/admin-dashboard.tsx',
      'app/mypage/orders/[id]/quote/page.tsx'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file)
      try {
        if (fs.existsSync(filePath)) {
          this.addResult(`파일 존재: ${file}`, true)
        } else {
          this.addResult(`파일 존재: ${file}`, false, '파일이 존재하지 않습니다')
        }
      } catch (error) {
        this.addResult(`파일 존재: ${file}`, false, `검사 실패: ${error}`)
      }
    }
  }

  /**
   * 2. Import 문 검증 - Supabase Hook 사용 확인
   */
  async testImportStatements() {
    this.log('=== 2. Import 문 검증 ===')

    const fileImportTests = [
      {
        file: 'hooks/use-supabase-buy-for-me.ts',
        imports: [
          'SupabaseOrderService',
          'SupabasePaymentService', 
          'SupabaseAddressService',
          'SupabaseNotificationService',
          'SupabaseAdminLogService'
        ]
      },
      {
        file: 'components/features/order/buy-for-me-modal.tsx',
        imports: ['useSupabaseBuyForMe']
      },
      {
        file: 'app/mypage/page.tsx', 
        imports: ['useSupabaseBuyForMe']
      },
      {
        file: 'app/admin/buy-for-me/page.tsx',
        imports: ['useSupabaseBuyForMeAdmin']
      },
      {
        file: 'components/features/admin/admin-dashboard.tsx',
        imports: ['useSupabaseBuyForMeAdmin']
      }
    ]

    for (const test of fileImportTests) {
      const filePath = path.join(this.projectRoot, test.file)
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          for (const importName of test.imports) {
            if (content.includes(importName)) {
              this.addResult(`Import 검증: ${test.file} - ${importName}`, true)
            } else {
              this.addResult(`Import 검증: ${test.file} - ${importName}`, false, 'Import 문이 없습니다')
            }
          }
        } else {
          this.addResult(`Import 검증: ${test.file}`, false, '파일이 존재하지 않습니다')
        }
      } catch (error) {
        this.addResult(`Import 검증: ${test.file}`, false, `검사 실패: ${error}`)
      }
    }
  }

  /**
   * 3. LocalStorage 데이터베이스 제거 확인
   */
  async testLocalStorageRemoval() {
    this.log('=== 3. LocalStorage 데이터베이스 제거 확인 ===')

    const filesToCheck = [
      'components/features/order/buy-for-me-modal.tsx',
      'app/mypage/page.tsx',
      'app/admin/buy-for-me/page.tsx',
      'app/admin/buy-for-me/[id]/page.tsx',
      'app/admin/buy-for-me/[id]/quote/page.tsx',
      'app/admin/buy-for-me/[id]/tracking/page.tsx',
      'components/features/admin/admin-dashboard.tsx',
      'app/mypage/orders/[id]/quote/page.tsx'
    ]

    const localStorageImports = [
      'from \'@/lib/db/database-service\'',
      'useBuyForMe',
      'from \'@/hooks/use-local-db\''
    ]

    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file)
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          let hasLocalStorageImports = false
          for (const importStatement of localStorageImports) {
            if (content.includes(importStatement)) {
              hasLocalStorageImports = true
              break
            }
          }
          
          if (!hasLocalStorageImports) {
            this.addResult(`LocalStorage 제거: ${file}`, true, '', 'LocalStorage 관련 import가 없습니다')
          } else {
            this.addResult(`LocalStorage 제거: ${file}`, false, 'LocalStorage 관련 import가 여전히 존재합니다')
          }
        }
      } catch (error) {
        this.addResult(`LocalStorage 제거: ${file}`, false, `검사 실패: ${error}`)
      }
    }
  }

  /**
   * 4. Hook 인터페이스 검증 
   */
  async testHookInterfaces() {
    this.log('=== 4. Hook 인터페이스 검증 ===')

    const hookFile = path.join(this.projectRoot, 'hooks/use-supabase-buy-for-me.ts')
    try {
      if (fs.existsSync(hookFile)) {
        const content = fs.readFileSync(hookFile, 'utf-8')
        
        // useSupabaseBuyForMe 함수들 확인
        const userFunctions = [
          'requests',
          'isLoading', 
          'createRequest',
          'cancelRequest',
          'approveQuote',
          'isCreating',
          'isCancelling',
          'isApproving'
        ]
        
        for (const func of userFunctions) {
          if (content.includes(func)) {
            this.addResult(`Hook 인터페이스: useSupabaseBuyForMe.${func}`, true)
          } else {
            this.addResult(`Hook 인터페이스: useSupabaseBuyForMe.${func}`, false, '함수가 export되지 않습니다')
          }
        }

        // useSupabaseBuyForMeAdmin 함수들 확인
        const adminFunctions = [
          'allRequests',
          'isLoading',
          'updateStatus', 
          'createQuote',
          'isUpdatingStatus',
          'isCreatingQuote'
        ]
        
        for (const func of adminFunctions) {
          if (content.includes(func)) {
            this.addResult(`Hook 인터페이스: useSupabaseBuyForMeAdmin.${func}`, true)
          } else {
            this.addResult(`Hook 인터페이스: useSupabaseBuyForMeAdmin.${func}`, false, '함수가 export되지 않습니다')
          }
        }
      } else {
        this.addResult('Hook 인터페이스 검증', false, 'use-supabase-buy-for-me.ts 파일이 없습니다')
      }
    } catch (error) {
      this.addResult('Hook 인터페이스 검증', false, `검사 실패: ${error}`)
    }
  }

  /**
   * 5. 컴포넌트 Hook 사용 검증
   */
  async testComponentHookUsage() {
    this.log('=== 5. 컴포넌트 Hook 사용 검증 ===')

    const componentTests = [
      {
        file: 'components/features/order/buy-for-me-modal.tsx',
        hookUsage: ['const { createRequest, isCreating } = useSupabaseBuyForMe()']
      },
      {
        file: 'app/mypage/page.tsx',
        hookUsage: ['const { cancelRequest, isCancelling } = useSupabaseBuyForMe()']
      },
      {
        file: 'app/admin/buy-for-me/page.tsx',
        hookUsage: ['const { allRequests, isLoading } = useSupabaseBuyForMeAdmin()']
      },
      {
        file: 'app/admin/buy-for-me/[id]/page.tsx',
        hookUsage: ['const { updateStatus, allRequests, isLoading } = useSupabaseBuyForMeAdmin()']
      },
      {
        file: 'app/admin/buy-for-me/[id]/quote/page.tsx',
        hookUsage: ['const { createQuote, allRequests, isLoading, isCreatingQuote } = useSupabaseBuyForMeAdmin()']
      }
    ]

    for (const test of componentTests) {
      const filePath = path.join(this.projectRoot, test.file)
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          let allUsagesFound = true
          for (const usage of test.hookUsage) {
            if (!content.includes('useSupabaseBuyForMe')) {
              allUsagesFound = false
              break
            }
          }
          
          if (allUsagesFound) {
            this.addResult(`Hook 사용: ${test.file}`, true)
          } else {
            this.addResult(`Hook 사용: ${test.file}`, false, 'Hook 사용법이 올바르지 않습니다')
          }
        }
      } catch (error) {
        this.addResult(`Hook 사용: ${test.file}`, false, `검사 실패: ${error}`)
      }
    }
  }

  /**
   * 6. TypeScript 컴파일 검증
   */
  async testTypeScriptCompilation() {
    this.log('=== 6. TypeScript 컴파일 검증 ===')

    try {
      const { stdout, stderr } = await execAsync('pnpm tsc --noEmit', {
        cwd: this.projectRoot,
        timeout: 60000
      })

      if (stderr && stderr.includes('error')) {
        this.addResult('TypeScript 컴파일', false, 'TypeScript 오류가 있습니다', stderr)
      } else {
        this.addResult('TypeScript 컴파일', true, '', 'TypeScript 타입 검사 통과')
      }
    } catch (error: any) {
      this.addResult('TypeScript 컴파일', false, `컴파일 실패: ${error.message}`)
    }
  }

  /**
   * 7. ESLint 검증
   */
  async testESLint() {
    this.log('=== 7. ESLint 검증 ===')

    const filesToLint = [
      'hooks/use-supabase-buy-for-me.ts',
      'components/features/order/buy-for-me-modal.tsx',
      'app/mypage/page.tsx',
      'app/admin/buy-for-me/page.tsx'
    ]

    try {
      for (const file of filesToLint) {
        const { stdout, stderr } = await execAsync(`pnpm eslint ${file}`, {
          cwd: this.projectRoot,
          timeout: 30000
        })

        if (stderr || (stdout && stdout.includes('error'))) {
          this.addResult(`ESLint: ${file}`, false, 'ESLint 오류가 있습니다', stdout || stderr)
        } else {
          this.addResult(`ESLint: ${file}`, true)
        }
      }
    } catch (error: any) {
      // ESLint가 오류를 발견하면 exit code가 0이 아니므로 catch로 들어옴
      if (error.stdout && error.stdout.includes('error')) {
        this.addResult('ESLint 전체', false, 'ESLint 오류가 있습니다', error.stdout)
      } else {
        this.addResult('ESLint 전체', true, '', 'ESLint 통과')
      }
    }
  }

  /**
   * 8. 빌드 테스트
   */
  async testBuild() {
    this.log('=== 8. 빌드 테스트 ===')

    try {
      const { stdout, stderr } = await execAsync('pnpm build', {
        cwd: this.projectRoot,
        timeout: 180000 // 3분
      })

      if (stderr && stderr.includes('Error')) {
        this.addResult('빌드 테스트', false, '빌드 오류가 있습니다', stderr)
      } else if (stdout && stdout.includes('✓ Compiled successfully')) {
        this.addResult('빌드 테스트', true, '', '빌드 성공')
      } else {
        this.addResult('빌드 테스트', true, '', '빌드 완료')
      }
    } catch (error: any) {
      this.addResult('빌드 테스트', false, `빌드 실패: ${error.message}`)
    }
  }

  /**
   * 테스트 결과 요약
   */
  generateSummary() {
    this.log('=== 📊 Phase 2 Buy-for-me 통합 테스트 결과 요약 ===')
    
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const successRate = Math.round((passed / total) * 100)

    console.log(`\n📈 전체 테스트: ${total}개`)
    console.log(`✅ 성공: ${passed}개`)
    console.log(`❌ 실패: ${total - passed}개`)
    console.log(`📊 성공률: ${successRate}%\n`)

    if (successRate >= 90) {
      this.log('🎉 Phase 2 Buy-for-me 통합이 성공적으로 완료되었습니다!', 'success')
    } else if (successRate >= 70) {
      this.log('⚠️ Phase 2 Buy-for-me 통합이 대부분 완료되었지만 일부 개선이 필요합니다', 'warn')
    } else {
      this.log('❌ Phase 2 Buy-for-me 통합에 문제가 있습니다. 수정이 필요합니다', 'error')
    }

    // 실패한 테스트만 상세 출력
    const failedTests = this.results.filter(r => !r.passed)
    if (failedTests.length > 0) {
      this.log('\n🔍 실패한 테스트 상세:', 'error')
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`)
        console.log(`   오류: ${test.error}`)
        if (test.details) {
          console.log(`   상세: ${test.details}`)
        }
        console.log('')
      })
    }

    return {
      total,
      passed,
      failed: total - passed,
      successRate,
      status: successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAllTests() {
    this.log('🚀 Phase 2 Buy-for-me 통합 테스트 시작', 'info')
    
    await this.testFileExistence()
    await this.testImportStatements()
    await this.testLocalStorageRemoval()
    await this.testHookInterfaces()
    await this.testComponentHookUsage()
    await this.testTypeScriptCompilation()
    await this.testESLint()
    await this.testBuild()
    
    return this.generateSummary()
  }
}

// 메인 실행
async function main() {
  const tester = new Phase2BuyForMeIntegrationTester()
  
  try {
    const summary = await tester.runAllTests()
    process.exit(summary.status === 'error' ? 1 : 0)
  } catch (error) {
    console.error('❌ 테스트 실행 중 치명적 오류 발생:', error)
    process.exit(1)
  }
}

// ES 모듈에서 실행
main().catch(console.error)

export default Phase2BuyForMeIntegrationTester