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
      <DialogContent className="max-w-lg sm:max-w-xl p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="w-5 h-5 text-blue-600" />
            실시간 환율 계산기
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            한국 쇼핑 가격을 여러분의 통화로 확인하세요
          </p>
        </DialogHeader>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="max-w-md mx-auto">
            <CurrencyCalculator isEmbedded={true} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}