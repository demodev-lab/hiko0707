'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AccessibleButton } from './accessible-button'
import { useFocusManagement } from '@/hooks/use-keyboard-navigation'
import { cn } from '@/lib/utils'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement()

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  }

  useEffect(() => {
    if (isOpen) {
      saveFocus()
      document.body.style.overflow = 'hidden'
      
      // 포커스 트랩 설정
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current)
        return cleanup
      }
    } else {
      document.body.style.overflow = 'unset'
      restoreFocus()
    }
  }, [isOpen, saveFocus, restoreFocus, trapFocus])

  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* 모달 컨텐츠 */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-lg shadow-lg',
          'max-h-[90vh] overflow-auto',
          'focus:outline-none',
          sizeClasses[size],
          className
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 
              id="modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p 
                id="modal-description"
                className="mt-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {description}
              </p>
            )}
          </div>
          
          {showCloseButton && (
            <AccessibleButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="모달 닫기"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </AccessibleButton>
          )}
        </div>
        
        {/* 바디 */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// 확인 모달 컴포넌트
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'info'
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }

  const buttonVariants = {
    danger: 'destructive',
    warning: 'default',
    info: 'default'
  } as const

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <p className={cn('text-sm', variantStyles[variant])}>
          {message}
        </p>
        
        <div className="flex justify-end gap-3">
          <AccessibleButton
            variant="outline"
            onClick={onClose}
            aria-label={cancelText}
          >
            {cancelText}
          </AccessibleButton>
          <AccessibleButton
            variant={buttonVariants[variant]}
            onClick={() => {
              onConfirm()
              onClose()
            }}
            aria-label={confirmText}
          >
            {confirmText}
          </AccessibleButton>
        </div>
      </div>
    </AccessibleModal>
  )
}