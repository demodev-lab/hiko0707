import { test, expect } from './fixtures/test-base'

test.describe('Phase 1: 사용자 인증 플로우 - 간단한 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/')
  })

  test('1.1 홈페이지 로드 및 기본 UI 확인', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/HiKo/)
    
    // 헤더 로고 확인
    await expect(page.getByRole('heading', { name: 'HiKo' })).toBeVisible()
    
    // 로그인/회원가입 버튼 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible()
  })

  test('1.2 로그인 페이지 접근', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click()
    
    // URL 변경 확인
    await expect(page).toHaveURL(/login/)
    
    // Clerk 로그인 폼 요소 확인
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
    
    // 소셜 로그인 버튼 확인
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Apple/i })).toBeVisible()
  })

  test('1.3 회원가입 링크 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.getByRole('button', { name: '로그인' }).click()
    
    // 회원가입 링크 확인
    const signUpLink = page.getByRole('link', { name: 'Sign up' })
    await expect(signUpLink).toBeVisible()
    
    // 회원가입 링크 클릭
    await signUpLink.click()
    
    // Clerk 회원가입 페이지로 이동 확인
    await expect(page).toHaveURL(/sign-up/)
  })

  test('1.4 언어 변경 기능', async ({ page }) => {
    // 언어 선택 버튼 확인
    const langButton = page.getByRole('button', { name: 'KO' })
    await expect(langButton).toBeVisible()
    
    // 언어 버튼 클릭
    await langButton.click()
    
    // 언어 드롭다운 메뉴 대기
    await page.waitForTimeout(500)
    
    // 영어 옵션 확인 (드롭다운이 나타나면)
    const enOption = page.locator('text=EN').first()
    if (await enOption.isVisible()) {
      await enOption.click()
      
      // UI가 영어로 변경되었는지 확인
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 5000 })
    }
  })

  test('1.5 반응형 디자인 - 모바일 뷰', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 모바일에서도 로고가 표시되는지 확인
    await expect(page.getByRole('heading', { name: 'HiKo' })).toBeVisible()
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // 데스크톱에서도 로고가 표시되는지 확인
    await expect(page.getByRole('heading', { name: 'HiKo' })).toBeVisible()
  })

  test('1.6 보호된 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 대시보드 페이지 직접 접근 시도
    await page.goto('http://localhost:3001/dashboard')
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('1.7 푸터 정보 확인', async ({ page }) => {
    // 푸터 콘텐츠 확인
    await expect(page.getByText('한국 거주 외국인을 위한')).toBeVisible()
    await expect(page.getByText('support@hiko.kr')).toBeVisible()
    
    // 푸터 링크 확인
    await expect(page.getByRole('link', { name: '핫딜 보기' })).toBeVisible()
    await expect(page.getByRole('link', { name: '대리 구매' })).toBeVisible()
    await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible()
  })

  test('1.8 이메일 입력 필드 검증', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.getByRole('button', { name: '로그인' }).click()
    
    // 이메일 필드에 잘못된 형식 입력
    const emailInput = page.getByLabel('Email address')
    await emailInput.fill('invalid-email')
    
    // Continue 버튼 클릭
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // 입력 필드가 여전히 표시되는지 확인 (에러로 인해 다음 단계로 진행되지 않음)
    await expect(emailInput).toBeVisible()
  })

  test('1.9 테마 변경 버튼 확인', async ({ page }) => {
    // 테마 변경 버튼 확인
    const themeButton = page.getByRole('button', { name: '테마 변경' })
    await expect(themeButton).toBeVisible()
    
    // 테마 버튼 클릭 가능 확인
    await expect(themeButton).toBeEnabled()
  })

  test('1.10 기본 네비게이션 확인', async ({ page }) => {
    // 핫딜 링크 확인
    const hotDealLink = page.getByRole('link', { name: '핫딜' })
    await expect(hotDealLink).toBeVisible()
    
    // 핫딜 링크 클릭
    await hotDealLink.click()
    
    // 핫딜 페이지로 이동 확인
    await expect(page).toHaveURL(/hotdeals/)
  })
})