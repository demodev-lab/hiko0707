'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/components/forms/register-form'
import { SocialLoginButtons } from '@/components/features/auth/social-login-buttons'
import { useLanguage } from '@/lib/i18n/context'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/hotdeals')
    }
  }, [isAuthenticated, router])

  const handleSuccess = () => {
    router.push('/hotdeals')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-[450px]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t('auth.createAccount')}
          </CardTitle>
          <CardDescription>
            {t('auth.createAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm onSuccess={handleSuccess} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <SocialLoginButtons mode="register" />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center text-muted-foreground w-full">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}