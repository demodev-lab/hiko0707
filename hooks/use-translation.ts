'use client'

import { useLanguage } from '@/lib/i18n/context'

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage()
  
  return {
    t,
    language,
    setLanguage,
  }
}