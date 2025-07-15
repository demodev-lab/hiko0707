'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { AuthForm } from '@/components/features/auth/auth-form'
import { ApiError } from '@/components/ui/error'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const { login, register, isLoading, currentUser } = useAuth()
  const router = useRouter()

  // 이미 로그인된 사용자 리디렉션
  useEffect(() => {
    // 로딩이 완료되고 사용자가 있을 때만 리디렉션
    if (!isLoading && currentUser) {
      if (currentUser.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/hotdeals')
      }
    }
  }, [currentUser, router, isLoading])

  const handleSubmit = async (data: any) => {
    try {
      setError(null)
      if (mode === 'login') {
        await login(data.email, data.password)
      } else {
        await register({
          name: data.name,
          email: data.email,
          password: data.password,
          preferredLanguage: data.language,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-6">
            <ApiError error={error} onRetry={() => setError(null)} />
          </div>
        )}
        
        {/* 디버깅용 - 에러 상태 표시 */}
        {error && (
          <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm">
            디버그: {error}
          </div>
        )}
        
        <AuthForm
          mode={mode}
          onSubmit={handleSubmit}
          onModeChange={setMode}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}