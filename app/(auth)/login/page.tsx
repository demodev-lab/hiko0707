'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { AuthForm } from '@/components/features/auth/auth-form'
import { ApiError } from '@/components/ui/error'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const { login, register, isLoading } = useAuth()

  const handleSubmit = async (data: any) => {
    try {
      setError(null)
      if (mode === 'login') {
        await login(data.email, data.password)
      } else {
        await register({
          name: data.name,
          email: data.email,
          preferredLanguage: data.language,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch (err) {
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