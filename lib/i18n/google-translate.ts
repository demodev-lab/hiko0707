import { Language } from '@/types/hotdeal'

export class GoogleTranslateClient {
  private apiKey?: string
  private apiUrl = 'https://translation.googleapis.com/language/translate/v2'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY
  }

  /**
   * 텍스트 번역
   */
  async translate(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<string> {
    // 같은 언어인 경우 그대로 반환
    if (sourceLanguage === targetLanguage) {
      return text
    }

    // Mock 번역 (실제 환경에서는 Google Translate API 사용)
    if (process.env.NODE_ENV === 'development' || !this.apiKey) {
      return this.mockTranslate(text, sourceLanguage, targetLanguage)
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey
        },
        body: JSON.stringify({
          q: text,
          source: this.getGoogleLanguageCode(sourceLanguage),
          target: this.getGoogleLanguageCode(targetLanguage),
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data.translations[0].translatedText
    } catch (error) {
      console.error('Translation error:', error)
      // 에러 시 원본 텍스트 반환
      return text
    }
  }

  /**
   * 일괄 번역
   */
  async batchTranslate(
    texts: string[],
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<string[]> {
    if (sourceLanguage === targetLanguage) {
      return texts
    }

    // Mock 번역
    if (process.env.NODE_ENV === 'development' || !this.apiKey) {
      return texts.map(text => this.mockTranslate(text, sourceLanguage, targetLanguage))
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey
        },
        body: JSON.stringify({
          q: texts,
          source: this.getGoogleLanguageCode(sourceLanguage),
          target: this.getGoogleLanguageCode(targetLanguage),
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data.translations.map((t: any) => t.translatedText)
    } catch (error) {
      console.error('Batch translation error:', error)
      return texts
    }
  }

  /**
   * Google Translate 언어 코드 변환
   */
  private getGoogleLanguageCode(language: Language): string {
    const languageMap: Record<Language, string> = {
      ko: 'ko',
      en: 'en',
      zh: 'zh-CN',
      vi: 'vi',
      mn: 'mn',
      th: 'th',
      ja: 'ja',
      ru: 'ru'
    }
    return languageMap[language] || language
  }

  /**
   * Mock 번역 (개발 환경용)
   */
  private mockTranslate(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string {
    // 간단한 접두어 방식의 Mock 번역
    const prefixMap: Record<Language, string> = {
      ko: '[KO]',
      en: '[EN]',
      zh: '[ZH]',
      vi: '[VI]',
      mn: '[MN]',
      th: '[TH]',
      ja: '[JA]',
      ru: '[RU]'
    }

    // 실제 번역 대신 언어 태그 추가
    return `${prefixMap[targetLanguage]} ${text}`
  }

  /**
   * 언어 감지
   */
  async detectLanguage(text: string): Promise<Language> {
    if (!this.apiKey || process.env.NODE_ENV === 'development') {
      // 간단한 문자 기반 감지 (개발용)
      if (/[가-힣]/.test(text)) return 'ko'
      if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
      if (/[а-яА-Я]/.test(text)) return 'ru'
      return 'en'
    }

    try {
      const response = await fetch(`${this.apiUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey
        },
        body: JSON.stringify({ q: text })
      })

      if (!response.ok) {
        throw new Error(`Language detection error: ${response.status}`)
      }

      const data = await response.json()
      const detectedLanguage = data.data.detections[0][0].language
      
      // Google 언어 코드를 우리 언어 코드로 변환
      const reverseMap: Record<string, Language> = {
        'ko': 'ko',
        'en': 'en',
        'zh-CN': 'zh',
        'zh': 'zh',
        'vi': 'vi',
        'mn': 'mn',
        'th': 'th',
        'ja': 'ja',
        'ru': 'ru'
      }

      return reverseMap[detectedLanguage] || 'en'
    } catch (error) {
      console.error('Language detection error:', error)
      return 'en'
    }
  }
}

// 싱글톤 인스턴스
export const googleTranslate = new GoogleTranslateClient()