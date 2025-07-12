'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { 
  fadeIn, 
  fadeInUp, 
  scaleIn, 
  slideInLeft, 
  slideInRight,
  staggerContainer,
  staggerItem 
} from '@/lib/animations'

// 기본 애니메이션 컴포넌트
interface AnimatedProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode
  variant?: 'fadeIn' | 'fadeInUp' | 'scaleIn' | 'slideInLeft' | 'slideInRight'
  delay?: number
  duration?: number
  className?: string
}

export function Animated({ 
  children, 
  variant = 'fadeIn', 
  delay = 0,
  duration = 0.3,
  className,
  ...props 
}: AnimatedProps) {
  const variants: Record<string, Variants> = {
    fadeIn,
    fadeInUp,
    scaleIn,
    slideInLeft,
    slideInRight
  }

  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 스태거 컨테이너
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className, 
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
      transition={{ staggerChildren: staggerDelay }}
    >
      {children}
    </motion.div>
  )
}

// 스태거 아이템
interface StaggerItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function StaggerItem({ children, className, index = 0 }: StaggerItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 호버 애니메이션 카드
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  className?: string
  hoverScale?: number
}

export function AnimatedCard({ 
  children, 
  className, 
  hoverScale = 1.02,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: hoverScale,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 애니메이션 버튼
interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  className?: string
  tapScale?: number
  variant?: string
  size?: string
}

export function AnimatedButton({ 
  children, 
  className, 
  tapScale = 0.95,
  variant,
  size,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.15 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// 페이드 인 텍스트
interface FadeInTextProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeInText({ children, className, delay = 0 }: FadeInTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// 카운터 애니메이션
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 1, className }: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        key={value}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 20 
        }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  )
}

// 프로그레스 바 애니메이션
interface AnimatedProgressProps {
  value: number
  max: number
  className?: string
  duration?: number
}

export function AnimatedProgress({ 
  value, 
  max, 
  className, 
  duration = 1 
}: AnimatedProgressProps) {
  const percentage = (value / max) * 100

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration, ease: "easeOut" }}
      />
    </div>
  )
}