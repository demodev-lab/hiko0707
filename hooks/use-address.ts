import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/database-service'
import { Address, CreateAddressInput, UpdateAddressInput } from '@/types/address'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useAddress() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()

  // 사용자의 주소 목록 조회
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return []
      return await db.addresses.findByUserId(currentUser.id)
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5, // 5분
  })

  // 기본 배송지 조회
  const { data: defaultAddress } = useQuery({
    queryKey: ['defaultAddress', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null
      return await db.addresses.findDefaultByUserId(currentUser.id)
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5,
  })

  // 주소 추가
  const createAddressMutation = useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      if (!currentUser?.id) throw new Error('로그인이 필요합니다')
      
      // 최대 5개 제한
      const count = await db.addresses.getAddressCount(currentUser.id)
      if (count >= 5) {
        throw new Error('주소는 최대 5개까지 저장할 수 있습니다')
      }
      
      return await db.addresses.create(currentUser.id, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['defaultAddress', currentUser?.id] })
      toast.success('주소가 추가되었습니다')
    },
    onError: (error: any) => {
      toast.error(error.message || '주소 추가에 실패했습니다')
    }
  })

  // 주소 수정
  const updateAddressMutation = useMutation({
    mutationFn: async (input: UpdateAddressInput) => {
      if (!currentUser?.id) throw new Error('로그인이 필요합니다')
      return await db.addresses.updateAddress(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['defaultAddress', currentUser?.id] })
      toast.success('주소가 수정되었습니다')
    },
    onError: () => {
      toast.error('주소 수정에 실패했습니다')
    }
  })

  // 주소 삭제
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!currentUser?.id) throw new Error('로그인이 필요합니다')
      return await db.addresses.deleteAddress(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['defaultAddress', currentUser?.id] })
      toast.success('주소가 삭제되었습니다')
    },
    onError: () => {
      toast.error('주소 삭제에 실패했습니다')
    }
  })

  // 기본 배송지 설정
  const setDefaultAddress = useCallback(async (addressId: string) => {
    try {
      await updateAddressMutation.mutateAsync({
        id: addressId,
        isDefault: true
      })
    } catch (error) {
      console.error('Failed to set default address:', error)
    }
  }, [updateAddressMutation])

  return {
    addresses,
    defaultAddress,
    isLoading,
    createAddress: createAddressMutation.mutate,
    updateAddress: updateAddressMutation.mutate,
    deleteAddress: deleteAddressMutation.mutate,
    setDefaultAddress,
    isCreating: createAddressMutation.isPending,
    isUpdating: updateAddressMutation.isPending,
    isDeleting: deleteAddressMutation.isPending,
  }
}