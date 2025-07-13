'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAddress } from '@/hooks/use-address'
import { Address } from '@/types/address'
import { useTranslation } from '@/hooks/use-translation'
import { MapPin, Search } from 'lucide-react'

const addressSchema = z.object({
  name: z.string().min(1, '주소 별칭을 입력해주세요').max(20, '20자 이내로 입력해주세요'),
  recipientName: z.string().min(1, '수취인 이름을 입력해주세요'),
  phoneNumber: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^[0-9-]+$/, '올바른 전화번호 형식이 아닙니다'),
  postalCode: z.string().min(5, '우편번호를 입력해주세요').max(5, '우편번호는 5자리입니다'),
  address: z.string().min(1, '기본 주소를 입력해주세요'),
  detailAddress: z.string().min(1, '상세 주소를 입력해주세요'),
  isDefault: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  address?: Address | null
}

export function AddressFormModal({ isOpen, onClose, address }: AddressFormModalProps) {
  const { t } = useTranslation()
  const { createAddress, updateAddress, isCreating, isUpdating } = useAddress()
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      recipientName: '',
      phoneNumber: '',
      postalCode: '',
      address: '',
      detailAddress: '',
      isDefault: false,
    },
  })

  useEffect(() => {
    if (address) {
      form.reset({
        name: address.name,
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        postalCode: address.postalCode,
        address: address.address,
        detailAddress: address.detailAddress,
        isDefault: address.isDefault,
      })
    } else {
      form.reset({
        name: '',
        recipientName: '',
        phoneNumber: '',
        postalCode: '',
        address: '',
        detailAddress: '',
        isDefault: false,
      })
    }
  }, [address, form])

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (address) {
        await updateAddress({
          id: address.id,
          ...data,
        })
      } else {
        await createAddress(data)
      }
      onClose()
      form.reset()
    } catch (error) {
      console.error('Failed to save address:', error)
    }
  }

  const handlePostalCodeSearch = () => {
    // Daum 우편번호 API 연동 (실제 구현 시)
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: function(data: any) {
          form.setValue('postalCode', data.zonecode)
          form.setValue('address', data.roadAddress || data.jibunAddress)
        }
      }).open()
    } else {
      // 데모용 더미 데이터
      form.setValue('postalCode', '06234')
      form.setValue('address', '서울특별시 강남구 테헤란로 152')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {address ? t('address.edit') : t('address.add')}
          </DialogTitle>
          <DialogDescription>
            {t('address.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('address.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('address.nameDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address.recipientName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('address.recipientNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="010-1234-5678" 
                      {...field} 
                      onChange={(e) => {
                        // 자동 하이픈 추가
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        let formatted = value
                        if (value.length > 3 && value.length <= 7) {
                          formatted = `${value.slice(0, 3)}-${value.slice(3)}`
                        } else if (value.length > 7) {
                          formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`
                        }
                        field.onChange(formatted)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('address.postalCode')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="12345" 
                          {...field} 
                          maxLength={5}
                          readOnly
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePostalCodeSearch}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {t('address.searchPostalCode')}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('address.baseAddress')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('address.baseAddressPlaceholder')} 
                        {...field} 
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('address.detailAddress')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('address.detailAddressPlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('address.setAsDefault')}
                    </FormLabel>
                    <FormDescription>
                      {t('address.defaultDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                <MapPin className="w-4 h-4 mr-2" />
                {address ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}