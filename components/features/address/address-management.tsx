'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  BookmarkCheck,
  Home,
  Building
} from 'lucide-react'
import { useAddresses } from '@/hooks/use-addresses'
import { Address } from '@/lib/db/local/models'
import { toast } from 'sonner'

const addressSchema = z.object({
  name: z.string().min(1, '배송지 이름을 입력해주세요'),
  recipientName: z.string().min(1, '수령인 이름을 입력해주세요'),
  phoneNumber: z.string().min(1, '전화번호를 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  postalCode: z.string().min(1, '우편번호를 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  detailAddress: z.string().optional(),
  isDefault: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormProps {
  address?: Address
  onSuccess: () => void
}

function AddressForm({ address, onSuccess }: AddressFormProps) {
  const { createAddress, updateAddress } = useAddresses()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: address?.name || '',
      recipientName: address?.recipientName || '',
      phoneNumber: address?.phoneNumber || '',
      email: address?.email || '',
      postalCode: address?.postalCode || '',
      address: address?.address || '',
      detailAddress: address?.detailAddress || '',
      isDefault: address?.isDefault || false,
    }
  })

  const onSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true)
      
      if (address) {
        await updateAddress(address.id, data)
      } else {
        await createAddress(data)
      }
      
      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Address save failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">배송지 이름 *</Label>
          <Input
            {...form.register('name')}
            placeholder="집, 회사 등"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="recipientName">수령인 이름 *</Label>
          <Input
            {...form.register('recipientName')}
            placeholder="홍길동"
          />
          {form.formState.errors.recipientName && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.recipientName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phoneNumber">전화번호 *</Label>
          <Input
            {...form.register('phoneNumber')}
            placeholder="010-1234-5678"
          />
          {form.formState.errors.phoneNumber && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">이메일 *</Label>
          <Input
            type="email"
            {...form.register('email')}
            placeholder="example@email.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="postalCode">우편번호 *</Label>
          <Input
            {...form.register('postalCode')}
            placeholder="12345"
          />
          {form.formState.errors.postalCode && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.postalCode.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">주소 *</Label>
        <Input
          {...form.register('address')}
          placeholder="서울시 강남구 테헤란로 123"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="detailAddress">상세 주소</Label>
        <Input
          {...form.register('detailAddress')}
          placeholder="101동 202호"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...form.register('isDefault')}
          className="rounded border-gray-300"
        />
        <Label className="text-sm">기본 배송지로 설정</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '저장 중...' : (address ? '수정' : '추가')}
        </Button>
      </div>
    </form>
  )
}

export function AddressManagement() {
  const { addresses, deleteAddress, setAsDefault, loading } = useAddresses()
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async (addressId: string) => {
    if (confirm('이 배송지를 삭제하시겠습니까?')) {
      await deleteAddress(addressId)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    await setAsDefault(addressId)
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingAddress(null)
  }

  if (loading) {
    return <div className="text-center py-8">배송지 목록을 불러오는 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          배송지 관리
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새 배송지 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? '배송지 수정' : '새 배송지 추가'}
              </DialogTitle>
              <DialogDescription>
                배송지 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <AddressForm 
              address={editingAddress || undefined}
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">저장된 배송지가 없습니다.</p>
            <Button onClick={handleAddNew} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              첫 번째 배송지 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isDefault ? 'border-blue-500 bg-blue-50/50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {address.name === '집' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      {address.name}
                    </CardTitle>
                    {address.isDefault && (
                      <Badge variant="default" className="text-xs">
                        <BookmarkCheck className="w-3 h-3 mr-1" />
                        기본 배송지
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>수령인:</strong> {address.recipientName}</p>
                  <p><strong>전화번호:</strong> {address.phoneNumber}</p>
                  <p><strong>이메일:</strong> {address.email}</p>
                  <p><strong>주소:</strong> ({address.postalCode}) {address.address}</p>
                  {address.detailAddress && (
                    <p><strong>상세 주소:</strong> {address.detailAddress}</p>
                  )}
                </div>
                {!address.isDefault && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center gap-2"
                    >
                      <BookmarkCheck className="w-3 h-3" />
                      기본 배송지로 설정
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}