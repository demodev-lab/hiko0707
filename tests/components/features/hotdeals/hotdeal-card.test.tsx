import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { HotDealCard } from '@/components/features/hotdeal/hotdeal-card'
import { createMockHotDeal } from '@/tests/utils/test-utils'
import { currencyService } from '@/lib/services/currency-service'

// Mock is already in setup.ts

// Mock currency service
vi.mock('@/lib/services/currency-service', () => ({
  currencyService: {
    getCurrentCurrency: vi.fn(() => 'KRW'),
    convert: vi.fn((amount: number) => amount),
    formatPrice: vi.fn((amount: number, currency: string) => {
      if (currency === 'KRW') return `₩${amount.toLocaleString()}`
      return `$${amount}`
    })
  }
}))

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('HotDealCard', () => {
  const mockHotDeal = createMockHotDeal({
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
    render(<HotDealCard deal={mockHotDeal} />)
    
    expect(screen.getByText('Test Hot Deal')).toBeInTheDocument()
    expect(screen.getByText('₩50,000')).toBeInTheDocument()
    expect(screen.getByText('₩100,000')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByAltText('Test Hot Deal')).toBeInTheDocument()
  })

  it('displays view, like, and comment counts', () => {
    render(<HotDealCard deal={mockHotDeal} />)
    
    expect(screen.getByText('1,234')).toBeInTheDocument() // views
    expect(screen.getByText('56')).toBeInTheDocument() // likes
    expect(screen.getByText('12')).toBeInTheDocument() // comments
  })

  it('shows category and source badges', () => {
    render(<HotDealCard deal={mockHotDeal} />)
    
    expect(screen.getByText('전자제품')).toBeInTheDocument()
    expect(screen.getByText('뽐뿌')).toBeInTheDocument()
  })

  it('navigates to detail page when clicked', () => {
    render(<HotDealCard deal={mockHotDeal} />)
    
    const card = screen.getByRole('article')
    fireEvent.click(card)
    
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
  })

  it('handles like button click', async () => {
    const onLike = vi.fn()
    render(<HotDealCard deal={mockHotDeal} onLike={onLike} />)
    
    const likeButton = screen.getByRole('button', { name: /좋아요/i })
    fireEvent.click(likeButton)
    
    await waitFor(() => {
      expect(onLike).toHaveBeenCalledWith('1')
    })
  })

  it('prevents navigation when like button is clicked', () => {
    const onLike = vi.fn()
    render(<HotDealCard deal={mockHotDeal} onLike={onLike} />)
    
    const likeButton = screen.getByRole('button', { name: /좋아요/i })
    fireEvent.click(likeButton)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows liked state', () => {
    render(<HotDealCard deal={mockHotDeal} isLiked={true} />)
    
    const likeButton = screen.getByRole('button', { name: /좋아요 취소/i })
    expect(likeButton).toHaveClass('text-red-500')
  })

  it('handles share button click', async () => {
    const onShare = vi.fn()
    render(<HotDealCard deal={mockHotDeal} onShare={onShare} />)
    
    const shareButton = screen.getByRole('button', { name: /공유/i })
    fireEvent.click(shareButton)
    
    await waitFor(() => {
      expect(onShare).toHaveBeenCalledWith('1')
    })
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('formats time ago correctly', () => {
    const recentDeal = createMockHotDeal({
      crawledAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    })
    
    render(<HotDealCard hotdeal={recentDeal} />)
    expect(screen.getByText(/5분 전/)).toBeInTheDocument()
  })

  it('shows sold out state', () => {
    const soldOutDeal = createMockHotDeal({
      isSoldOut: true
    })
    
    render(<HotDealCard hotdeal={soldOutDeal} />)
    
    expect(screen.getByText('품절')).toBeInTheDocument()
    const card = screen.getByRole('article')
    expect(card).toHaveClass('opacity-50')
  })

  it('handles missing image gracefully', () => {
    const dealWithoutImage = createMockHotDeal({
      imageUrl: undefined
    })
    
    render(<HotDealCard hotdeal={dealWithoutImage} />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/placeholder-product.png')
  })

  it('truncates long titles', () => {
    const longTitleDeal = createMockHotDeal({
      title: 'This is a very long title that should be truncated when displayed in the card to prevent layout issues and maintain consistency'
    })
    
    render(<HotDealCard hotdeal={longTitleDeal} />)
    
    const title = screen.getByText(/This is a very long title/)
    expect(title).toHaveClass('line-clamp-2')
  })

  it('applies hover effects', () => {
    render(<HotDealCard deal={mockHotDeal} />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('hover:shadow-lg')
    expect(card).toHaveClass('hover:-translate-y-1')
  })

  it('shows different view modes', () => {
    // Grid view (default)
    const { rerender } = render(<HotDealCard deal={mockHotDeal} />)
    expect(screen.getByRole('article')).toHaveClass('flex-col')
    
    // List view
    rerender(<HotDealCard deal={mockHotDeal} view="list" />)
    expect(screen.getByRole('article')).toHaveClass('flex-row')
  })

  it('converts price based on current currency', () => {
    vi.spyOn(currencyService, 'getCurrentCurrency').mockReturnValue('USD')
    vi.spyOn(currencyService, 'convert').mockReturnValue(38.46)
    vi.spyOn(currencyService, 'formatPrice').mockReturnValue('$38.46')
    
    render(<HotDealCard deal={mockHotDeal} />)
    
    expect(screen.getByText('$38.46')).toBeInTheDocument()
    expect(currencyService.convert).toHaveBeenCalledWith(50000, 'KRW', 'USD')
  })

  it('handles keyboard navigation', () => {
    render(<HotDealCard deal={mockHotDeal} />)
    
    const card = screen.getByRole('article')
    card.focus()
    
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
    
    mockPush.mockClear()
    
    fireEvent.keyDown(card, { key: ' ' })
    expect(mockPush).toHaveBeenCalledWith('/hotdeals/1')
  })

  it('shows loading skeleton when loading', () => {
    render(<HotDealCard deal={mockHotDeal} loading />)
    
    expect(screen.getByTestId('hotdeal-card-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Test Hot Deal')).not.toBeInTheDocument()
  })

  it('handles priority prop for different importance levels', () => {
    const { rerender } = render(<HotDealCard deal={mockHotDeal} priority="high" />)
    
    let card = screen.getByRole('article')
    expect(card).toHaveClass('border-2')
    expect(card).toHaveClass('border-red-500')
    
    rerender(<HotDealCard deal={mockHotDeal} priority="normal" />)
    card = screen.getByRole('article')
    expect(card).not.toHaveClass('border-2')
  })

  it('shows expiry warning for deals ending soon', () => {
    const expiringDeal = createMockHotDeal({
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 minutes from now
    })
    
    render(<HotDealCard hotdeal={expiringDeal} />)
    
    expect(screen.getByText(/곧 종료/)).toBeInTheDocument()
    expect(screen.getByText(/곧 종료/)).toHaveClass('text-orange-600')
  })

  it('applies custom className', () => {
    render(<HotDealCard deal={mockHotDeal} className="custom-card" />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('custom-card')
  })
})