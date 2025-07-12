'use client'

import { useEffect, useCallback, useState } from 'react'

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean
  enableTabNavigation?: boolean
  enableEscapeKey?: boolean
  enableEnterKey?: boolean
  enableSpaceKey?: boolean
  wrapAround?: boolean
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'enter' | 'escape' | 'space', index?: number) => void
  onActivate?: (index: number) => void
}

export function useKeyboardNavigation(
  itemCount: number,
  options: KeyboardNavigationOptions = {}
) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isActive, setIsActive] = useState(false)
  
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableEscapeKey = true,
    enableEnterKey = true,
    enableSpaceKey = true,
    wrapAround = true,
    onNavigate,
    onActivate
  } = options

  const moveToIndex = useCallback((newIndex: number) => {
    if (itemCount === 0) return
    
    let targetIndex = newIndex
    
    if (wrapAround) {
      if (targetIndex < 0) targetIndex = itemCount - 1
      if (targetIndex >= itemCount) targetIndex = 0
    } else {
      targetIndex = Math.max(0, Math.min(itemCount - 1, targetIndex))
    }
    
    setCurrentIndex(targetIndex)
    return targetIndex
  }, [itemCount, wrapAround])

  const moveUp = useCallback(() => {
    const newIndex = moveToIndex(currentIndex - 1)
    onNavigate?.('up', newIndex)
    return newIndex
  }, [currentIndex, moveToIndex, onNavigate])

  const moveDown = useCallback(() => {
    const newIndex = moveToIndex(currentIndex + 1)
    onNavigate?.('down', newIndex)
    return newIndex
  }, [currentIndex, moveToIndex, onNavigate])

  const moveLeft = useCallback(() => {
    const newIndex = moveToIndex(currentIndex - 1)
    onNavigate?.('left', newIndex)
    return newIndex
  }, [currentIndex, moveToIndex, onNavigate])

  const moveRight = useCallback(() => {
    const newIndex = moveToIndex(currentIndex + 1)
    onNavigate?.('right', newIndex)
    return newIndex
  }, [currentIndex, moveToIndex, onNavigate])

  const activate = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < itemCount) {
      onActivate?.(currentIndex)
    }
  }, [currentIndex, itemCount, onActivate])

  const reset = useCallback(() => {
    setCurrentIndex(-1)
    setIsActive(false)
  }, [])

  const focus = useCallback((index: number = 0) => {
    setCurrentIndex(index)
    setIsActive(true)
  }, [])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      let handled = false

      if (enableArrowKeys) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault()
            moveUp()
            handled = true
            break
          case 'ArrowDown':
            e.preventDefault()
            moveDown()
            handled = true
            break
          case 'ArrowLeft':
            e.preventDefault()
            moveLeft()
            handled = true
            break
          case 'ArrowRight':
            e.preventDefault()
            moveRight()
            handled = true
            break
        }
      }

      if (enableEnterKey && e.key === 'Enter') {
        e.preventDefault()
        activate()
        onNavigate?.('enter', currentIndex)
        handled = true
      }

      if (enableSpaceKey && e.key === ' ') {
        e.preventDefault()
        activate()
        onNavigate?.('space', currentIndex)
        handled = true
      }

      if (enableEscapeKey && e.key === 'Escape') {
        e.preventDefault()
        reset()
        onNavigate?.('escape', currentIndex)
        handled = true
      }

      if (enableTabNavigation && e.key === 'Tab') {
        if (e.shiftKey) {
          e.preventDefault()
          moveUp()
        } else {
          e.preventDefault()
          moveDown()
        }
        handled = true
      }

      return handled
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    isActive,
    currentIndex,
    enableArrowKeys,
    enableTabNavigation,
    enableEscapeKey,
    enableEnterKey,
    enableSpaceKey,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    activate,
    reset,
    onNavigate
  ])

  return {
    currentIndex,
    isActive,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    activate,
    reset,
    focus,
    setIndex: moveToIndex
  }
}

// 포커스 관리를 위한 헬퍼 훅
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    setFocusedElement(document.activeElement as HTMLElement)
  }, [])

  const restoreFocus = useCallback(() => {
    if (focusedElement && document.body.contains(focusedElement)) {
      focusedElement.focus()
    }
  }, [focusedElement])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    saveFocus,
    restoreFocus,
    trapFocus
  }
}

// 스크린 리더 알림을 위한 헬퍼 훅
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // 메시지 읽기 완료 후 제거
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return { announce }
}

// 키보드 단축키 등록 훅
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.metaKey && 'meta',
        e.altKey && 'alt',
        e.shiftKey && 'shift',
        e.key.toLowerCase()
      ].filter(Boolean).join('+')

      const handler = shortcuts[key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}