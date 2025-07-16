'use client'

import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrency } from '@/hooks/use-currency'
import { Currency } from '@/lib/services/currency-service'

export function MobileCurrencySelector() {
  const { currencies, selectedCurrency, changeCurrency } = useCurrency()
  
  const currentCurrency = currencies.find(c => c.code === selectedCurrency)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 px-2.5 flex items-center gap-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="text-base">{currentCurrency?.flag}</span>
          <span className="text-xs font-medium">{currentCurrency?.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency: Currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => changeCurrency(currency.code)}
            className={`cursor-pointer ${currency.code === selectedCurrency ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          >
            <span className="mr-2 text-lg">{currency.flag}</span>
            <span className="flex-1">{currency.name}</span>
            <span className="text-xs text-muted-foreground font-medium">{currency.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}