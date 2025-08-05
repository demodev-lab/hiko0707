import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'

// 기존 use-chat.ts의 타입 재사용
export interface ChatMessage {
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

export interface ChatSession {
  id: string
  userId?: string
  startedAt: Date
  endedAt?: Date
  messages: ChatMessage[]
  status: 'active' | 'ended' | 'waiting'
  rating?: number
  feedback?: string
}

export class SupabaseChatService {
  private static instance: SupabaseChatService
  private storagePrefix = 'hiko_chat_'

  static getInstance(): SupabaseChatService {
    if (!SupabaseChatService.instance) {
      SupabaseChatService.instance = new SupabaseChatService()
    }
    return SupabaseChatService.instance
  }

  /**
   * 모든 채팅 세션 조회
   */
  async getSessions(): Promise<ChatSession[]> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Supabase에서 사용자 채팅 세션 조회
        const { data, error } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase 채팅 세션 조회 오류:', error)
          return this.getLocalSessions()
        }

        const chatSessions = data?.preferences?.chat_sessions || []
        return this.deserializeSessions(chatSessions)
      } else {
        // 비인증 사용자는 localStorage 사용
        return this.getLocalSessions()
      }
    } catch (error) {
      console.error('getSessions 오류:', error)
      return this.getLocalSessions()
    }
  }

  /**
   * 특정 채팅 세션 조회
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessions = await this.getSessions()
      return sessions.find(session => session.id === sessionId) || null
    } catch (error) {
      console.error('getSession 오류:', error)
      return null
    }
  }

  /**
   * 새 채팅 세션 생성
   */
  async createSession(session: ChatSession): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.createLocalSession(session)
          return false
        }

        // chat_sessions 추가
        const currentPreferences = currentData?.preferences || {}
        const currentSessions = currentPreferences.chat_sessions || []
        
        const serializedSession = this.serializeSession(session)
        const updatedSessions = [...currentSessions, serializedSession]
        
        const updatedPreferences = {
          ...currentPreferences,
          chat_sessions: updatedSessions
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('채팅 세션 생성 오류:', updateError)
          this.createLocalSession(session)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.createLocalSession(session)
        return true
      }
    } catch (error) {
      console.error('createSession 오류:', error)
      this.createLocalSession(session)
      return false
    }
  }

  /**
   * 채팅 세션 업데이트
   */
  async updateSession(session: ChatSession): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.updateLocalSession(session)
          return false
        }

        // chat_sessions에서 해당 세션 업데이트
        const currentPreferences = currentData?.preferences || {}
        const currentSessions = currentPreferences.chat_sessions || []
        
        const serializedSession = this.serializeSession(session)
        const updatedSessions = currentSessions.map((s: any) => 
          s.id === session.id ? serializedSession : s
        )
        
        const updatedPreferences = {
          ...currentPreferences,
          chat_sessions: updatedSessions
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('채팅 세션 업데이트 오류:', updateError)
          this.updateLocalSession(session)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.updateLocalSession(session)
        return true
      }
    } catch (error) {
      console.error('updateSession 오류:', error)
      this.updateLocalSession(session)
      return false
    }
  }

  /**
   * 채팅 세션 삭제
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // 현재 preferences 조회
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.deleteLocalSession(sessionId)
          return false
        }

        // chat_sessions에서 해당 세션 제거
        const currentPreferences = currentData?.preferences || {}
        const currentSessions = currentPreferences.chat_sessions || []
        
        const updatedSessions = currentSessions.filter((s: any) => s.id !== sessionId)
        
        const updatedPreferences = {
          ...currentPreferences,
          chat_sessions: updatedSessions
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('채팅 세션 삭제 오류:', updateError)
          this.deleteLocalSession(sessionId)
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 사용
        this.deleteLocalSession(sessionId)
        return true
      }
    } catch (error) {
      console.error('deleteSession 오류:', error)
      this.deleteLocalSession(sessionId)
      return false
    }
  }

  /**
   * 채팅 세션에 메시지 추가
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        console.error('세션을 찾을 수 없습니다:', sessionId)
        return false
      }

      const updatedSession: ChatSession = {
        ...session,
        messages: [...session.messages, message]
      }

      return await this.updateSession(updatedSession)
    } catch (error) {
      console.error('addMessage 오류:', error)
      return false
    }
  }

  /**
   * 모든 채팅 세션 삭제
   */
  async clearSessions(): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Supabase에서 chat_sessions만 초기화
        const { data: currentData, error: fetchError } = await supabase()
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          console.error('현재 preferences 조회 오류:', fetchError)
          this.clearLocalSessions()
          return false
        }

        const currentPreferences = currentData?.preferences || {}
        
        const updatedPreferences = {
          ...currentPreferences,
          chat_sessions: []
        }

        const { error: updateError } = await supabase()
          .from('user_profiles')
          .update({ 
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('채팅 세션 전체 초기화 오류:', updateError)
          this.clearLocalSessions()
          return false
        }

        return true
      } else {
        // 비인증 사용자는 localStorage 초기화
        this.clearLocalSessions()
        return true
      }
    } catch (error) {
      console.error('clearSessions 오류:', error)
      this.clearLocalSessions()
      return false
    }
  }

  // 직렬화/역직렬화 메서드들
  private serializeSession(session: ChatSession): any {
    return {
      ...session,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString(),
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    }
  }

  private deserializeSession(serializedSession: any): ChatSession {
    return {
      ...serializedSession,
      startedAt: new Date(serializedSession.startedAt),
      endedAt: serializedSession.endedAt ? new Date(serializedSession.endedAt) : undefined,
      messages: serializedSession.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
  }

  private deserializeSessions(serializedSessions: any[]): ChatSession[] {
    return serializedSessions.map(session => this.deserializeSession(session))
  }

  // localStorage 폴백 메서드들
  private getLocalSessions(): ChatSession[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(`${this.storagePrefix}sessions`)
      if (!stored) return []
      
      const serializedSessions = JSON.parse(stored)
      return this.deserializeSessions(serializedSessions)
    } catch (error) {
      console.error('localStorage 채팅 세션 조회 오류:', error)
      return []
    }
  }

  private saveLocalSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return
    
    try {
      const serializedSessions = sessions.map(session => this.serializeSession(session))
      localStorage.setItem(`${this.storagePrefix}sessions`, JSON.stringify(serializedSessions))
    } catch (error) {
      console.error('localStorage 채팅 세션 저장 오류:', error)
    }
  }

  private createLocalSession(session: ChatSession): void {
    const sessions = this.getLocalSessions()
    const updatedSessions = [...sessions, session]
    this.saveLocalSessions(updatedSessions)
  }

  private updateLocalSession(session: ChatSession): void {
    const sessions = this.getLocalSessions()
    const updatedSessions = sessions.map(s => s.id === session.id ? session : s)
    this.saveLocalSessions(updatedSessions)
  }

  private deleteLocalSession(sessionId: string): void {
    const sessions = this.getLocalSessions()
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    this.saveLocalSessions(updatedSessions)
  }

  private clearLocalSessions(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(`${this.storagePrefix}sessions`)
    } catch (error) {
      console.error('localStorage 채팅 세션 전체 초기화 오류:', error)
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const supabaseChatService = SupabaseChatService.getInstance()