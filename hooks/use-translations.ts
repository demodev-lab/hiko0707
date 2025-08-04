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
import { db } from '@/lib/db/database-service'
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
      
      const translation = await db.translations.findByHotDealAndLanguage(hotDealId, language)
      
      // 번역이 없거나 실패/대기 상태면 번역 시작
      if (!translation || translation.status === 'failed' || translation.status === 'pending') {
        // 번역 작업 시작 (실제로는 백엔드 API 호출)
        await startTranslation(hotDealId, language)
      }
      
      return translation
    },
    enabled: !!hotDealId && language !== 'ko',
    refetchInterval: (query) => {
      // 번역 중인 경우 3초마다 다시 확인
      const translation = query.state.data
      if (translation?.status === 'translating' || translation?.status === 'pending') {
        return 3000
      }
      return false
    }
  })
}

export function useTranslationStatus(hotDealId: string) {
  return useQuery({
    queryKey: ['translation-status', hotDealId],
    queryFn: async () => {
      return await db.translations.getTranslationStatus(hotDealId)
    },
    enabled: !!hotDealId
  })
}

// 번역 시뮬레이션 함수 (실제로는 API 호출)
async function startTranslation(hotDealId: string, language: Language) {
  const existingTranslation = await db.translations.findByHotDealAndLanguage(hotDealId, language)
  
  if (existingTranslation?.status === 'translating') {
    return // 이미 번역 중
  }
  
  const hotdeal = await db.hotdeals.findById(hotDealId)
  if (!hotdeal) return
  
  // 번역 시작
  let translationId: string
  
  if (existingTranslation) {
    await db.translations.updateTranslationStatus(existingTranslation.id, 'translating')
    translationId = existingTranslation.id
  } else {
    const newTranslation = await db.translations.createTranslation({
      hotDealId,
      language,
      status: 'translating'
    })
    translationId = newTranslation.id
  }
  
  // 3초 후에 번역 완료 시뮬레이션
  setTimeout(async () => {
    const translations = getSimulatedTranslation(hotdeal.title, hotdeal.productComment, language)
    
    await db.translations.updateTranslationStatus(
      translationId,
      'completed',
      {
        title: translations.title,
        description: translations.description
      }
    )
  }, 3000)
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
      return await db.translations.createTranslation({
        ...data,
        status: 'completed'
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['translation', data.hotDealId, data.language] })
      queryClient.invalidateQueries({ queryKey: ['translation-status', data.hotDealId] })
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
      return await db.translations.updateTranslationStatus(id, status, data)
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['translation', data.hotDealId, data.language] })
        queryClient.invalidateQueries({ queryKey: ['translation-status', data.hotDealId] })
      }
    }
  })
}