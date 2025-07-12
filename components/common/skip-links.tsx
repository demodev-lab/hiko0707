'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'

export function SkipLinks() {
  const { t } = useLanguage()

  return (
    <div className="sr-only focus-within:not-sr-only">
      <Link
        href="#main-content"
        className="absolute top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {t('accessibility.skipToMain')}
      </Link>
      <Link
        href="#navigation"
        className="absolute top-0 left-20 z-50 bg-blue-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {t('accessibility.skipToNavigation')}
      </Link>
      <Link
        href="#footer"
        className="absolute top-0 left-40 z-50 bg-blue-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {t('accessibility.skipToFooter')}
      </Link>
    </div>
  )
}