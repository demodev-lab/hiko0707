'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, 
  Phone, 
  User, 
  Plus, 
  Edit2, 
  Trash2, 
  Star,
  AlertCircle
} from 'lucide-react'
import { useAddress } from '@/hooks/use-address'
import { AddressFormModal } from './address-form-modal'
import { Address } from '@/types/address'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function AddressList() {
  const { 
    addresses, 
    isLoading, 
    deleteAddress, 
    setDefaultAddress,
    isDeleting 
  } = useAddress()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  const handleEdit = (address: Address) => {
    setSelectedAddress(address)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedAddress(null)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!addressToDelete) return
    
    try {
      deleteAddress(addressToDelete)
      setAddressToDelete(null)
    } catch (error) {
      toast.error('주소 삭제에 실패했습니다')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId)
      toast.success('기본 배송지가 변경되었습니다')
    } catch (error) {
      toast.error('기본 배송지 설정에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* 주소 추가 섹션 */}
      <div className="mb-6">
        {addresses.length >= 5 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">주소 등록 제한</p>
              <p>최대 5개까지만 등록할 수 있습니다. 새 주소를 추가하려면 기존 주소를 삭제해주세요.</p>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleAdd} 
          className="w-full md:w-auto"
          disabled={addresses.length >= 5}
        >
          <Plus className="w-4 h-4 mr-2" />
          새 주소 추가
        </Button>
      </div>

      {/* 주소 목록 */}
      {addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">등록된 주소가 없습니다</h3>
          <p className="text-gray-600 mb-4">
            첫 번째 배송 주소를 등록해주세요
          </p>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            주소 추가하기
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card 
              key={address.id} 
              className={`relative transition-all ${
                address.isDefault ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {address.name}
                    {address.isDefault && (
                      <Badge variant="default" className="text-xs">
                        기본 배송지
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setAddressToDelete(address.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{address.recipientName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{address.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p>{address.address}</p>
                    <p>{address.detailAddress}</p>
                    <p className="text-gray-600">({address.postalCode})</p>
                  </div>
                </div>
                
                {!address.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    기본 배송지로 설정
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 주소 폼 모달 */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAddress(null)
        }}
        address={selectedAddress}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!addressToDelete} onOpenChange={() => setAddressToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주소를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 삭제된 주소는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}