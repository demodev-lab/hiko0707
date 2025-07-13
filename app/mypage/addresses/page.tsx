'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/features/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  MapPin, 
  Edit2, 
  Trash2, 
  Star,
  Phone,
  User,
  ChevronLeft
} from 'lucide-react'
import { useAddress } from '@/hooks/use-address'
import { Address } from '@/types/address'
import { AddressFormModal } from '@/components/features/address/address-form-modal'
import { formatPhoneNumber } from '@/lib/utils'
import Link from 'next/link'
import { useTranslation } from '@/hooks/use-translation'

export default function AddressesPage() {
  const { t } = useTranslation()
  const { addresses, defaultAddress, isLoading, deleteAddress, setDefaultAddress } = useAddress()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingAddress(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('address.deleteConfirm'))) {
      deleteAddress(id)
    }
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="mb-6">
            <Link href="/mypage">
              <Button variant="ghost" size="sm" className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.back')}
              </Button>
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('address.title')}</h1>
                <p className="text-muted-foreground mt-1">
                  {t('address.subtitle')}
                </p>
              </div>
              
              {addresses.length < 5 && (
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('address.add')}
                </Button>
              )}
            </div>
          </div>

          {/* 주소 목록 */}
          {addresses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('address.empty')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('address.emptyDescription')}
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('address.addFirst')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <Card key={address.id} className={address.isDefault ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{address.name}</CardTitle>
                        {address.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            {t('address.default')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{address.recipientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{formatPhoneNumber(address.phoneNumber)}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p>[{address.postalCode}] {address.address}</p>
                        <p className="text-gray-600">{address.detailAddress}</p>
                      </div>
                    </div>
                    
                    {!address.isDefault && (
                      <div className="pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="w-full"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {t('address.setAsDefault')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 주소 추가/수정 모달 */}
          <AddressFormModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingAddress(null)
            }}
            address={editingAddress}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}