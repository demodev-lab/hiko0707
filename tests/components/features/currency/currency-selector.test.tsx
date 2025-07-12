import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { CurrencySelector } from '@/components/features/currency/currency-selector'
import * as currencyService from '@/lib/services/currency-service'

// Mock currency service
vi.mock('@/lib/services/currency-service', () => ({
  currencyService: {
    getSupportedCurrencies: vi.fn(() => [
      { code: 'KRW', name: '대한민국 원', symbol: '₩' },
      { code: 'USD', name: '미국 달러', symbol: '$' },
      { code: 'EUR', name: '유로', symbol: '€' },
      { code: 'CNY', name: '중국 위안', symbol: '¥' }
    ]),
    getExchangeRate: vi.fn(() => Promise.resolve(1)),
    convert: vi.fn((amount, from, to) => {
      if (from === to) return amount
      if (from === 'KRW' && to === 'USD') return amount / 1300
      if (from === 'USD' && to === 'KRW') return amount * 1300
      return amount
    }),
    setCurrency: vi.fn(),
    getCurrentCurrency: vi.fn(() => 'KRW')
  }
}))

describe('CurrencySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with current currency', () => {
    render(<CurrencySelector />)
    
    const button = screen.getByRole('button', { name: /통화 선택/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('₩ KRW')
  })

  it('shows dropdown menu when clicked', async () => {
    render(<CurrencySelector />)
    
    const button = screen.getByRole('button', { name: /통화 선택/i })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('대한민국 원')).toBeInTheDocument()
      expect(screen.getByText('미국 달러')).toBeInTheDocument()
      expect(screen.getByText('유로')).toBeInTheDocument()
      expect(screen.getByText('중국 위안')).toBeInTheDocument()
    })
  })

  it('changes currency when option is selected', async () => {
    const setCurrencySpy = vi.spyOn(currencyService.currencyService, 'setCurrency')
    
    render(<CurrencySelector />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    // Select USD
    await waitFor(() => {
      fireEvent.click(screen.getByText('미국 달러'))
    })
    
    expect(setCurrencySpy).toHaveBeenCalledWith('USD')
  })

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <CurrencySelector />
        <button>Outside button</button>
      </div>
    )
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      expect(screen.getByText('미국 달러')).toBeInTheDocument()
    })
    
    // Click outside
    fireEvent.click(screen.getByText('Outside button'))
    
    await waitFor(() => {
      expect(screen.queryByText('미국 달러')).not.toBeInTheDocument()
    })
  })

  it('shows current currency with checkmark', async () => {
    render(<CurrencySelector />)
    
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      const krwOption = screen.getByText('대한민국 원').closest('button')
      const checkIcon = krwOption?.querySelector('[data-testid="check-icon"]')
      expect(checkIcon).toBeInTheDocument()
    })
  })

  it('handles keyboard navigation', async () => {
    render(<CurrencySelector />)
    
    const button = screen.getByRole('button', { name: /통화 선택/i })
    
    // Open with Enter key
    button.focus()
    fireEvent.keyDown(button, { key: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByText('미국 달러')).toBeInTheDocument()
    })
    
    // Navigate with arrow keys
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toHaveTextContent('미국 달러')
    
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toHaveTextContent('유로')
    
    // Select with Enter
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    
    expect(currencyService.currencyService.setCurrency).toHaveBeenCalledWith('EUR')
  })

  it('closes dropdown with Escape key', async () => {
    render(<CurrencySelector />)
    
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      expect(screen.getByText('미국 달러')).toBeInTheDocument()
    })
    
    fireEvent.keyDown(document.body, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByText('미국 달러')).not.toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    render(<CurrencySelector className="custom-selector" />)
    
    const button = screen.getByRole('button', { name: /통화 선택/i })
    expect(button).toHaveClass('custom-selector')
  })

  it('shows loading state while changing currency', async () => {
    const setCurrencySpy = vi.spyOn(currencyService.currencyService, 'setCurrency')
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<CurrencySelector />)
    
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('미국 달러'))
    })
    
    // Should show loading state
    expect(screen.getByRole('button', { name: /통화 선택/i })).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /통화 선택/i })).not.toBeDisabled()
    })
  })

  it('handles error when changing currency fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(currencyService.currencyService, 'setCurrency')
      .mockRejectedValueOnce(new Error('Failed to set currency'))
    
    render(<CurrencySelector />)
    
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('미국 달러'))
    })
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to change currency:',
        expect.any(Error)
      )
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('displays correct currency format', () => {
    render(<CurrencySelector />)
    
    const button = screen.getByRole('button', { name: /통화 선택/i })
    
    // Should show symbol and code
    expect(button).toHaveTextContent('₩')
    expect(button).toHaveTextContent('KRW')
  })

  it('updates when currency changes externally', async () => {
    const { rerender } = render(<CurrencySelector />)
    
    expect(screen.getByRole('button', { name: /통화 선택/i })).toHaveTextContent('₩ KRW')
    
    // Simulate external currency change
    vi.spyOn(currencyService.currencyService, 'getCurrentCurrency').mockReturnValue('USD')
    
    rerender(<CurrencySelector />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /통화 선택/i })).toHaveTextContent('$ USD')
    })
  })

  it('supports all currencies in the service', async () => {
    const currencies = [
      { code: 'KRW', name: '대한민국 원', symbol: '₩' },
      { code: 'USD', name: '미국 달러', symbol: '$' },
      { code: 'EUR', name: '유로', symbol: '€' },
      { code: 'CNY', name: '중국 위안', symbol: '¥' },
      { code: 'JPY', name: '일본 엔', symbol: '¥' },
      { code: 'VND', name: '베트남 동', symbol: '₫' },
      { code: 'THB', name: '태국 바트', symbol: '฿' },
      { code: 'MNT', name: '몽골 투그릭', symbol: '₮' },
      { code: 'RUB', name: '러시아 루블', symbol: '₽' },
      { code: 'GBP', name: '영국 파운드', symbol: '£' }
    ]
    
    vi.spyOn(currencyService.currencyService, 'getSupportedCurrencies').mockReturnValue(currencies)
    
    render(<CurrencySelector />)
    
    fireEvent.click(screen.getByRole('button', { name: /통화 선택/i }))
    
    await waitFor(() => {
      currencies.forEach(currency => {
        expect(screen.getByText(currency.name)).toBeInTheDocument()
      })
    })
  })
})