'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseChatService } from '@/lib/services/supabase-chat-service'
import type { ChatMessage, ChatSession } from '@/lib/services/supabase-chat-service'

interface UseChatOptions {
  sessionId?: string
  userId?: string
  onMessageReceived?: (message: ChatMessage) => void
  onSessionEnd?: (session: ChatSession) => void
  autoGreeting?: boolean
  greetingDelay?: number
}

export function useSupabaseChat(options: UseChatOptions = {}) {
  const {
    sessionId,
    userId,
    onMessageReceived,
    onSessionEnd,
    autoGreeting = true,
    greetingDelay = 1000
  } = options

  const queryClient = useQueryClient()
  
  // 로컬 상태
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // React Query로 세션 데이터 관리
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => supabaseChatService.getSessions(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 15 * 60 * 1000, // 15분
    refetchOnWindowFocus: false
  })

  // 세션 생성 뮤테이션
  const createSessionMutation = useMutation({
    mutationFn: (session: ChatSession) => supabaseChatService.createSession(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })

  // 세션 업데이트 뮤테이션
  const updateSessionMutation = useMutation({
    mutationFn: (session: ChatSession) => supabaseChatService.updateSession(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    },
    // Optimistic update
    onMutate: async (updatedSession) => {
      await queryClient.cancelQueries({ queryKey: ['chat-sessions'] })
      const previousSessions = queryClient.getQueryData<ChatSession[]>(['chat-sessions'])
      
      queryClient.setQueryData<ChatSession[]>(['chat-sessions'], old => 
        old ? old.map(s => s.id === updatedSession.id ? updatedSession : s) : []
      )
      
      return { previousSessions }
    },
    onError: (err, updatedSession, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(['chat-sessions'], context.previousSessions)
      }
    }
  })

  // 세션 삭제 뮤테이션
  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => supabaseChatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })

  // 전체 세션 초기화 뮤테이션
  const clearSessionsMutation = useMutation({
    mutationFn: () => supabaseChatService.clearSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })

  // 메시지 추가 뮤테이션
  const addMessageMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: ChatMessage }) => 
      supabaseChatService.addMessage(sessionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  })

  // 세션 초기화
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const existingSession = sessions.find(s => s.id === sessionId)
      if (existingSession) {
        setCurrentSession(existingSession)
        setMessages(existingSession.messages)
        setIsConnected(true)
      }
    } else if (autoGreeting && !currentSession) {
      // 새 세션 시작
      const timer = setTimeout(() => {
        startNewSession()
      }, greetingDelay)
      
      return () => clearTimeout(timer)
    }
  }, [sessionId, sessions, autoGreeting, currentSession])

  // 새 세션 시작
  const startNewSession = useCallback(async () => {
    try {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        userId,
        startedAt: new Date(),
        messages: [],
        status: 'active'
      }

      // 인사말 추가
      if (autoGreeting) {
        const greetingMessage: ChatMessage = {
          id: `${newSession.id}-greeting`,
          text: getGreetingMessage(),
          sender: 'agent',
          timestamp: new Date(),
          status: 'sent',
          metadata: { type: 'greeting' }
        }
        newSession.messages.push(greetingMessage)
      }

      setCurrentSession(newSession)
      setMessages(newSession.messages)
      setIsConnected(true)
      setConnectionError(null)

      // Supabase에 저장
      await createSessionMutation.mutateAsync(newSession)
    } catch (error) {
      console.error('새 세션 시작 오류:', error)
      setConnectionError('세션을 시작할 수 없습니다.')
    }
  }, [userId, autoGreeting, createSessionMutation])

  // 메시지 전송
  const sendMessage = useCallback(async (text: string, metadata?: any) => {
    try {
      if (!currentSession) {
        await startNewSession()
        // 새 세션이 생성될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (!currentSession) {
        throw new Error('세션을 생성할 수 없습니다.')
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        metadata
      }

      // 로컬 상태 즉시 업데이트
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)
      
      // 세션 업데이트
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages
      }
      setCurrentSession(updatedSession)

      // Optimistic update로 즉시 UI 반영
      await updateSessionMutation.mutateAsync(updatedSession)

      // 메시지 전송 상태 업데이트
      setTimeout(() => {
        const sentMessage = { ...newMessage, status: 'sent' as const }
        const finalMessages = updatedMessages.map(msg =>
          msg.id === newMessage.id ? sentMessage : msg
        )
        setMessages(finalMessages)
        
        const finalSession = {
          ...updatedSession,
          messages: finalMessages
        }
        setCurrentSession(finalSession)
        updateSessionMutation.mutate(finalSession)
        
        // 에이전트 응답 시뮬레이션
        simulateAgentResponse(text, finalSession)
      }, 500)
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      setConnectionError('메시지를 전송할 수 없습니다.')
    }
  }, [currentSession, messages, updateSessionMutation])

  // 에이전트 응답 시뮬레이션
  const simulateAgentResponse = useCallback(async (userMessage: string, session: ChatSession) => {
    setIsTyping(true)
    
    setTimeout(async () => {
      try {
        const response = generateResponse(userMessage)
        const agentMessage: ChatMessage = {
          id: Date.now().toString(),
          text: response,
          sender: 'agent',
          timestamp: new Date(),
          status: 'sent',
          metadata: { type: 'answer' }
        }

        const updatedMessages = [...session.messages, agentMessage]
        setMessages(updatedMessages)
        setIsTyping(false)
        
        const updatedSession = {
          ...session,
          messages: updatedMessages
        }
        setCurrentSession(updatedSession)
        
        // Supabase 업데이트
        await updateSessionMutation.mutateAsync(updatedSession)

        if (onMessageReceived) {
          onMessageReceived(agentMessage)
        }
      } catch (error) {
        console.error('에이전트 응답 오류:', error)
        setIsTyping(false)
      }
    }, 1500)
  }, [updateSessionMutation, onMessageReceived])

  // 세션 종료
  const endSession = useCallback(async (rating?: number, feedback?: string) => {
    if (!currentSession) return

    try {
      const endedSession: ChatSession = {
        ...currentSession,
        endedAt: new Date(),
        status: 'ended',
        rating,
        feedback
      }

      setCurrentSession(endedSession)
      await updateSessionMutation.mutateAsync(endedSession)

      if (onSessionEnd) {
        onSessionEnd(endedSession)
      }

      // 새 세션 준비
      setTimeout(() => {
        setCurrentSession(null)
        setMessages([])
        setIsConnected(false)
      }, 1000)
    } catch (error) {
      console.error('세션 종료 오류:', error)
    }
  }, [currentSession, updateSessionMutation, onSessionEnd])

  // 메시지 재전송
  const resendMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.status === 'failed' && currentSession) {
      try {
        // 메시지 상태를 sending으로 변경
        const updatedMessages = messages.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sending' as const } : msg
        )
        setMessages(updatedMessages)
        
        const updatedSession = {
          ...currentSession,
          messages: updatedMessages
        }
        setCurrentSession(updatedSession)
        
        // 재전송 로직
        setTimeout(async () => {
          const sentMessages = updatedMessages.map(msg =>
            msg.id === messageId ? { ...msg, status: 'sent' as const } : msg
          )
          setMessages(sentMessages)
          
          const finalSession = {
            ...updatedSession,
            messages: sentMessages
          }
          setCurrentSession(finalSession)
          await updateSessionMutation.mutateAsync(finalSession)
        }, 500)
      } catch (error) {
        console.error('메시지 재전송 오류:', error)
      }
    }
  }, [messages, currentSession, updateSessionMutation])

  // 세션 복구
  const restoreSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
      setMessages(session.messages)
      setIsConnected(true)
      setConnectionError(null)
    }
  }, [sessions])

  // 모든 세션 삭제
  const clearAllSessions = useCallback(async () => {
    try {
      await clearSessionsMutation.mutateAsync()
      setCurrentSession(null)
      setMessages([])
      setIsConnected(false)
    } catch (error) {
      console.error('전체 세션 삭제 오류:', error)
    }
  }, [clearSessionsMutation])

  return {
    // 상태
    currentSession,
    sessions,
    messages,
    isTyping,
    isConnected,
    connectionError,
    
    // 로딩 상태
    loading: sessionsLoading || 
             createSessionMutation.isPending || 
             updateSessionMutation.isPending ||
             deleteSessionMutation.isPending ||
             clearSessionsMutation.isPending ||
             addMessageMutation.isPending,
    
    // 액션
    startNewSession,
    sendMessage,
    endSession,
    resendMessage,
    restoreSession,
    clearAllSessions,
    
    // 유틸리티
    hasActiveSession: currentSession?.status === 'active',
    totalSessions: sessions.length,
    averageRating: sessions
      .filter(s => s.rating)
      .reduce((acc, s) => acc + (s.rating || 0), 0) / sessions.filter(s => s.rating).length || 0
  }
}

// 인사말 생성
function getGreetingMessage(): string {
  const hour = new Date().getHours()
  const greetings = {
    morning: '좋은 아침입니다! HiKo입니다. 무엇을 도와드릴까요?',
    afternoon: '안녕하세요! HiKo입니다. 어떤 도움이 필요하신가요?',
    evening: '안녕하세요! HiKo입니다. 무엇을 찾고 계신가요?',
    night: '안녕하세요! HiKo입니다. 늦은 시간에도 도와드리겠습니다.'
  }

  if (hour >= 5 && hour < 12) return greetings.morning
  if (hour >= 12 && hour < 17) return greetings.afternoon
  if (hour >= 17 && hour < 22) return greetings.evening
  return greetings.night
}

// 응답 생성 (실제로는 AI/API 호출)
function generateResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('주문') && lowerMessage.includes('상태')) {
    return '주문 상태를 확인하시려면 주문 번호를 알려주세요. 주문 내역 페이지에서도 확인하실 수 있습니다.'
  }
  
  if (lowerMessage.includes('환불')) {
    return '환불 요청을 도와드리겠습니다. 주문 번호와 환불 사유를 알려주시면 바로 처리해드리겠습니다.'
  }
  
  if (lowerMessage.includes('배송')) {
    return '배송 관련 문의시군요. 일반적으로 주문 후 2-3일 내에 배송됩니다. 구체적인 배송 정보를 원하시면 주문 번호를 알려주세요.'
  }
  
  if (lowerMessage.includes('가격') || lowerMessage.includes('할인')) {
    return '현재 진행 중인 할인 이벤트를 확인하시려면 핫딜 페이지를 방문해주세요. 특정 상품의 가격을 알고 싶으시면 상품명을 알려주세요.'
  }
  
  if (lowerMessage.includes('회원가입') || lowerMessage.includes('로그인')) {
    return '회원가입이나 로그인에 문제가 있으신가요? 구체적인 오류 메시지나 문제 상황을 알려주시면 도와드리겠습니다.'
  }
  
  return '네, 알겠습니다. 더 자세히 설명해주시면 정확한 도움을 드릴 수 있을 것 같습니다. 어떤 부분이 궁금하신가요?'
}

// 타입 재내보내기 (호환성을 위해)
export type { ChatMessage, ChatSession, UseChatOptions }