'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { SupabaseProfileService } from '@/lib/services/supabase-profile-service'
import type { UserProfile, UserAddress } from '@/types/user'
import { toast } from 'sonner'

export function useSupabaseProfile(userId: string | null) {
  const queryClient = useQueryClient()

  // 프로필 조회
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['supabase-profile', userId],
    queryFn: () => userId ? SupabaseProfileService.getProfile(userId) : null,
    enabled: !!userId && process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',
    staleTime: 20 * 60 * 1000, // 20 minutes - 프로필 정보는 자주 변경되지 않음
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // 주소 목록 조회
  const { data: addresses = [], isLoading: addressesLoading, error: addressesError } = useQuery({
    queryKey: ['supabase-addresses', userId],
    queryFn: () => userId ? SupabaseProfileService.getAddresses(userId) : [],
    enabled: !!userId && process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',
    staleTime: 15 * 60 * 1000, // 15 minutes - 주소 정보도 비교적 자주 변경되지 않음
    gcTime: 25 * 60 * 1000, // 25 minutes
  })

  // 프로필 생성
  const createProfileMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<UserProfile> }) => 
      SupabaseProfileService.createProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-profile'] })
      toast.success('프로필이 성공적으로 생성되었습니다.')
    },
    onError: (error) => {
      toast.error('프로필 생성 중 오류가 발생했습니다.')
      console.error('프로필 생성 오류:', error)
    }
  })

  // 프로필 업데이트
  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<UserProfile> }) => 
      SupabaseProfileService.updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-profile'] })
      toast.success('프로필이 성공적으로 업데이트되었습니다.')
    },
    onError: (error) => {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.')
      console.error('프로필 업데이트 오류:', error)
    }
  })

  // 주소 추가
  const addAddressMutation = useMutation({
    mutationFn: ({ userId, address }: { userId: string; address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'> }) => 
      SupabaseProfileService.addAddress(userId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-addresses'] })
      toast.success('새 주소가 추가되었습니다.')
    },
    onError: (error) => {
      toast.error('주소 추가 중 오류가 발생했습니다.')
      console.error('주소 추가 오류:', error)
    }
  })

  // 주소 업데이트
  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, updates }: { addressId: string; updates: Partial<UserAddress> }) => 
      SupabaseProfileService.updateAddress(addressId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-addresses'] })
      toast.success('주소가 성공적으로 업데이트되었습니다.')
    },
    onError: (error) => {
      toast.error('주소 업데이트 중 오류가 발생했습니다.')
      console.error('주소 업데이트 오류:', error)
    }
  })

  // 주소 삭제
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => 
      SupabaseProfileService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-addresses'] })
      toast.success('주소가 삭제되었습니다.')
    },
    onError: (error) => {
      toast.error('주소 삭제 중 오류가 발생했습니다.')
      console.error('주소 삭제 오류:', error)
    }
  })

  // 기본 주소 설정
  const setDefaultAddressMutation = useMutation({
    mutationFn: ({ userId, addressId }: { userId: string; addressId: string }) => 
      SupabaseProfileService.setDefaultAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-addresses'] })
      toast.success('기본 주소가 변경되었습니다.')
    },
    onError: (error) => {
      toast.error('기본 주소 설정 중 오류가 발생했습니다.')
      console.error('기본 주소 설정 오류:', error)
    }
  })

  // 실시간 동기화 설정 - 페이지 가시성 기반 최적화
  useEffect(() => {
    if (!userId) return

    const isVisible = () => !document.hidden
    let channel: any = null
    
    const setupSubscription = () => {
      if (!isVisible()) return
      
      channel = supabase()
        .channel(`profile-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('프로필 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabase-profile', userId] })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_addresses',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('주소 실시간 업데이트:', payload)
            queryClient.invalidateQueries({ queryKey: ['supabase-addresses', userId] })
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (isVisible()) {
        setupSubscription()
      } else if (channel) {
        supabase().removeChannel(channel)
        channel = null
      }
    }

    // 초기 설정
    setupSubscription()
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) {
        supabase().removeChannel(channel)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, queryClient])

  return {
    // 데이터
    profile,
    addresses,
    defaultAddress: addresses.find(addr => addr.is_default),
    
    // 로딩 상태
    isLoading: profileLoading || addressesLoading,
    profileLoading,
    addressesLoading,
    
    // 에러
    error: profileError || addressesError,
    
    // 뮤테이션
    createProfile: createProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    addAddress: addAddressMutation.mutate,
    updateAddress: updateAddressMutation.mutate,
    deleteAddress: deleteAddressMutation.mutate,
    setDefaultAddress: setDefaultAddressMutation.mutate,
    
    // 뮤테이션 상태
    isCreatingProfile: createProfileMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
    isSettingDefaultAddress: setDefaultAddressMutation.isPending
  }
}