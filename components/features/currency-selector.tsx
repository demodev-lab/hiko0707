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

export function CurrencySelector() {
  const { selectedCurrency, currencies, changeCurrency } = useCurrency()
  
  const currentCurrency = currencies.find(c => c.code === selectedCurrency)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {currentCurrency?.flag} {currentCurrency?.code}
          </span>
          <span className="sm:hidden">{currentCurrency?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency: Currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => changeCurrency(currency.code)}
            className="cursor-pointer"
          >
            <span className="mr-2">{currency.flag}</span>
            <span className="flex-1">{currency.name}</span>
            <span className="text-xs text-muted-foreground">{currency.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}