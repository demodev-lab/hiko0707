import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { AccessibleModal } from '@/components/common/accessible-modal'

describe('AccessibleModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>
  }

  it('renders when open', () => {
    render(<AccessibleModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<AccessibleModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AccessibleModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<AccessibleModal {...defaultProps} onClose={onClose} />)
    
    const overlay = screen.getByTestId('modal-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn()
    render(<AccessibleModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.click(screen.getByText('Modal Content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape key press', () => {
    const onClose = vi.fn()
    render(<AccessibleModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('traps focus within modal', async () => {
    render(
      <AccessibleModal {...defaultProps}>
        <button>First Button</button>
        <button>Second Button</button>
      </AccessibleModal>
    )
    
    const closeButton = screen.getByRole('button', { name: '닫기' })
    const firstButton = screen.getByText('First Button')
    const secondButton = screen.getByText('Second Button')
    
    // Initial focus should be on close button
    await waitFor(() => {
      expect(document.activeElement).toBe(closeButton)
    })
    
    // Tab through focusable elements
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(firstButton)
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(secondButton)
    
    // Should cycle back to close button
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(closeButton)
  })

  it('applies custom className', () => {
    render(
      <AccessibleModal {...defaultProps} className="custom-modal" />
    )
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal')
  })

  it('renders children content correctly', () => {
    render(
      <AccessibleModal {...defaultProps}>
        <button>Content Button</button>
      </AccessibleModal>
    )
    expect(screen.getByText('Content Button')).toBeInTheDocument()
  })

  it('applies size variants correctly', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(
        <AccessibleModal {...defaultProps} size={size} />
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toMatch(new RegExp(size))
      rerender(<></>)
    })
  })

  it('prevents body scroll when open', () => {
    const { rerender } = render(<AccessibleModal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(<AccessibleModal {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('restores previous body overflow on unmount', () => {
    document.body.style.overflow = 'auto'
    
    const { unmount } = render(<AccessibleModal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('handles description prop', () => {
    render(
      <AccessibleModal {...defaultProps} description="Modal description" />
    )
    expect(screen.getByText('Modal description')).toBeInTheDocument()
  })

  it('applies correct ARIA attributes', () => {
    render(<AccessibleModal {...defaultProps} />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
    
    const title = screen.getByText('Test Modal')
    expect(title).toHaveAttribute('id', dialog.getAttribute('aria-labelledby'))
  })

  it('handles animation states', async () => {
    const { rerender } = render(<AccessibleModal {...defaultProps} />)
    
    // Check initial animation state
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('opacity-100')
    
    // Close modal
    rerender(<AccessibleModal {...defaultProps} isOpen={false} />)
    
    // Should still be in DOM during animation
    expect(screen.queryByRole('dialog')).toBeInTheDocument()
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }, { timeout: 500 })
  })
})