'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  useEffect(() => {
    const provider = searchParams.get('provider')
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      toast.error(t('auth.socialLoginError'))
      router.push('/login')
      return
    }

    if (provider && code) {
      // In a real app, we would exchange the code for tokens
      // For demo purposes, we'll simulate a successful login
      const mockUser = {
        id: `${provider}-${Date.now()}`,
        name: `${provider} User`,
        email: `user@${provider}.com`,
        provider,
        createdAt: new Date().toISOString(),
      }
      
      localStorage.setItem('currentUser', JSON.stringify(mockUser))
      toast.success(t('auth.socialLoginSuccess').replace('{provider}', provider))
      
      // Redirect to intended page or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    } else {
      router.push('/login')
    }
  }, [router, searchParams, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">{t('auth.processingLogin')}</p>
      </div>
    </div>
  )
}