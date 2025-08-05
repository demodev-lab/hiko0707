'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-translations.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseTranslations() - 완전한 Supabase 기반 번역 시스템
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { data: translation } = useHotDealTranslation(hotDealId)
 * 신규: const { translation } = useSupabaseTranslations(hotDealId, language)
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '@/lib/i18n/context'
import { Translation, Language } from '@/types/hotdeal'

export function useHotDealTranslation(hotDealId: string) {
  const { language } = useLanguage()
  
  return useQuery({
    queryKey: ['translation', hotDealId, language],
    queryFn: async () => {
      if (language === 'ko') {
        // 한국어는 원본이므로 번역 불필요
        return null
      }
      
      // Deprecated - LocalStorage removed
      console.warn('useHotDealTranslation is deprecated. Use useSupabaseTranslations instead.')
      return null
    },
    enabled: !!hotDealId && language !== 'ko',
    refetchInterval: false // Deprecated hook doesn't refetch
  })
}

export function useTranslationStatus(hotDealId: string) {
  return useQuery({
    queryKey: ['translation-status', hotDealId],
    queryFn: async () => {
      // Deprecated - LocalStorage removed
      console.warn('useTranslationStatus is deprecated. Use useSupabaseTranslations instead.')
      return {}
    },
    enabled: !!hotDealId
  })
}

// 번역 시뮬레이션 함수 (실제로는 API 호출)
async function startTranslation(hotDealId: string, language: Language) {
  // Deprecated - LocalStorage removed
  console.warn('startTranslation is deprecated. Use useSupabaseTranslations instead.')
  // This function is no longer functional due to LocalStorage removal
  return
}

// 시뮬레이션용 번역 함수
function getSimulatedTranslation(title: string, description: string | undefined, language: Language) {
  const translations: Record<Language, { prefix: string; suffix: string }> = {
    ko: { prefix: '', suffix: '' },
    en: { prefix: '[EN] ', suffix: ' (English)' },
    zh: { prefix: '[中文] ', suffix: ' (中文)' },
    vi: { prefix: '[VI] ', suffix: ' (Tiếng Việt)' },
    mn: { prefix: '[MN] ', suffix: ' (Монгол)' },
    th: { prefix: '[TH] ', suffix: ' (ไทย)' },
    ja: { prefix: '[JP] ', suffix: ' (日本語)' },
    ru: { prefix: '[RU] ', suffix: ' (Русский)' }
  }
  
  const trans = translations[language]
  
  return {
    title: `${trans.prefix}${title}${trans.suffix}`,
    description: description ? `${trans.prefix}${description}${trans.suffix}` : undefined
  }
}

export function useCreateTranslation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      hotDealId: string
      language: Language
      title: string
      description?: string
    }) => {
      // Deprecated - LocalStorage removed
      console.warn('useCreateTranslation is deprecated. Use useSupabaseTranslations instead.')
      throw new Error('LocalStorage translations is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    }
  })
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      id,
      status,
      data
    }: {
      id: string
      status: Translation['status']
      data?: { title?: string; description?: string; error?: string }
    }) => {
      // Deprecated - LocalStorage removed
      console.warn('useUpdateTranslation is deprecated. Use useSupabaseTranslations instead.')
      throw new Error('LocalStorage translations is no longer supported. Please use Supabase.')
    },
    onSuccess: () => {
      // Since this is deprecated and always throws an error, this won't be called
      // but TypeScript still checks it
    }
  })
}