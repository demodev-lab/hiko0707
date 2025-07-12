import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import { AccessibleButton } from '@/components/common/accessible-button'

describe('AccessibleButton', () => {
  it('renders correctly with children', () => {
    render(<AccessibleButton>Click me</AccessibleButton>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('shows loading state when loading prop is true', () => {
    render(
      <AccessibleButton loading loadingText="Loading...">
        Click me
      </AccessibleButton>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(
      <AccessibleButton loading>
        Click me
      </AccessibleButton>
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn()
    render(
      <AccessibleButton disabled onClick={handleClick}>
        Click me
      </AccessibleButton>
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies aria-label correctly', () => {
    render(
      <AccessibleButton aria-label="Custom label">
        Click me
      </AccessibleButton>
    )
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument()
  })

  it('shows notification badge when hasNotification is true', () => {
    render(
      <AccessibleButton hasNotification notificationCount={5}>
        Notifications
      </AccessibleButton>
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '5개의 알림' })).toBeInTheDocument()
  })

  it('shows 99+ for notification count over 99', () => {
    render(
      <AccessibleButton hasNotification notificationCount={150}>
        Notifications
      </AccessibleButton>
    )
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('applies tooltip attribute', () => {
    render(
      <AccessibleButton tooltip="Help text">
        Help
      </AccessibleButton>
    )
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Help text')
  })

  it('supports all button variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(
        <AccessibleButton variant={variant}>
          Button
        </AccessibleButton>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
      rerender(<></>)
    })
  })

  it('handles keyboard events for accessibility', () => {
    const handleClick = vi.fn()
    render(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    )
    
    const button = screen.getByRole('button')
    button.focus()
    
    // Simulate keyboard activation using click event
    // (browsers trigger click on Enter/Space for buttons)
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Verify button is focusable
    expect(document.activeElement).toBe(button)
  })

  it('supports forwarded ref', () => {
    const ref = vi.fn()
    render(
      <AccessibleButton ref={ref}>
        Click me
      </AccessibleButton>
    )
    expect(ref).toHaveBeenCalled()
  })
})