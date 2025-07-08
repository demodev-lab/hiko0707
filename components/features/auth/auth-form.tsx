'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Mail, Lock, User, Globe } from 'lucide-react'
import Link from 'next/link'
import { SocialLoginButtons } from './social-login-buttons'
import { useLanguage } from '@/lib/i18n/context'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

const registerSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
  language: z.string().min(1, '언어를 선택해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (data: any) => Promise<void>
  onModeChange: (mode: 'login' | 'register') => void
  isLoading?: boolean
}

export function AuthForm({ mode, onSubmit, onModeChange, isLoading = false }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { t } = useLanguage()

  const schema = mode === 'login' ? loginSchema : registerSchema
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'register' ? { language: 'ko' } : undefined,
  })

  const selectedLanguage = watch('language')

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HiKo
            </h1>
          </Link>
          <CardTitle className="text-2xl">
            {t(mode === 'login' ? 'auth.loginTitle' : 'auth.registerTitle')}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {mode === 'login' 
              ? t('auth.loginSubtitle') 
              : t('auth.registerSubtitle')
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <SocialLoginButtons mode={mode} />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('auth.name')}
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder={t('auth.namePlaceholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name?.message as string}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder={t('auth.emailPlaceholder')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email?.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password?.message as string}</p>
              )}
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword?.message as string}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t('auth.language')}
                  </Label>
                  <select
                    id="language"
                    {...register('language')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  {errors.language && (
                    <p className="text-red-500 text-sm">{errors.language?.message as string}</p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t(mode === 'login' ? 'auth.loggingIn' : 'auth.registering')}
                </div>
              ) : (
                t(mode === 'login' ? 'auth.loginButton' : 'auth.registerButton')
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t(mode === 'login' ? 'auth.dontHaveAccount' : 'auth.alreadyHaveAccount')}
            </p>
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600"
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            >
              {t(mode === 'login' ? 'auth.registerButton' : 'auth.loginButton')}
            </Button>
          </div>

          {mode === 'login' && (
            <div className="text-center">
              <Button variant="link" className="p-0 h-auto text-sm text-gray-500">
                {t('auth.forgotPassword')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mode === 'register' && (
        <div className="mt-4 text-center text-xs text-gray-500">
          {t('auth.termsText')}{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            {t('common.terms')}
          </Link>
          {' '}{t('auth.and')}{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            {t('common.privacy')}
          </Link>
          {t('auth.termsTextEnd')}
        </div>
      )}
    </div>
  )
}