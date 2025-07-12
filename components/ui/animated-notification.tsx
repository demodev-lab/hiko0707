'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { notification } from '@/lib/animations'

interface AnimatedNotificationProps {
  children: ReactNode
  isVisible: boolean
  className?: string
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function AnimatedNotification({
  children,
  isVisible,
  className,
  position = 'top-right'
}: AnimatedNotificationProps) {
  const positionClasses = {
    'top': 'top-4 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={notification}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "fixed z-50",
            positionClasses[position],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 토스트 알림 래퍼
interface AnimatedToastProps {
  children: ReactNode
  duration?: number
  onClose?: () => void
}

export function AnimatedToast({ 
  children, 
  duration = 3000, 
  onClose 
}: AnimatedToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border p-4 min-w-[300px]"
    >
      {children}
    </motion.div>
  )
}