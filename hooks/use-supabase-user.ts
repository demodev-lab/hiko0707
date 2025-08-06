'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SupabaseUserService } from '@/lib/services/supabase-user-service'
import { SupabaseNotificationService } from '@/lib/services/supabase-notification-service'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import type { UserRow, UserProfileRow, NotificationRow } from '@/lib/types/supabase'

export function useSupabaseUser() {
  const { userId: clerkUserId } = useAuth()
  const queryClient = useQueryClient()

  // 사용자 정보 조회
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', clerkUserId],
    queryFn: async () => {
      if (!clerkUserId) return null
      return SupabaseUserService.getUserByClerkId(clerkUserId)
    },
    enabled: !!clerkUserId,
    staleTime: 15 * 60 * 1000, // 15 minutes - 사용자 정보는 자주 변경되지 않음
  })

  // 사용자 프로필 조회
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return SupabaseUserService.getUserProfile(user.id)
    },
    enabled: !!user?.id,
    staleTime: 20 * 60 * 1000, // 20 minutes - 프로필 정보는 더욱 자주 변경되지 않음
  })

  // 알림 목록 조회
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      return SupabaseNotificationService.getUserNotifications(user.id)
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - 알림은 자주 업데이트
  })

  // 읽지 않은 알림 개수 조회
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      return SupabaseNotificationService.getUnreadCount(user.id)
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - 읽지 않은 알림 개수는 실시간에 가까워야 함
  })

  // 사용자 정보 업데이트
  const updateUserMutation = useMutation({
    mutationFn: async (updates: { name?: string; phone?: string; preferred_language?: string }) => {
      if (!user?.id) throw new Error('사용자를 찾을 수 없습니다')
      return SupabaseUserService.updateUser(user.id, updates)
    },
    onSuccess: () => {
      toast.success('사용자 정보가 업데이트되었습니다')
      queryClient.invalidateQueries({ queryKey: ['user', clerkUserId] })
    },
    onError: () => {
      toast.error('사용자 정보 업데이트에 실패했습니다')
    },
  })

  // 언어 설정 업데이트
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!user?.id) throw new Error('사용자를 찾을 수 없습니다')
      return SupabaseUserService.updateLanguage(user.id, language)
    },
    onSuccess: () => {
      toast.success('언어 설정이 변경되었습니다')
      queryClient.invalidateQueries({ queryKey: ['user', clerkUserId] })
    },
    onError: () => {
      toast.error('언어 설정 변경에 실패했습니다')
    },
  })

  // 아바타 업데이트
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!user?.id) throw new Error('사용자를 찾을 수 없습니다')
      return SupabaseUserService.updateAvatar(user.id, avatarUrl)
    },
    onSuccess: () => {
      toast.success('프로필 사진이 업데이트되었습니다')
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
    },
    onError: () => {
      toast.error('프로필 사진 업데이트에 실패했습니다')
    },
  })

  // 알림 읽음 처리
  const markNotificationAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return SupabaseNotificationService.markAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] })
    },
  })

  // 모든 알림 읽음 처리
  const markAllNotificationsAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('사용자를 찾을 수 없습니다')
      return SupabaseNotificationService.markAllAsRead(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user?.id] })
    },
  })

  return {
    // 데이터
    user,
    userProfile,
    notifications,
    unreadCount,
    
    // 로딩 상태
    isLoading: isLoadingUser || isLoadingNotifications,
    
    // 뮤테이션
    updateUser: updateUserMutation.mutate,
    updateLanguage: updateLanguageMutation.mutate,
    updateAvatar: updateAvatarMutation.mutate,
    markNotificationAsRead: markNotificationAsReadMutation.mutate,
    markAllNotificationsAsRead: markAllNotificationsAsReadMutation.mutate,
    
    // 뮤테이션 로딩 상태
    isUpdatingUser: updateUserMutation.isPending,
    isUpdatingLanguage: updateLanguageMutation.isPending,
    isUpdatingAvatar: updateAvatarMutation.isPending,
  }
}