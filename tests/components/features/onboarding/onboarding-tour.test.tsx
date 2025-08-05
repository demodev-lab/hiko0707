import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { OnboardingTour, TourStep } from '@/components/features/onboarding/onboarding-tour'

describe('OnboardingTour', () => {
  const mockSteps: TourStep[] = [
    {
      id: 'step1',
      target: '[data-test="target1"]',
      title: 'Step 1 Title',
      content: 'Step 1 Content',
      position: 'bottom'
    },
    {
      id: 'step2',
      target: '[data-test="target2"]',
      title: 'Step 2 Title',
      content: 'Step 2 Content',
      position: 'top'
    },
    {
      id: 'step3',
      target: '[data-test="target3"]',
      title: 'Step 3 Title',
      content: 'Step 3 Content',
      position: 'right'
    }
  ]

  const defaultProps = {
    steps: mockSteps,
    isActive: true,
    onComplete: vi.fn(),
    onSkip: vi.fn()
  }

  beforeEach(() => {
    // Create target elements in document
    document.body.innerHTML = `
      <div data-test="target1" style="position: absolute; top: 100px; left: 100px; width: 100px; height: 50px;">Target 1</div>
      <div data-test="target2" style="position: absolute; top: 200px; left: 200px; width: 100px; height: 50px;">Target 2</div>
      <div data-test="target3" style="position: absolute; top: 300px; left: 300px; width: 100px; height: 50px;">Target 3</div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders when active', () => {
    render(<OnboardingTour {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Step 1 Title')).toBeInTheDocument()
    expect(screen.getByText('Step 1 Content')).toBeInTheDocument()
  })

  it('does not render when inactive', () => {
    render(<OnboardingTour {...defaultProps} isActive={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates through steps with next button', async () => {
    render(<OnboardingTour {...defaultProps} />)
    
    // Initially on step 1
    expect(screen.getByText('Step 1 Title')).toBeInTheDocument()
    expect(screen.getByText('단계 1 / 3')).toBeInTheDocument()
    
    // Click next
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    
    // Should be on step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument()
      expect(screen.getByText('단계 2 / 3')).toBeInTheDocument()
    })
    
    // Click next again
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    
    // Should be on step 3
    await waitFor(() => {
      expect(screen.getByText('Step 3 Title')).toBeInTheDocument()
      expect(screen.getByText('단계 3 / 3')).toBeInTheDocument()
    })
  })

  it('navigates back with previous button', async () => {
    render(<OnboardingTour {...defaultProps} />)
    
    // Navigate to step 2 first
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() => {
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument()
    })
    
    // Click previous
    fireEvent.click(screen.getByRole('button', { name: '이전' }))
    
    // Should be on step 1
    await waitFor(() => {
      expect(screen.getByText('Step 1 Title')).toBeInTheDocument()
    })
  })

  it('completes tour on last step', async () => {
    const onComplete = vi.fn()
    render(<OnboardingTour {...defaultProps} onComplete={onComplete} />)
    
    // Navigate to last step
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() => {
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() => {
      expect(screen.getByText('Step 3 Title')).toBeInTheDocument()
    })
    
    // On last step, button should say "완료"
    expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument()
    
    // Click complete
    fireEvent.click(screen.getByRole('button', { name: '완료' }))
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onSkip when skip button is clicked', async () => {
    const onSkip = vi.fn()
    render(<OnboardingTour {...defaultProps} onSkip={onSkip} />)
    
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    
    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('handles keyboard navigation', async () => {
    render(<OnboardingTour {...defaultProps} />)
    
    // Press right arrow to go next
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    
    await waitFor(() => {
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument()
    })
    
    // Press left arrow to go back
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    
    await waitFor(() => {
      expect(screen.getByText('Step 1 Title')).toBeInTheDocument()
    })
    
    // Press Escape to skip
    const onSkip = vi.fn()
    render(<OnboardingTour {...defaultProps} onSkip={onSkip} />)
    
    fireEvent.keyDown(document.body, { key: 'Escape' })
    
    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('highlights target element', () => {
    render(<OnboardingTour {...defaultProps} />)
    
    // The component creates a highlight overlay, not adding a class to the target
    const highlight = document.querySelector('.border-blue-500')
    expect(highlight).toBeInTheDocument()
    expect(highlight).toHaveClass('rounded-lg')
  })

  it('positions tooltip correctly', () => {
    render(<OnboardingTour {...defaultProps} />)
    
    const tooltip = screen.getByRole('dialog')
    const style = window.getComputedStyle(tooltip)
    
    // Should be positioned below target1 (position: 'bottom')
    expect(parseInt(style.top)).toBeGreaterThan(100) // target1 top + height
  })

  it('shows progress bar when enabled', () => {
    render(<OnboardingTour {...defaultProps} showProgress={true} />)
    
    // Check progress text
    expect(screen.getByText('단계 1 / 3')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument()
    
    // Check progress bar element
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '33.333333333333336%' })
  })

  it('hides progress bar when disabled', () => {
    render(<OnboardingTour {...defaultProps} showProgress={false} />)
    
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('handles missing target elements gracefully', () => {
    const stepsWithMissingTarget = [
      {
        id: 'missing',
        target: '[data-test="nonexistent"]',
        title: 'Missing Target',
        content: 'This target does not exist',
        position: 'bottom' as const
      }
    ]
    
    render(
      <OnboardingTour
        {...defaultProps}
        steps={stepsWithMissingTarget}
      />
    )
    
    // Should still render the tour
    expect(screen.getByText('Missing Target')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('updates position on window resize', async () => {
    render(<OnboardingTour {...defaultProps} />)
    
    const initialTooltip = screen.getByRole('dialog')
    const initialTop = window.getComputedStyle(initialTooltip).top
    
    // Move target element
    const targetElement = document.querySelector('[data-test="target1"]') as HTMLElement
    targetElement.style.top = '200px'
    
    // Trigger resize
    fireEvent(window, new Event('resize'))
    
    await waitFor(() => {
      const updatedTooltip = screen.getByRole('dialog')
      const updatedTop = window.getComputedStyle(updatedTooltip).top
      expect(updatedTop).not.toBe(initialTop)
    })
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<OnboardingTour {...defaultProps} />)
    
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('applies custom className', () => {
    render(<OnboardingTour {...defaultProps} className="custom-tour" />)
    
    const tooltip = screen.getByRole('dialog')
    expect(tooltip).toHaveClass('custom-tour')
  })
})