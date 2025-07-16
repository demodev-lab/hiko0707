'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  Eye, EyeOff, Mail, Lock, User, Globe, 
  ChevronRight, ChevronLeft, Check, AlertCircle,
  Shield, Sparkles, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { SocialLoginButtons } from './social-login-buttons'
import { useLanguage } from '@/lib/i18n/context'
import { AnimatePresence, motion } from 'framer-motion'

// 스키마 정의
const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

const registerStep1Schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
})

const registerStep2Schema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다')
    .regex(/[a-z]/, '소문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

const registerStep3Schema = z.object({
  language: z.string().min(1, '언어를 선택해주세요'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해야 합니다',
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: '개인정보 처리방침에 동의해야 합니다',
  }),
  marketingAccepted: z.boolean().optional(),
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

interface AuthFormV2Props {
  mode: 'login' | 'register'
  onSubmit: (data: any) => Promise<void>
  onModeChange: (mode: 'login' | 'register') => void
  isLoading?: boolean
}

// 비밀번호 강도 계산 함수
function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 25
  if (/[A-Z]/.test(password)) strength += 12.5
  if (/[a-z]/.test(password)) strength += 12.5
  if (/[0-9]/.test(password)) strength += 12.5
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
  return strength
}

export function AuthFormV2({ mode, onSubmit, onModeChange, isLoading = false }: AuthFormV2Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<any>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 로그인 폼
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  })

  // 회원가입 단계별 폼
  const step1Form = useForm({
    resolver: zodResolver(registerStep1Schema),
  })

  const step2Form = useForm({
    resolver: zodResolver(registerStep2Schema),
  })

  const step3Form = useForm({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: {
      language: 'ko',
      termsAccepted: false,
      privacyAccepted: false,
      marketingAccepted: false,
    },
  })

  // 비밀번호 변경 감지
  const password = step2Form.watch('password')
  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
    }
  }, [password])

  // 단계별 제출 처리
  const handleStep1Submit = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: any) => {
    setFormData({ ...formData, ...data })
    setCurrentStep(3)
  }

  const handleStep3Submit = async (data: any) => {
    const finalData = { ...formData, ...data }
    await onSubmit(finalData)
  }

  const handleLoginSubmit = async (data: any) => {
    await onSubmit(data)
  }

  // 전체 동의 토글
  const handleAllTermsToggle = (checked: boolean) => {
    step3Form.setValue('termsAccepted', checked)
    step3Form.setValue('privacyAccepted', checked)
    step3Form.setValue('marketingAccepted', checked)
  }

  const allTermsAccepted = 
    step3Form.watch('termsAccepted') && 
    step3Form.watch('privacyAccepted')

  if (mode === 'login') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8 pt-10">
            <Link href="/" className="inline-block mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HiKo
              </h1>
            </Link>
            <CardTitle className="text-2xl font-bold">환영합니다!</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              한국 온라인 쇼핑의 모든 것
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {/* 소셜 로그인 */}
            <SocialLoginButtons mode="login" />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">또는</span>
              </div>
            </div>

            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...loginForm.register('email')}
                    placeholder="your@email.com"
                    className={cn(
                      "pl-10 h-12 border-gray-200 focus:border-blue-500 transition-colors",
                      loginForm.formState.errors.email && "border-red-500"
                    )}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
                  <Button variant="link" className="p-0 h-auto text-xs text-gray-500">
                    비밀번호를 잊으셨나요?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...loginForm.register('password')}
                    placeholder="••••••••"
                    className={cn(
                      "pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 transition-colors",
                      loginForm.formState.errors.password && "border-red-500"
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  로그인 상태 유지
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                아직 회원이 아니신가요?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 font-medium"
                  onClick={() => onModeChange('register')}
                >
                  회원가입
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 회원가입 폼
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center pb-6 pt-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HiKo
            </h1>
          </Link>
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          
          {/* 진행 상태 표시 */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className={cn(currentStep >= 1 && "text-blue-600 font-medium")}>
                이메일 인증
              </span>
              <span className={cn(currentStep >= 2 && "text-blue-600 font-medium")}>
                계정 정보
              </span>
              <span className={cn(currentStep >= 3 && "text-blue-600 font-medium")}>
                약관 동의
              </span>
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          {mounted && (
            <AnimatePresence mode="wait">
              {/* Step 1: 이메일 */}
              {currentStep === 1 && (
                <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold">이메일로 시작하기</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      로그인에 사용할 이메일을 입력해주세요
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 주소</Label>
                    <Input
                      id="email"
                      type="email"
                      {...step1Form.register('email')}
                      placeholder="your@email.com"
                      className={cn(
                        "h-12 text-base",
                        step1Form.formState.errors.email && "border-red-500"
                      )}
                      autoFocus
                    />
                    {step1Form.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {step1Form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 text-base">
                    다음
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">또는</span>
                    </div>
                  </div>

                  <SocialLoginButtons mode="register" />
                </form>
              </motion.div>
            )}

            {/* Step 2: 계정 정보 */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold">계정 정보 입력</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      이름과 비밀번호를 설정해주세요
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      {...step2Form.register('name')}
                      placeholder="홍길동"
                      className={cn(
                        "h-12",
                        step2Form.formState.errors.name && "border-red-500"
                      )}
                      autoFocus
                    />
                    {step2Form.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{step2Form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...step2Form.register('password')}
                        placeholder="8자 이상, 대소문자 및 숫자 포함"
                        className={cn(
                          "h-12 pr-10",
                          step2Form.formState.errors.password && "border-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {/* 비밀번호 강도 표시 */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">비밀번호 강도</span>
                          <span className={cn(
                            "font-medium",
                            passwordStrength < 50 && "text-red-500",
                            passwordStrength >= 50 && passwordStrength < 75 && "text-yellow-500",
                            passwordStrength >= 75 && "text-green-500"
                          )}>
                            {passwordStrength < 50 && "약함"}
                            {passwordStrength >= 50 && passwordStrength < 75 && "보통"}
                            {passwordStrength >= 75 && "강함"}
                          </span>
                        </div>
                        <Progress 
                          value={passwordStrength} 
                          className={cn(
                            "h-1.5",
                            passwordStrength < 50 && "[&>div]:bg-red-500",
                            passwordStrength >= 50 && passwordStrength < 75 && "[&>div]:bg-yellow-500",
                            passwordStrength >= 75 && "[&>div]:bg-green-500"
                          )}
                        />
                      </div>
                    )}
                    
                    {step2Form.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{step2Form.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...step2Form.register('confirmPassword')}
                        placeholder="비밀번호를 다시 입력하세요"
                        className={cn(
                          "h-12 pr-10",
                          step2Form.formState.errors.confirmPassword && "border-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {step2Form.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{step2Form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setCurrentStep(1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      이전
                    </Button>
                    <Button type="submit" className="flex-1 h-12">
                      다음
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: 약관 동의 */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">거의 다 됐어요!</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      언어 선택과 약관 동의만 남았습니다
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      선호 언어
                    </Label>
                    <select
                      id="language"
                      {...step3Form.register('language')}
                      className="w-full h-12 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="allTerms"
                          checked={allTermsAccepted}
                          onCheckedChange={handleAllTermsToggle}
                        />
                        <label htmlFor="allTerms" className="text-sm font-medium cursor-pointer">
                          전체 동의
                        </label>
                      </div>
                      
                      <div className="space-y-2 pl-6">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            {...step3Form.register('termsAccepted')}
                            checked={step3Form.watch('termsAccepted')}
                            onCheckedChange={(checked) => step3Form.setValue('termsAccepted', checked as boolean)}
                          />
                          <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                            [필수] <Link href="/terms" className="text-blue-600 hover:underline">이용약관</Link>에 동의합니다
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="privacy"
                            {...step3Form.register('privacyAccepted')}
                            checked={step3Form.watch('privacyAccepted')}
                            onCheckedChange={(checked) => step3Form.setValue('privacyAccepted', checked as boolean)}
                          />
                          <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
                            [필수] <Link href="/privacy" className="text-blue-600 hover:underline">개인정보 처리방침</Link>에 동의합니다
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="marketing"
                            {...step3Form.register('marketingAccepted')}
                            checked={step3Form.watch('marketingAccepted')}
                            onCheckedChange={(checked) => step3Form.setValue('marketingAccepted', checked as boolean)}
                          />
                          <label htmlFor="marketing" className="text-sm text-gray-600 cursor-pointer">
                            [선택] 마케팅 정보 수신에 동의합니다
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {(step3Form.formState.errors.termsAccepted || step3Form.formState.errors.privacyAccepted) && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        필수 약관에 동의해주세요
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      이전
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          가입 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          가입 완료
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
              )}
            </AnimatePresence>
          )}

          <div className="text-center mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 font-medium"
                onClick={() => {
                  onModeChange('login')
                  setCurrentStep(1)
                }}
              >
                로그인
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}