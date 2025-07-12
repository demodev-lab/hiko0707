'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { TranslatedContent } from '@/components/features/translation/translated-content'
import { HotDeal } from '@/types/hotdeal'

interface ProductCommentProps {
  hotDeal: HotDeal
}

export function ProductComment({ hotDeal }: ProductCommentProps) {
  if (!hotDeal.productComment) {
    return null
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>쇼핑 코멘트</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-gray-700">
          <TranslatedContent 
            hotDeal={hotDeal} 
            field="productComment" 
            showIndicator={true}
          />
        </div>
      </CardContent>
    </Card>
  )
}