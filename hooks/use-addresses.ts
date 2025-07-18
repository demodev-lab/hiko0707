'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/database-service'
import { Address } from '@/lib/db/local/models'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export function useAddresses() {
  const { currentUser } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)

  // 사용자의 배송지 목록 불러오기
  const loadAddresses = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      const userAddresses = await db.addresses.findByUserId(currentUser.id)
      setAddresses(userAddresses)
      
      const defaultAddr = await db.addresses.findDefaultByUserId(currentUser.id)
      setDefaultAddress(defaultAddr)
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
      
      const newAddress = await db.addresses.create(newAddressData)
      console.log('✅ DB 저장 완료:', newAddress)

      // 기본 배송지로 설정하는 경우 다른 배송지들의 기본 설정 해제
      if (addressData.isDefault || isFirstAddress) {
        console.log('🏠 기본 배송지로 설정 중...')
        await db.addresses.setAsDefault(newAddress.id, currentUser.id)
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
      
      const updatedAddress = await db.addresses.update(id, {
        ...updates,
        updatedAt: new Date(),
      })

      // 기본 배송지로 설정하는 경우
      if (updates.isDefault) {
        await db.addresses.setAsDefault(id, currentUser.id)
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
      
      await db.addresses.delete(id)
      
      // 삭제된 배송지가 기본 배송지였다면, 다른 배송지 중 첫 번째를 기본으로 설정
      if (wasDefault && addresses.length > 1) {
        const remainingAddresses = addresses.filter(addr => addr.id !== id)
        if (remainingAddresses.length > 0) {
          await db.addresses.setAsDefault(remainingAddresses[0].id, currentUser.id)
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
      await db.addresses.setAsDefault(id, currentUser.id)
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