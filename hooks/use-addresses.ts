'use client'

/**
 * @deprecated 이 훅은 더 이상 사용하지 마세요!
 * 
 * ⚠️ DEPRECATED: use-addresses.ts는 LocalStorage 기반 시스템을 사용합니다.
 * 
 * 🔄 대신 사용할 훅:
 * - useSupabaseProfile() - 사용자 주소 관리
 * - useSupabaseUserAddresses() - 배송지 전용 관리
 * 
 * 📋 마이그레이션 가이드:
 * 기존: const { addresses, defaultAddress, createAddress } = useAddresses()
 * 신규: const { addresses, createAddressAsync } = useSupabaseProfile()
 * 
 * 이 파일은 Phase 4에서 완전히 제거될 예정입니다.
 */

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/database-service'
import { useSupabaseUser } from './use-supabase-user'
import { toast } from 'sonner'

// Address 타입 정의 (LocalStorage 의존성 제거)
interface Address {
  id: string
  userId: string
  name: string // 배송지 이름 (집, 회사 등)
  recipientName: string // 수령인 이름
  phoneNumber: string
  email: string
  postalCode: string
  address: string
  detailAddress?: string
  isDefault: boolean // 기본 배송지 여부
  createdAt: Date
  updatedAt: Date
}

export function useAddresses() {
  const { user: currentUser } = useSupabaseUser()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)

  // 사용자의 배송지 목록 불러오기
  const loadAddresses = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      // Deprecated - always return empty array since LocalStorage is removed
      console.warn('useAddresses is deprecated. Use useSupabaseProfile instead.')
      setAddresses([])
      setDefaultAddress(null)
    } catch (error) {
      console.error('Failed to load addresses:', error)
      toast.error('배송지 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 배송지 생성
  const createAddress = async (addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    console.log('🎯 createAddress 함수 호출됨')
    console.log('📥 입력 데이터:', addressData)
    console.log('👤 현재 사용자:', currentUser)
    
    if (!currentUser) {
      console.error('❌ 사용자가 로그인되지 않음')
      toast.error('로그인이 필요합니다')
      return null
    }

    try {
      setLoading(true)
      console.log('⏳ 로딩 시작')
      
      // 첫 번째 배송지인 경우 자동으로 기본 배송지로 설정
      const isFirstAddress = addresses.length === 0
      console.log('🏠 첫 번째 배송지 여부:', isFirstAddress)
      console.log('📦 현재 배송지 개수:', addresses.length)
      
      const newAddressData = {
        ...addressData,
        userId: currentUser.id,
        isDefault: isFirstAddress || addressData.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      console.log('💾 DB에 저장할 최종 데이터:', newAddressData)
      
      // Deprecated - don't create in LocalStorage
      console.warn('useAddresses.createAddress is deprecated. Use useSupabaseProfile instead.')
      const newAddress = { id: crypto.randomUUID(), ...newAddressData }

      // 기본 배송지로 설정하는 경우 다른 배송지들의 기본 설정 해제
      if (addressData.isDefault || isFirstAddress) {
        console.log('🏠 기본 배송지로 설정 중...')
        // Deprecated - setAsDefault removed
        console.warn('setAsDefault is deprecated')
        console.log('✅ 기본 배송지 설정 완료')
      }

      console.log('🔄 배송지 목록 새로고침 중...')
      await loadAddresses()
      console.log('✅ 배송지 목록 새로고침 완료')
      
      // toast.success('배송지가 저장되었습니다') // order-form-v2에서 통합 메시지로 처리
      return newAddress
    } catch (error) {
      console.error('❌ createAddress 오류:', error)
      toast.error('배송지 저장에 실패했습니다')
      return null
    } finally {
      setLoading(false)
      console.log('⏹️ createAddress 함수 완료')
    }
  }

  // 배송지 업데이트
  const updateAddress = async (id: string, updates: Partial<Address>) => {
    if (!currentUser) return null

    try {
      setLoading(true)
      
      // Deprecated - don't update in LocalStorage
      console.warn('useAddresses.updateAddress is deprecated. Use useSupabaseProfile instead.')
      const updatedAddress = null

      // 기본 배송지로 설정하는 경우
      if (updates.isDefault) {
        // Deprecated - setAsDefault removed
        console.warn('setAsDefault is deprecated')
      }

      await loadAddresses()
      toast.success('배송지가 수정되었습니다')
      return updatedAddress
    } catch (error) {
      console.error('Failed to update address:', error)
      toast.error('배송지 수정에 실패했습니다')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 배송지 삭제
  const deleteAddress = async (id: string) => {
    if (!currentUser) return false

    try {
      setLoading(true)
      
      const addressToDelete = addresses.find(addr => addr.id === id)
      const wasDefault = addressToDelete?.isDefault || false
      
      // Deprecated - don't delete from LocalStorage
      console.warn('useAddresses.deleteAddress is deprecated. Use useSupabaseProfile instead.')
      
      // 삭제된 배송지가 기본 배송지였다면, 다른 배송지 중 첫 번째를 기본으로 설정
      if (wasDefault && addresses.length > 1) {
        const remainingAddresses = addresses.filter(addr => addr.id !== id)
        if (remainingAddresses.length > 0) {
          // Deprecated - setAsDefault removed
          console.warn('setAsDefault is deprecated')
        }
      }

      await loadAddresses()
      toast.success('배송지가 삭제되었습니다')
      return true
    } catch (error) {
      console.error('Failed to delete address:', error)
      toast.error('배송지 삭제에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 기본 배송지 설정
  const setAsDefault = async (id: string) => {
    if (!currentUser) return false

    try {
      setLoading(true)
      // Deprecated - setAsDefault removed
      console.warn('setAsDefault is deprecated')
      await loadAddresses()
      toast.success('기본 배송지가 설정되었습니다')
      return true
    } catch (error) {
      console.error('Failed to set default address:', error)
      toast.error('기본 배송지 설정에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 배송지 목록 로드
  useEffect(() => {
    if (currentUser) {
      loadAddresses()
    }
  }, [currentUser])

  return {
    addresses,
    defaultAddress,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefault,
    loadAddresses,
  }
}