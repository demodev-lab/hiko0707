'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CurrencyCalculator } from '@/components/features/currency-calculator'
import { Calculator } from 'lucide-react'

interface CurrencyCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyCalculatorModal({ open, onOpenChange }: CurrencyCalculatorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-5 h-5" />
            실시간 환율 계산기
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600 mb-6">
            한국 원화를 여러분의 통화로 바로 환산해보세요. 쇼핑 전 가격을 미리 확인할 수 있습니다.
          </p>
          <CurrencyCalculator isEmbedded={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}