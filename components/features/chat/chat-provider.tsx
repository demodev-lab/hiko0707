'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ChatWidget } from './chat-widget'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'agent'
  timestamp: Date
  metadata?: any
}

interface ChatSession {
  id: string
  userId?: string
  startedAt: Date
  endedAt?: Date
  messages: ChatMessage[]
  status: 'active' | 'ended' | 'waiting'
}

interface ChatContextType {
  isEnabled: boolean
  currentSession: ChatSession | null
  sessions: ChatSession[]
  startChat: () => void
  endChat: () => void
  sendMessage: (message: string) => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
  enabled?: boolean
  agentName?: string
  agentAvatar?: string
  position?: 'bottom-right' | 'bottom-left'
}

export function ChatProvider({
  children,
  enabled = true,
  agentName = 'HiKo Support',
  agentAvatar,
  position = 'bottom-right'
}: ChatProviderProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const startChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      startedAt: new Date(),
      messages: [],
      status: 'active'
    }
    
    setCurrentSession(newSession)
    setSessions(prev => [...prev, newSession])
  }, [])

  const endChat = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => 
        prev ? { ...prev, endedAt: new Date(), status: 'ended' } : null
      )
      setSessions(prev =>
        prev.map(session =>
          session.id === currentSession.id
            ? { ...session, endedAt: new Date(), status: 'ended' }
            : session
        )
      )
    }
  }, [currentSession])

  const sendMessage = useCallback((text: string) => {
    if (!currentSession) {
      startChat()
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    }

    setCurrentSession(prev => 
      prev ? { ...prev, messages: [...prev.messages, newMessage] } : null
    )
    
    setSessions(prev =>
      prev.map(session =>
        session.id === currentSession?.id
          ? { ...session, messages: [...session.messages, newMessage] }
          : session
      )
    )

    // 여기에 실제 메시지 전송 로직 추가
    // API 호출, WebSocket 전송 등
  }, [currentSession, startChat])

  const toggleChat = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message)
  }, [sendMessage])

  return (
    <ChatContext.Provider
      value={{
        isEnabled,
        currentSession,
        sessions,
        startChat,
        endChat,
        sendMessage,
        toggleChat
      }}
    >
      {children}
      {isEnabled && (
        <ChatWidget
          position={position}
          agentName={agentName}
          agentAvatar={agentAvatar}
          onSendMessage={handleSendMessage}
        />
      )}
    </ChatContext.Provider>
  )
}