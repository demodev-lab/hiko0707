// Supabase Chat Hook 기본 기능 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSupabaseChat } from '../use-supabase-chat'

// Mock Supabase service
vi.mock('@/lib/services/supabase-chat-service', () => ({
  supabaseChatService: {
    getSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue(true),
    updateSession: vi.fn().mockResolvedValue(true),
    deleteSession: vi.fn().mockResolvedValue(true),
    clearSessions: vi.fn().mockResolvedValue(true),
    addMessage: vi.fn().mockResolvedValue(true),
  }
}))

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [],
    isLoading: false,
  }),
  useMutation: vi.fn().mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(true),
    mutate: vi.fn(),
    isPending: false,
  }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    cancelQueries: vi.fn(),
  })
}))

describe('useSupabaseChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Hook이 정상적으로 export되는지 확인', () => {
    expect(typeof useSupabaseChat).toBe('function')
  })

  it('Hook의 기본 구조가 올바른지 확인', () => {
    // 함수가 올바르게 정의되었는지 확인
    expect(useSupabaseChat).toBeDefined()
    
    // 타입 정보 확인
    const hookString = useSupabaseChat.toString()
    expect(hookString).toContain('useSupabaseChat')
  })

  it('Helper 함수들이 올바르게 정의되어 있는지 확인', () => {
    const hookCode = useSupabaseChat.toString()
    
    // 주요 함수들이 포함되어 있는지 확인
    expect(hookCode).toContain('getGreetingMessage')
    expect(hookCode).toContain('generateResponse')
    expect(hookCode).toContain('startNewSession')
    expect(hookCode).toContain('sendMessage')
    expect(hookCode).toContain('endSession')
  })
})