'use client'

import { NotFound } from '@/components/ui/error'
import { useTranslation } from '@/hooks/use-translation'

export default function NotFoundPage() {
  const { t } = useTranslation()
  
  return (
    <NotFound
      title={t('error.pageNotFound')}
      message={t('error.pageNotFoundMessage')}
      showSearch={true}
      showPopularLinks={true}
    />
  )
}