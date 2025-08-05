'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
import { useLanguage } from '@/lib/i18n/context'
import type { Database } from '@/database.types'

type TranslationRow = Database['public']['Tables']['hotdeal_translations']['Row']
type TranslationInsert = Database['public']['Tables']['hotdeal_translations']['Insert']
type TranslationUpdate = Database['public']['Tables']['hotdeal_translations']['Update']

export function useHotDealTranslation(hotDealId: string) {
  const { language } = useLanguage()
  
  return useQuery({
    queryKey: ['translation', hotDealId, language],
    queryFn: async () => {
      if (language === 'ko') {
        // 한국어는 원본이므로 번역 불필요
        return null
      }
      
      let translation = await SupabaseHotDealService.getTranslation(hotDealId, language)
      
      // 번역이 없으면 생성
      if (!translation) {
        const hotdeal = await SupabaseHotDealService.getHotDealById(hotDealId)
        if (!hotdeal) return null
        
        // 시뮬레이션 번역 즉시 생성
        const translations = getSimulatedTranslation(hotdeal.title, hotdeal.shopping_comment || '', language)
        
        translation = await SupabaseHotDealService.createTranslation({
          hotdeal_id: hotDealId,
          language: language,
          title: translations.title,
          description: translations.description,
          is_auto_translated: true
        })
      }
      
      return translation
    },
    enabled: !!hotDealId && language !== 'ko',
    staleTime: 60 * 60 * 1000, // 1시간
  })
}

export function useTranslationStatus(hotDealId: string) {
  return useQuery({
    queryKey: ['translation-status', hotDealId],
    queryFn: async () => {
      return await SupabaseHotDealService.getTranslationStatus(hotDealId)
    },
    enabled: !!hotDealId
  })
}

// 시뮬레이션용 번역 함수
function getSimulatedTranslation(title: string, description: string, language: string) {
  const translations: Record<string, { prefix: string; suffix: string }> = {
    ko: { prefix: '', suffix: '' },
    en: { prefix: '[EN] ', suffix: ' (English)' },
    zh: { prefix: '[中文] ', suffix: ' (中文)' },
    vi: { prefix: '[VI] ', suffix: ' (Tiếng Việt)' },
    mn: { prefix: '[MN] ', suffix: ' (Монгол)' },
    th: { prefix: '[TH] ', suffix: ' (ไทย)' },
    ja: { prefix: '[JP] ', suffix: ' (日本語)' },
    ru: { prefix: '[RU] ', suffix: ' (Русский)' }
  }
  
  const trans = translations[language] || translations.en
  
  return {
    title: `${trans.prefix}${title}${trans.suffix}`,
    description: description ? `${trans.prefix}${description}${trans.suffix}` : undefined
  }
}

export function useCreateTranslation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: TranslationInsert) => {
      return await SupabaseHotDealService.createTranslation(data)
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['translation', data.hotdeal_id, data.language] })
        queryClient.invalidateQueries({ queryKey: ['translation-status', data.hotdeal_id] })
      }
    }
  })
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: TranslationUpdate
    }) => {
      return await SupabaseHotDealService.updateTranslation(id, updates)
    },
    onSuccess: (data, { id }) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['translation', data.hotdeal_id, data.language] })
        queryClient.invalidateQueries({ queryKey: ['translation-status', data.hotdeal_id] })
      }
    }
  })
}