'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLocalStorage } from './use-local-storage'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'agent'
  timestamp: Date
  status?: 'sending' | 'sent' | 'failed'
  metadata?: {
    orderId?: string
    productId?: string
    type?: 'greeting' | 'question' | 'answer' | 'confirmation'
  }
}

interface ChatSession {
  id: string
  userId?: string
  startedAt: Date
  endedAt?: Date
  messages: ChatMessage[]
  status: 'active' | 'ended' | 'waiting'
  rating?: number
  feedback?: string
}

interface UseChatOptions {
  sessionId?: string
  userId?: string
  onMessageReceived?: (message: ChatMessage) => void
  onSessionEnd?: (session: ChatSession) => void
  autoGreeting?: boolean
  greetingDelay?: number
}

export function useChat(options: UseChatOptions = {}) {
  const {
    sessionId,
    userId,
    onMessageReceived,
    onSessionEnd,
    autoGreeting = true,
    greetingDelay = 1000
  } = options

  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', [])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // 세션 초기화
  useEffect(() => {
    if (sessionId) {
      const existingSession = sessions.find(s => s.id === sessionId)
      if (existingSession) {
        setCurrentSession(existingSession)
        setMessages(existingSession.messages)
      }
    } else if (autoGreeting) {
      // 새 세션 시작
      const timer = setTimeout(() => {
        startNewSession()
      }, greetingDelay)
      
      return () => clearTimeout(timer)
    }
  }, [sessionId, sessions])

  // 새 세션 시작
  const startNewSession = useCallback(() => {
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
    setSessions(prev => [...prev, newSession])
    setIsConnected(true)
  }, [userId, autoGreeting, setSessions])

  // 메시지 전송
  const sendMessage = useCallback(async (text: string, metadata?: any) => {
    if (!currentSession) {
      startNewSession()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      metadata
    }

    setMessages(prev => [...prev, newMessage])
    
    // 세션 업데이트
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, newMessage]
      }
      setCurrentSession(updatedSession)
      setSessions(prev =>
        prev.map(s => s.id === currentSession.id ? updatedSession : s)
      )
    }

    // 메시지 전송 시뮬레이션
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      )
      
      // 에이전트 응답 시뮬레이션
      simulateAgentResponse(text)
    }, 500)
  }, [currentSession, setSessions])

  // 에이전트 응답 시뮬레이션
  const simulateAgentResponse = useCallback((userMessage: string) => {
    setIsTyping(true)
    
    setTimeout(() => {
      const response = generateResponse(userMessage)
      const agentMessage: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        sender: 'agent',
        timestamp: new Date(),
        status: 'sent',
        metadata: { type: 'answer' }
      }

      setMessages(prev => [...prev, agentMessage])
      setIsTyping(false)
      
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, agentMessage]
        }
        setCurrentSession(updatedSession)
        setSessions(prev =>
          prev.map(s => s.id === currentSession.id ? updatedSession : s)
        )
      }

      if (onMessageReceived) {
        onMessageReceived(agentMessage)
      }
    }, 1500)
  }, [currentSession, setSessions, onMessageReceived])

  // 세션 종료
  const endSession = useCallback((rating?: number, feedback?: string) => {
    if (!currentSession) return

    const endedSession: ChatSession = {
      ...currentSession,
      endedAt: new Date(),
      status: 'ended',
      rating,
      feedback
    }

    setCurrentSession(endedSession)
    setSessions(prev =>
      prev.map(s => s.id === currentSession.id ? endedSession : s)
    )

    if (onSessionEnd) {
      onSessionEnd(endedSession)
    }

    // 새 세션 준비
    setTimeout(() => {
      setCurrentSession(null)
      setMessages([])
    }, 1000)
  }, [currentSession, setSessions, onSessionEnd])

  // 메시지 재전송
  const resendMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message && message.status === 'failed') {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        )
      )
      
      // 재전송 로직
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, status: 'sent' } : msg
          )
        )
      }, 500)
    }
  }, [messages])

  // 세션 복구
  const restoreSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
      setMessages(session.messages)
      setIsConnected(true)
    }
  }, [sessions])

  // 모든 세션 삭제
  const clearAllSessions = useCallback(() => {
    setSessions([])
    setCurrentSession(null)
    setMessages([])
  }, [setSessions])

  return {
    // 상태
    currentSession,
    sessions,
    messages,
    isTyping,
    isConnected,
    connectionError,
    
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