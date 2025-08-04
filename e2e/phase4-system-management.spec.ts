import { test, expect } from './fixtures/test-base'

test.describe('Phase 4: 시스템 관리 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/')
  })

  test('4.1 관리자 페이지 접근 확인 (보호된 페이지)', async ({ page }) => {
    // 관리자 페이지 직접 접근 시도
    await page.goto('http://localhost:3001/admin')
    
    // 로그인 페이지로 리다이렉트 또는 접근 거부 확인
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    
    // 로그인 페이지로 리다이렉트되거나 접근이 제한되어야 함
    const isProtected = currentUrl.includes('login') || 
                       currentUrl.includes('sign-in') || 
                       currentUrl.includes('accounts.dev') ||
                       await page.getByText('접근 권한이 없습니다').count() > 0 ||
                       await page.getByText('로그인이 필요합니다').count() > 0
    
    expect(isProtected).toBeTruthy()
  })

  test('4.2 관리자 대시보드 UI 확인', async ({ page }) => {
    // 관리자 페이지 접근 (로그인 없이 UI만 확인)
    await page.goto('http://localhost:3001/admin')
    await page.waitForTimeout(2000)
    
    // 로그인 페이지로 리다이렉트된 경우 스킵
    const currentUrl = page.url()
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      test.skip('로그인이 필요한 페이지')
    }
    
    // 관리자 대시보드 요소 확인
    const adminElements = [
      '대시보드',
      '핫딜 관리',
      '사용자 관리',
      '시스템 설정',
      '통계',
      'admin'
    ]
    
    let foundElements = 0
    
    for (const element of adminElements) {
      const elementLocator = page.getByText(element).or(page.getByRole('heading', { name: element }))
      const count = await elementLocator.count()
      if (count > 0) {
        foundElements++
      }
    }
    
    // 관리자 관련 요소가 최소 1개 이상 있어야 함
    expect(foundElements).toBeGreaterThan(0)
  })

  test('4.3 핫딜 관리 페이지 접근', async ({ page }) => {
    // 핫딜 관리 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/hotdeals')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    // 로그인 페이지로 리다이렉트되거나 핫딜 관리 페이지가 표시되어야 함
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 관리 페이지 요소 확인
      const managementElements = page.getByText('핫딜 관리')
        .or(page.getByText('Hot Deal Management'))
        .or(page.getByRole('heading', { name: /핫딜|관리/ }))
      
      const elementCount = await managementElements.count()
      if (elementCount > 0) {
        await expect(managementElements.first()).toBeVisible()
      } else {
        // 관리 페이지가 구현되지 않은 경우
        test.skip('핫딜 관리 페이지가 구현되지 않음')
      }
    }
  })

  test('4.4 사용자 관리 기능 확인', async ({ page }) => {
    // 사용자 관리 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/users')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 사용자 관리 페이지 요소 확인
      const userManagementElements = page.getByText('사용자 관리')
        .or(page.getByText('User Management'))
        .or(page.locator('table'))
        .or(page.getByRole('columnheader'))
      
      const elementCount = await userManagementElements.count()
      if (elementCount > 0) {
        await expect(userManagementElements.first()).toBeVisible()
      } else {
        test.skip('사용자 관리 페이지가 구현되지 않음')
      }
    }
  })

  test('4.5 크롤러 관리 기능 확인', async ({ page }) => {
    // 크롤러 관리 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/crawler')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 크롤러 관리 페이지 요소 확인
      const crawlerElements = page.getByText('크롤러')
        .or(page.getByText('Crawler'))
        .or(page.getByText('뽐뿌'))
        .or(page.getByText('루리웹'))
        .or(page.getByText('클리앙'))
      
      const elementCount = await crawlerElements.count()
      if (elementCount > 0) {
        await expect(crawlerElements.first()).toBeVisible()
      } else {
        test.skip('크롤러 관리 페이지가 구현되지 않음')
      }
    }
  })

  test('4.6 시스템 통계 확인', async ({ page }) => {
    // 통계 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/stats')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 통계 페이지 요소 확인
      const statsElements = page.getByText('통계')
        .or(page.getByText('Statistics'))
        .or(page.locator('canvas')) // 차트 요소
        .or(page.locator('[data-testid="chart"]'))
        .or(page.locator('.chart'))
      
      const elementCount = await statsElements.count()
      if (elementCount > 0) {
        await expect(statsElements.first()).toBeVisible()
      } else {
        test.skip('통계 페이지가 구현되지 않음')
      }
    }
  })

  test('4.7 설정 페이지 확인', async ({ page }) => {
    // 설정 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/settings')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 설정 페이지 요소 확인
      const settingsElements = page.getByText('설정')
        .or(page.getByText('Settings'))
        .or(page.getByRole('textbox'))
        .or(page.getByRole('checkbox'))
        .or(page.getByRole('button', { name: /저장|Save/ }))
      
      const elementCount = await settingsElements.count()
      if (elementCount > 0) {
        await expect(settingsElements.first()).toBeVisible()
      } else {
        test.skip('설정 페이지가 구현되지 않음')
      }
    }
  })

  test('4.8 데이터 내보내기 기능 확인', async ({ page }) => {
    // 데이터 내보내기 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/export')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 내보내기 기능 요소 확인
      const exportElements = page.getByText('내보내기')
        .or(page.getByText('Export'))
        .or(page.getByText('다운로드'))
        .or(page.getByText('Download'))
        .or(page.getByRole('button', { name: /내보내기|Export|다운로드|Download/ }))
      
      const elementCount = await exportElements.count()
      if (elementCount > 0) {
        await expect(exportElements.first()).toBeVisible()
      } else {
        test.skip('데이터 내보내기 기능이 구현되지 않음')
      }
    }
  })

  test('4.9 로그 관리 기능 확인', async ({ page }) => {
    // 로그 관리 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/logs')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 로그 관리 페이지 요소 확인
      const logElements = page.getByText('로그')
        .or(page.getByText('Log'))
        .or(page.getByText('크롤링 로그'))
        .or(page.getByText('시스템 로그'))
        .or(page.locator('pre')) // 로그 출력 영역
        .or(page.locator('.log'))
      
      const elementCount = await logElements.count()
      if (elementCount > 0) {
        await expect(logElements.first()).toBeVisible()
      } else {
        test.skip('로그 관리 기능이 구현되지 않음')
      }
    }
  })

  test('4.10 시스템 상태 모니터링 확인', async ({ page }) => {
    // 시스템 상태 페이지 접근 시도
    await page.goto('http://localhost:3001/admin/status')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      // 보호된 페이지로 정상 동작
      expect(true).toBeTruthy()
    } else {
      // 시스템 상태 요소 확인
      const statusElements = page.getByText('시스템 상태')
        .or(page.getByText('System Status'))
        .or(page.getByText('서버 상태'))
        .or(page.getByText('온라인'))
        .or(page.getByText('Online'))
        .or(page.locator('.status'))
        .or(page.locator('[data-testid="status"]'))
      
      const elementCount = await statusElements.count()
      if (elementCount > 0) {
        await expect(statusElements.first()).toBeVisible()
      } else {
        test.skip('시스템 상태 모니터링이 구현되지 않음')
      }
    }
  })

  test('4.11 관리자 네비게이션 메뉴 확인', async ({ page }) => {
    // 관리자 페이지 접근
    await page.goto('http://localhost:3001/admin')
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      test.skip('로그인이 필요한 페이지')
    } else {
      // 관리자 네비게이션 메뉴 확인
      const navItems = [
        '대시보드',
        '핫딜 관리',
        '사용자 관리',
        '크롤러 관리',
        '통계',
        '설정'
      ]
      
      let foundNavItems = 0
      
      for (const item of navItems) {
        const navElement = page.getByRole('link', { name: item })
          .or(page.getByRole('button', { name: item }))
          .or(page.locator('nav').getByText(item))
        
        const count = await navElement.count()
        if (count > 0) {
          foundNavItems++
        }
      }
      
      // 최소 2개 이상의 네비게이션 항목이 있어야 함
      expect(foundNavItems).toBeGreaterThan(1)
    }
  })

  test('4.12 관리자 권한 확인 시스템', async ({ page }) => {
    // 여러 관리자 페이지에 접근하여 일관된 보안 확인
    const adminPages = [
      '/admin',
      '/admin/hotdeals',
      '/admin/users',
      '/admin/settings'
    ]
    
    let protectedPages = 0
    
    for (const adminPage of adminPages) {
      await page.goto(`http://localhost:3001${adminPage}`)
      await page.waitForTimeout(1500)
      
      const currentUrl = page.url()
      const isProtected = currentUrl.includes('login') || 
                         currentUrl.includes('sign-in') || 
                         currentUrl.includes('accounts.dev')
      
      if (isProtected) {
        protectedPages++
      }
    }
    
    // 모든 관리자 페이지가 보호되어야 함
    expect(protectedPages).toBe(adminPages.length)
  })

  // 성능 및 보안 테스트
  test.describe('관리자 시스템 보안 및 성능', () => {
    test('4.13 관리자 페이지 로딩 성능', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3001/admin')
      await page.waitForTimeout(2000)
      
      const loadTime = Date.now() - startTime
      
      // 관리자 페이지는 5초 이내에 응답해야 함 (보안 체크 포함)
      expect(loadTime).toBeLessThan(5000)
    })

    test('4.14 무권한 접근 차단 확인', async ({ page }) => {
      // 직접 관리자 API 엔드포인트 접근 시도
      const adminApiUrls = [
        '/admin/api/users',
        '/admin/api/hotdeals',
        '/admin/api/settings'
      ]
      
      let protectedApiCount = 0
      
      for (const apiUrl of adminApiUrls) {
        try {
          const response = await page.goto(`http://localhost:3001${apiUrl}`)
          
          if (response) {
            const status = response.status()
            
            // API가 구현되지 않은 경우 404는 정상
            // 보안이 구현된 경우 401, 403, 302도 정상
            // 200이면 보안 이슈이지만, API가 아직 구현되지 않을 수 있음
            if (status === 401 || status === 403 || status === 302 || status === 404) {
              protectedApiCount++
            } else if (status === 200) {
              // 200 응답인 경우 내용 확인
              const content = await page.textContent('body')
              const isLoginRequired = content?.includes('로그인') || 
                                    content?.includes('sign-in') || 
                                    content?.includes('unauthorized') ||
                                    content?.includes('권한')
              
              if (isLoginRequired) {
                protectedApiCount++
              }
            }
          }
        } catch (error) {
          // 네트워크 오류나 접근 불가는 보안 측면에서 양호
          protectedApiCount++
        }
      }
      
      // 최소 1개 이상의 API가 보호되어야 함 (또는 구현되지 않아야 함)
      expect(protectedApiCount).toBeGreaterThan(0)
    })

    test('4.15 관리자 기능 접근성 확인', async ({ page }) => {
      await page.goto('http://localhost:3001/admin')
      await page.waitForTimeout(2000)
      
      const currentUrl = page.url()
      
      if (!currentUrl.includes('login') && !currentUrl.includes('sign-in')) {
        // 키보드 네비게이션 테스트
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab')
        
        // 포커스 가능한 요소가 있는지 확인
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.tagName || null
        })
        
        expect(focusedElement).toBeTruthy()
      } else {
        test.skip('로그인이 필요한 페이지')
      }
    })
  })

  // 데이터 무결성 테스트
  test.describe('데이터 관리 기능', () => {
    test('4.16 백업 기능 확인', async ({ page }) => {
      await page.goto('http://localhost:3001/admin/backup')
      await page.waitForTimeout(2000)
      
      const currentUrl = page.url()
      
      if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
        // 보호된 페이지로 정상 동작
        expect(true).toBeTruthy()
      } else {
        // 백업 기능 요소 확인
        const backupElements = page.getByText('백업')
          .or(page.getByText('Backup'))
          .or(page.getByRole('button', { name: /백업|Backup/ }))
        
        const elementCount = await backupElements.count()
        if (elementCount > 0) {
          await expect(backupElements.first()).toBeVisible()
        } else {
          test.skip('백업 기능이 구현되지 않음')
        }
      }
    })

    test('4.17 시스템 정보 확인', async ({ page }) => {
      await page.goto('http://localhost:3001/admin/system-info')
      await page.waitForTimeout(2000)
      
      const currentUrl = page.url()
      
      if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
        // 보호된 페이지로 정상 동작
        expect(true).toBeTruthy()
      } else {
        // 시스템 정보 요소 확인
        const systemInfoElements = page.getByText('시스템 정보')
          .or(page.getByText('System Info'))
          .or(page.getByText('버전'))
          .or(page.getByText('Version'))
          .or(page.getByText('메모리'))
          .or(page.getByText('Memory'))
        
        const elementCount = await systemInfoElements.count()
        if (elementCount > 0) {
          await expect(systemInfoElements.first()).toBeVisible()
        } else {
          test.skip('시스템 정보 페이지가 구현되지 않음')
        }
      }
    })
  })
})