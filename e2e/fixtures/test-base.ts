import { test as base } from '@playwright/test'

// 다국어 테스트를 위한 fixture
type TestFixtures = {
  locale: 'en' | 'ko' | 'zh' | 'vi' | 'mn' | 'th' | 'ja' | 'ru'
}

export const test = base.extend<TestFixtures>({
  locale: ['ko', { option: true }],
  
  page: async ({ page, locale }, use) => {
    // 로케일에 따른 Accept-Language 헤더 설정
    await page.setExtraHTTPHeaders({
      'Accept-Language': locale,
    })
    
    // 쿠키로 언어 설정
    await page.context().addCookies([{
      name: 'locale',
      value: locale,
      domain: 'localhost',
      path: '/',
    }])
    
    await use(page)
  },
})

export { expect } from '@playwright/test'