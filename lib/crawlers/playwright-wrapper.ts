// Playwright MCP 래퍼 클래스
// 모든 브라우저 조작을 추상화하여 크롤러들이 쉽게 사용할 수 있도록 함

export interface NavigateOptions {
  url: string
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
  timeout?: number
}

export interface ScreenshotOptions {
  name: string
  fullPage?: boolean
  selector?: string
}

export interface EvaluateResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class PlaywrightWrapper {
  private isInitialized = false
  
  constructor() {}
  
  // 브라우저 초기화
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      console.log('🌐 Playwright 브라우저 초기화...')
      // 브라우저는 navigate 시 자동으로 초기화됨
      this.isInitialized = true
    } catch (error) {
      console.error('브라우저 초기화 실패:', error)
      throw error
    }
  }
  
  // 페이지 이동
  async navigate(options: NavigateOptions): Promise<boolean> {
    try {
      console.log(`📍 페이지 이동: ${options.url}`)
      
      // 클라이언트 환경에서만 실행
      if (typeof window !== 'undefined') {
        // @ts-ignore - MCP 함수는 전역에 주입됨
        if (typeof mcp__playwright__playwright_navigate === 'function') {
          await mcp__playwright__playwright_navigate({
            url: options.url,
            waitUntil: options.waitUntil,
            timeout: options.timeout,
            headless: false // 크롤링 디버깅을 위해 헤드리스 모드 비활성화
          })
          
          this.isInitialized = true
          return true
        } else {
          console.error('Playwright MCP 함수를 찾을 수 없습니다')
          return false
        }
      } else {
        console.error('서버 환경에서는 Playwright MCP를 실행할 수 없습니다')
        return false
      }
    } catch (error) {
      console.error('페이지 이동 실패:', error)
      return false
    }
  }
  
  // 요소 클릭
  async click(selector: string): Promise<boolean> {
    try {
      console.log(`🖱️ 클릭: ${selector}`)
      
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (typeof mcp__playwright__playwright_click === 'function') {
          await mcp__playwright__playwright_click({ selector })
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('클릭 실패:', error)
      return false
    }
  }
  
  // JavaScript 실행
  async evaluate<T = any>(script: string): Promise<EvaluateResult<T>> {
    try {
      console.log(`📊 스크립트 실행...`)
      
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (typeof mcp__playwright__playwright_evaluate === 'function') {
          const result = await mcp__playwright__playwright_evaluate({ script })
          return { success: true, data: result }
        }
      }
      
      return { 
        success: false, 
        error: '클라이언트 환경이 아니거나 MCP 함수를 찾을 수 없습니다' 
      }
    } catch (error) {
      console.error('스크립트 실행 실패:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '스크립트 실행 실패' 
      }
    }
  }
  
  // 요소 대기
  async waitForSelector(selector: string, timeout: number = 10000): Promise<boolean> {
    try {
      console.log(`⏳ 요소 대기: ${selector}`)
      
      // evaluate를 사용하여 요소 존재 확인
      const checkScript = `
        (function() {
          const element = document.querySelector('${selector}');
          return !!element;
        })();
      `
      
      const startTime = Date.now()
      while (Date.now() - startTime < timeout) {
        const result = await this.evaluate<boolean>(checkScript)
        if (result.success && result.data) {
          return true
        }
        await this.delay(100)
      }
      
      return false
    } catch (error) {
      console.error('요소 대기 실패:', error)
      return false
    }
  }
  
  // 스크린샷 촬영
  async screenshot(options: ScreenshotOptions): Promise<string | null> {
    try {
      console.log(`📸 스크린샷: ${options.name}`)
      
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (typeof mcp__playwright__playwright_screenshot === 'function') {
          const result = await mcp__playwright__playwright_screenshot({
            name: options.name,
            fullPage: options.fullPage || false,
            selector: options.selector,
            storeBase64: true
          })
          return result?.base64 || null
        }
      }
      
      return null
    } catch (error) {
      console.error('스크린샷 실패:', error)
      return null
    }
  }
  
  // 브라우저 종료
  async close(): Promise<void> {
    try {
      console.log('🔚 브라우저 종료...')
      
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (typeof mcp__playwright__playwright_close === 'function') {
          await mcp__playwright__playwright_close({})
        }
      }
      
      this.isInitialized = false
    } catch (error) {
      console.error('브라우저 종료 실패:', error)
    }
  }
  
  // 딜레이
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // 현재 URL 가져오기
  async getCurrentUrl(): Promise<string | null> {
    try {
      const result = await this.evaluate<string>('window.location.href')
      return result.success ? result.data : null
    } catch (error) {
      console.error('URL 가져오기 실패:', error)
      return null
    }
  }
  
  // 페이지 타이틀 가져오기
  async getTitle(): Promise<string | null> {
    try {
      const result = await this.evaluate<string>('document.title')
      return result.success ? result.data : null
    } catch (error) {
      console.error('타이틀 가져오기 실패:', error)
      return null
    }
  }
}

// 싱글톤 인스턴스
export const playwrightWrapper = new PlaywrightWrapper()