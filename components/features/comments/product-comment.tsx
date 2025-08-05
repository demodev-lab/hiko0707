'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { TranslatedContent } from '@/components/features/translation/translated-content'
import { HotDeal } from '@/types/hotdeal'

interface ProductCommentProps {
  hotDeal: HotDeal
}

export function ProductComment({ hotDeal }: ProductCommentProps) {
  // productComment 필드는 현재 Supabase 스키마에 없으므로 숨김
  return null
}