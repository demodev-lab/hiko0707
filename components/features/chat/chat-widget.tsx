'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { AccessibleButton } from '@/components/common/accessible-button'
import { useLanguage } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  text: string
  sender: 'user' | 'agent'
  timestamp: Date
  status?: 'sending' | 'sent' | 'failed'
}

interface ChatWidgetProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left'
  defaultOpen?: boolean
  agentName?: string
  agentAvatar?: string
  welcomeMessage?: string
  placeholder?: string
  onSendMessage?: (message: string) => void
}

export function ChatWidget({
  className,
  position = 'bottom-right',
  defaultOpen = false,
  agentName = 'HiKo Support',
  agentAvatar,
  welcomeMessage = '안녕하세요! 무엇을 도와드릴까요?',
  placeholder = '메시지를 입력하세요...',
  onSendMessage
}: ChatWidgetProps) {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: welcomeMessage,
      sender: 'agent',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 채팅창 열릴 때 포커스
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

  // 새 메시지 알림
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.sender === 'agent') {
        setUnreadCount(prev => prev + 1)
      }
    }
  }, [messages, isOpen])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    
    // 메시지 전송 콜백
    if (onSendMessage) {
      onSendMessage(inputValue)
    }

    // 상태 업데이트 시뮬레이션
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      )
    }, 500)

    // 에이전트 응답 시뮬레이션
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const responses = [
        '네, 도와드리겠습니다!',
        '잠시만 기다려주세요. 확인해보겠습니다.',
        '더 자세한 정보를 알려주시겠어요?',
        '이해했습니다. 바로 처리해드리겠습니다.'
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'agent',
        timestamp: new Date()
      }])
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const positionClasses = {
    'bottom-right': 'bottom-24 sm:bottom-28 md:bottom-6 right-6',
    'bottom-left': 'bottom-24 sm:bottom-28 md:bottom-6 left-6'
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <div className={cn('fixed z-40', positionClasses[position])}>
          <AccessibleButton
            variant="default"
            size="icon"
            onClick={() => setIsOpen(true)}
            aria-label={t('chat.openChat')}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'focus:ring-4 focus:ring-blue-300',
              className
            )}
            hasNotification={unreadCount > 0}
            notificationCount={unreadCount}
          >
            <MessageCircle className="w-6 h-6" />
          </AccessibleButton>
        </div>
      )}

      {/* 채팅 위젯 */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 transition-all duration-300',
            positionClasses[position],
            isMinimized ? 'w-80' : 'w-96 h-[400px] sm:h-[500px] md:h-[600px]',
            'max-w-[calc(100vw-3rem)] max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-6rem)]'
          )}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={agentAvatar} alt={agentName} />
                  <AvatarFallback className="bg-blue-700 text-white">
                    {agentName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{agentName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs opacity-90">온라인</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AccessibleButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label={isMinimized ? '채팅창 확대' : '채팅창 최소화'}
                  className="text-white hover:bg-blue-700 h-8 w-8"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </AccessibleButton>
                <AccessibleButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="채팅창 닫기"
                  className="text-white hover:bg-blue-700 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </AccessibleButton>
              </div>
            </div>

            {/* 채팅 내용 */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.sender === 'agent' && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={agentAvatar} alt={agentName} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {agentName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[75%] rounded-lg px-4 py-2',
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          <div
                            className={cn(
                              'text-xs mt-1',
                              message.sender === 'user'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {message.status === 'sending' && (
                              <span className="ml-2">전송 중...</span>
                            )}
                            {message.status === 'failed' && (
                              <span className="ml-2 text-red-400">전송 실패</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 타이핑 인디케이터 */}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={agentAvatar} alt={agentName} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {agentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* 입력 영역 */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={placeholder}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      aria-label="채팅 메시지 입력"
                    />
                    <AccessibleButton
                      type="submit"
                      variant="default"
                      size="icon"
                      disabled={!inputValue.trim()}
                      aria-label="메시지 전송"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </AccessibleButton>
                  </form>
                  
                  {/* 빠른 답변 */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                      onClick={() => setInputValue('주문 상태를 확인하고 싶어요')}
                    >
                      주문 상태 확인
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                      onClick={() => setInputValue('환불 요청하고 싶어요')}
                    >
                      환불 요청
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                      onClick={() => setInputValue('배송 정보를 알려주세요')}
                    >
                      배송 정보
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </>
  )
}