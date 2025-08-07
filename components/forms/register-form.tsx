'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'
import { useSignUp } from '@clerk/nextjs'
import { registerSchema } from '@/lib/validations'
import { Loader2 } from 'lucide-react'

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()
  const { signUp, isLoaded } = useSignUp()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (!isLoaded) return
    
    setIsLoading(true)

    try {
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || undefined,
      })

      // 이메일 인증 필요한 경우
      if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code'
        })
        toast.success(t('auth.verificationEmailSent'), {
          description: t('auth.checkEmail'),
        })
      } else if (result.status === 'complete') {
        toast.success(t('auth.registerSuccess'), {
          description: t('auth.registerSuccessDesc'),
        })
        onSuccess?.()
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.errors?.[0]?.code === 'form_identifier_exists') {
        toast.error(t('auth.registerError'), {
          description: t('auth.emailExists'),
        })
      } else {
        toast.error(t('common.error'), {
          description: error.errors?.[0]?.message || t('common.tryAgain'),
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('auth.namePlaceholder')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.accountType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('auth.selectAccountType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">{t('auth.customer')}</SelectItem>
                  <SelectItem value="admin">{t('auth.admin')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.signUp')}
        </Button>
      </form>
    </Form>
  )
}