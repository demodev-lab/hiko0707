'use client'

import { useLanguage } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/common/language-selector'

export function HotDealHeader() {
  const { t } = useLanguage()
  
  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔥 {t('hotdeals.title')}</h1>
        <p className="text-gray-600">
          {t('hotdeals.subtitle')}
        </p>
      </div>
      <LanguageSelector />
    </div>
  )
}