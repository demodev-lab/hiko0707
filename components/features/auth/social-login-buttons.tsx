'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GoogleIcon, KakaoIcon, NaverIcon } from '@/components/icons/social-icons'

interface SocialProvider {
  id: string
  name: string
  icon: React.ReactNode
  bgColor: string
  textColor: string
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <GoogleIcon className="w-5 h-5" />,
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
  },
  {
    id: 'kakao',
    name: 'Kakao',
    icon: <KakaoIcon className="w-5 h-5" />,
    bgColor: 'bg-[#FEE500] hover:bg-[#FADA0A]',
    textColor: 'text-[#191919]',
  },
  {
    id: 'naver',
    name: 'Naver',
    icon: <NaverIcon className="w-5 h-5" />,
    bgColor: 'bg-[#03C75A] hover:bg-[#02B351]',
    textColor: 'text-white',
  },
]

interface SocialLoginButtonsProps {
  mode: 'login' | 'register'
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSocialLogin = async (provider: string) => {
    setLoading(provider)
    
    try {
      // In a real app, this would redirect to OAuth provider
      // For demo purposes, we'll simulate a successful login
      toast.success(t('auth.socialLoginSuccess').replace('{provider}', provider))
      
      // Simulate OAuth callback
      setTimeout(() => {
        // Store mock user data
        const mockUser = {
          id: `${provider}-${Date.now()}`,
          name: `${provider} User`,
          email: `user@${provider}.com`,
          provider,
          createdAt: new Date().toISOString(),
        }
        
        localStorage.setItem('currentUser', JSON.stringify(mockUser))
        
        // Redirect to dashboard
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      toast.error(t('auth.socialLoginError'))
      setLoading(null)
    }
  }


  return (
    <div className="space-y-3">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className={`w-full h-12 ${provider.bgColor} ${provider.textColor} border-gray-300`}
          onClick={() => handleSocialLogin(provider.name)}
          disabled={loading !== null}
        >
          {loading === provider.name ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {provider.icon}
              <span className="font-medium">
                {mode === 'login' 
                  ? t('auth.continueWith').replace('{provider}', provider.name)
                  : t('auth.signUpWith').replace('{provider}', provider.name)
                }
              </span>
            </div>
          )}
        </Button>
      ))}
    </div>
  )
}