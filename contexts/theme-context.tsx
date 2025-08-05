'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { useClerkRole } from '@/hooks/use-clerk-role'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Update actual theme based on theme setting
  const updateActualTheme = (currentTheme: Theme) => {
    const systemTheme = getSystemTheme()
    const newActualTheme = currentTheme === 'system' ? systemTheme : currentTheme
    setActualTheme(newActualTheme)
    
    // Update document class
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(newActualTheme)
      
      // Update theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', newActualTheme === 'dark' ? '#1f2937' : '#ffffff')
      }
    }
  }

  // Initialize theme from user profile or localStorage fallback
  const { isAuthenticated } = useClerkRole()
  const { user } = useSupabaseUser()
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let savedTheme: Theme
      
      // 인증된 사용자면 Supabase 프로필에서 테마 가져오기
      if (isAuthenticated && user?.preferred_language) {
        // preferred_theme이 있다면 사용, 없으면 localStorage 폴백
        const userTheme = (user as any).preferred_theme as Theme
        savedTheme = userTheme && ['light', 'dark', 'system'].includes(userTheme) 
          ? userTheme 
          : (localStorage.getItem('theme') as Theme) || 'light'
      } else {
        // 비인증 사용자는 localStorage 사용
        savedTheme = (localStorage.getItem('theme') as Theme) || 'light'
      }
      
      if (['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme)
        updateActualTheme(savedTheme)
      } else {
        setTheme('light')
        updateActualTheme('light')
        localStorage.setItem('theme', 'light')
      }
    }
  }, [isAuthenticated, user])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (theme === 'system') {
          updateActualTheme('system')
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Update theme and persist to user profile or localStorage
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    updateActualTheme(newTheme)
    
    if (typeof window !== 'undefined') {
      // 항상 localStorage에도 저장 (폴백용)
      localStorage.setItem('theme', newTheme)
      
      // 인증된 사용자면 Supabase 프로필도 업데이트 (향후 구현)
      // TODO: 사용자 프로필에 preferred_theme 필드 추가 후 구현
      // if (isAuthenticated && user) {
      //   updateUser({ preferred_theme: newTheme })
      // }
    }
  }

  const value = {
    theme,
    actualTheme,
    setTheme: handleSetTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}