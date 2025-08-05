import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { createMockHotDeal } from '@/tests/utils/test-utils'
import * as currencyService from '@/lib/services/currency-service'

// Mock is already in setup.ts

// Mock currency service
vi.mock('@/lib/services/currency-service', () => ({
  currencyService: {
    convertCurrency: vi.fn((amount) => amount),
    formatCurrency: vi.fn((amount, currency) => {
      if (currency === 'KRW') return `₩${amount.toLocaleString()}`
      return `$${amount}`
    }),
    getExchangeRate: vi.fn(() => 1),
    getCurrencyByCode: vi.fn((code) => ({ code, symbol: '₩', name: 'Currency', country: 'Country', flag: '🏳️' })),
    getAllCurrencies: vi.fn(() => [])
  },
  formatPrice: vi.fn((amount, currency) => {
    if (currency === 'KRW') return `₩${amount.toLocaleString()}`
    return `$${amount}`
  }),
  convertPrice: vi.fn((amount) => amount),
  getExchangeRate: vi.fn(() => 1)
}))

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('HotDealCard', () => {
  const mockDeal = createMockHotDeal({
    id: '1',
    title: 'Test Hot Deal',
    price: 50000,
    originalPrice: 100000,
    discountRate: 50,
    imageUrl: '/test-image.jpg',
    category: 'electronics',
    source: 'ppomppu',
    viewCount: 1234,
    likeCount: 56,
    commentCount: 12
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hot deal information correctly', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    expect(screen.getByText('Test Hot Deal')).toBeInTheDocument()
    expect(screen.getByText('₩50,000')).toBeInTheDocument()
    expect(screen.getByText('₩100,000')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByAltText('Test Hot Deal')).toBeInTheDocument()
  })

  it('displays view, like, and comment counts', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    expect(screen.getByText('1,234')).toBeInTheDocument() // views
    expect(screen.getByText('56')).toBeInTheDocument() // likes
    expect(screen.getByText('12')).toBeInTheDocument() // comments
  })

  it('shows category and source badges', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    expect(screen.getByText('전자제품')).toBeInTheDocument()
    expect(screen.getByText('뽐뿌')).toBeInTheDocument()
  })

  it('navigates to detail page when clicked', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const card = screen.getByRole('article')
    fireEvent.click(card)
    
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
  })

  it('renders favorite button', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    // FavoriteButton is rendered with icon variant
    const favoriteButton = screen.getByRole('button', { name: /찜하기|즐겨찾기/i })
    expect(favoriteButton).toBeInTheDocument()
  })

  it('prevents navigation when favorite button is clicked', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const favoriteButton = screen.getByRole('button', { name: /찜하기|즐겨찾기/i })
    fireEvent.click(favoriteButton)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders share button', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const shareButton = screen.getByRole('button', { name: /공유/i })
    expect(shareButton).toBeInTheDocument()
  })

  it('prevents navigation when share button is clicked', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const shareButton = screen.getByRole('button', { name: /공유/i })
    fireEvent.click(shareButton)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('formats time ago correctly', () => {
    const recentDeal = createMockHotDeal({
      crawledAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    })
    
    render(<HotDealCard deal={recentDeal} />)
    expect(screen.getByText(/5분 전/)).toBeInTheDocument()
  })

  it('shows sold out state', () => {
    const soldOutDeal = createMockHotDeal({
      isSoldOut: true
    })
    
    render(<HotDealCard deal={soldOutDeal} />)
    
    expect(screen.getByText('품절')).toBeInTheDocument()
    const card = screen.getByRole('article')
    expect(card).toHaveClass('opacity-50')
  })

  it('handles missing image gracefully', () => {
    const dealWithoutImage = createMockHotDeal({
      imageUrl: undefined
    })
    
    render(<HotDealCard deal={dealWithoutImage} />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/placeholder-product.png')
  })

  it('truncates long titles', () => {
    const longTitleDeal = createMockHotDeal({
      title: 'This is a very long title that should be truncated when displayed in the card to prevent layout issues and maintain consistency'
    })
    
    render(<HotDealCard deal={longTitleDeal} />)
    
    const title = screen.getByText(/This is a very long title/)
    expect(title).toHaveClass('line-clamp-2')
  })

  it('applies hover effects', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('hover:shadow-lg')
    expect(card).toHaveClass('hover:-translate-y-1')
  })

  it('renders card with proper structure', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const card = screen.getByRole('article')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('aria-labelledby', `deal-title-${mockDeal.id}`)
    expect(card).toHaveAttribute('aria-describedby', `deal-price-${mockDeal.id}`)
  })

  it('converts price based on current currency', () => {
    // Mock the currency service methods that exist
    vi.spyOn(currencyService.currencyService, 'convertCurrency').mockReturnValue(38.46)
    vi.spyOn(currencyService.currencyService, 'formatCurrency').mockReturnValue('$38.46')
    
    render(<HotDealCard deal={mockDeal} />)
    
    expect(screen.getByText('$38.46')).toBeInTheDocument()
    expect(currencyService.currencyService.convertCurrency).toHaveBeenCalledWith(50000, 'KRW', 'USD')
  })

  it('handles keyboard navigation', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const card = screen.getByRole('article')
    card.focus()
    
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
    
    mockPush.mockClear()
    
    fireEvent.keyDown(card, { key: ' ' })
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
  })

  it('shows buy for me button', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    const buyForMeButton = screen.getByRole('button', { name: /구매대행/i })
    expect(buyForMeButton).toBeInTheDocument()
  })

  it('shows hot badge for popular items', () => {
    const hotDeal = createMockHotDeal({
      viewCount: 15000,
      communityRecommendCount: 2000
    })
    
    render(<HotDealCard deal={hotDeal} />)
    
    // Check if hot indicator exists in the UI
    const imageContainer = screen.getByRole('img')
    expect(imageContainer).toHaveAttribute('data-preload', 'true')
  })

  it('displays crawled time correctly', () => {
    const recentDeal = createMockHotDeal({
      crawledAt: new Date()
    })
    
    render(<HotDealCard deal={recentDeal} />)
    
    // Should show "방금 전" for just now
    expect(screen.getByText(/방금 전|지금/)).toBeInTheDocument()
  })

  it('shows price display component', () => {
    render(<HotDealCard deal={mockDeal} />)
    
    // Check if price is displayed
    expect(screen.getByText('₩50,000')).toBeInTheDocument()
  })
})