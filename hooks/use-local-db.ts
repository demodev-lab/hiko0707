'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db/database-service'
import { User, Post, Comment } from '@/lib/db/local/models'
import { HotDeal } from '@/types/hotdeal'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await db.users.findAll()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const createUser = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await db.users.create(userData)
      await loadUsers()
      return newUser
    } catch (err) {
      console.error('Failed to create user:', err)
      throw err
    }
  }, [loadUsers])

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = await db.users.update(id, userData)
      await loadUsers()
      return updatedUser
    } catch (err) {
      console.error('Failed to update user:', err)
      throw err
    }
  }, [loadUsers])

  const deleteUser = useCallback(async (id: string) => {
    try {
      const result = await db.users.delete(id)
      await loadUsers()
      return result
    } catch (err) {
      console.error('Failed to delete user:', err)
      throw err
    }
  }, [loadUsers])

  return { users, loading, error, createUser, updateUser, deleteUser, refetch: loadUsers }
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await db.posts.findAll()
      setPosts(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load posts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const createPost = useCallback(async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const postWithDates = {
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const newPost = await db.posts.create(postWithDates)
      await loadPosts()
      return newPost
    } catch (err) {
      console.error('Failed to create post:', err)
      throw err
    }
  }, [loadPosts])

  const updatePost = useCallback(async (id: string, postData: Partial<Post>) => {
    try {
      const updatedPost = await db.posts.update(id, postData)
      await loadPosts()
      return updatedPost
    } catch (err) {
      console.error('Failed to update post:', err)
      throw err
    }
  }, [loadPosts])

  const deletePost = useCallback(async (id: string) => {
    try {
      const result = await db.posts.delete(id)
      await loadPosts()
      return result
    } catch (err) {
      console.error('Failed to delete post:', err)
      throw err
    }
  }, [loadPosts])

  return { posts, loading, error, createPost, updatePost, deletePost, refetch: loadPosts }
}

export function usePost(id: string) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        const data = await db.posts.findById(id)
        setPost(data)
        setError(null)
      } catch (err) {
        setError(err as Error)
        console.error('Failed to load post:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  return { post, loading, error }
}

export function useComments(postId?: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = postId 
        ? await db.comments.findByPost(postId)
        : await db.comments.findAll()
      setComments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const createComment = useCallback(async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const commentWithDates = {
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const newComment = await db.comments.create(commentWithDates)
      await loadComments()
      return newComment
    } catch (err) {
      console.error('Failed to create comment:', err)
      throw err
    }
  }, [loadComments])

  const deleteComment = useCallback(async (id: string) => {
    try {
      const result = await db.comments.delete(id)
      await loadComments()
      return result
    } catch (err) {
      console.error('Failed to delete comment:', err)
      throw err
    }
  }, [loadComments])

  return { comments, loading, error, createComment, deleteComment, refetch: loadComments }
}

export function useHotDeals() {
  const [hotdeals, setHotDeals] = useState<HotDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadHotDeals = useCallback(async () => {
    try {
      setLoading(true)
      const data = await db.hotdeals.findAll()
      
      // 데이터가 없거나 매우 적을 경우 JSON 파일에서 자동 로드
      if (data.length < 10) {
        console.log('핫딜 데이터가 부족합니다. 최신 JSON 파일에서 로드를 시도합니다.')
        await loadFromLatestJson()
        // 다시 데이터베이스에서 로드
        const updatedData = await db.hotdeals.findAll()
        setHotDeals(updatedData)
      } else {
        setHotDeals(data)
      }
      
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load hotdeals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 최신 JSON 파일에서 데이터 로드
  const loadFromLatestJson = useCallback(async () => {
    try {
      console.log('최신 JSON 파일에서 핫딜 데이터를 로드합니다...')
      
      // JSON 파일 목록 가져오기
      const filesResponse = await fetch('/api/placeholder/list-exports')
      if (!filesResponse.ok) {
        throw new Error('JSON 파일 목록을 가져올 수 없습니다')
      }
      
      const files = await filesResponse.json()
      if (!Array.isArray(files) || files.length === 0) {
        throw new Error('사용 가능한 JSON 파일이 없습니다')
      }
      
      // 가장 최신 파일 선택
      const latestFile = files[0]
      console.log(`최신 파일 선택: ${latestFile}`)
      
      // 파일 내용 가져오기
      const dataResponse = await fetch(`/api/placeholder/exports/${latestFile}`)
      if (!dataResponse.ok) {
        throw new Error('JSON 파일을 읽을 수 없습니다')
      }
      
      const data = await dataResponse.json()
      
      if (!data.hotdeals || !Array.isArray(data.hotdeals)) {
        throw new Error('잘못된 JSON 형식입니다')
      }
      
      console.log(`JSON 파일에서 ${data.hotdeals.length}개의 핫딜을 발견했습니다`)
      
      // localStorage에 저장 - 안전한 데이터 처리
      const newHotdeals = data.hotdeals.map((deal: any, index: number) => ({
        ...deal,
        id: deal.id || `hotdeal_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        // 필수 필드 기본값 설정
        communityCommentCount: deal.communityCommentCount || 0,
        communityRecommendCount: deal.communityRecommendCount || 0,
        viewCount: deal.viewCount || 0,
        price: deal.price || 0,
        crawledAt: deal.crawledAt || deal.postDate || new Date().toISOString(),
        // Date 객체 변환 처리
        ...(deal.crawledAt && { crawledAt: new Date(deal.crawledAt) })
      }))
      
      // localStorage에 저장
      localStorage.setItem('hiko_hotdeals', JSON.stringify(newHotdeals))
      console.log(`${newHotdeals.length}개의 핫딜을 localStorage에 저장했습니다`)
      
      return newHotdeals
    } catch (error) {
      console.error('JSON 파일에서 핫딜 로드 실패:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    loadHotDeals()
  }, [loadHotDeals])

  const createHotDeal = useCallback(async (hotdealData: Omit<HotDeal, 'id'>) => {
    try {
      const newHotDeal = await db.hotdeals.create(hotdealData)
      await loadHotDeals()
      return newHotDeal
    } catch (err) {
      console.error('Failed to create hotdeal:', err)
      throw err
    }
  }, [loadHotDeals])

  const updateHotDeal = useCallback(async (id: string, hotdealData: Partial<HotDeal>) => {
    try {
      const updatedHotDeal = await db.hotdeals.update(id, hotdealData)
      await loadHotDeals()
      return updatedHotDeal
    } catch (err) {
      console.error('Failed to update hotdeal:', err)
      throw err
    }
  }, [loadHotDeals])

  const deleteHotDeal = useCallback(async (id: string) => {
    try {
      const result = await db.hotdeals.delete(id)
      await loadHotDeals()
      return result
    } catch (err) {
      console.error('Failed to delete hotdeal:', err)
      throw err
    }
  }, [loadHotDeals])

  const deleteAllHotDeals = useCallback(async () => {
    try {
      await db.hotdeals.deleteAll()
      await loadHotDeals()
      return true
    } catch (err) {
      console.error('Failed to delete all hotdeals:', err)
      throw err
    }
  }, [loadHotDeals])

  // 수동으로 JSON에서 데이터 로드
  const loadFromJson = useCallback(async () => {
    try {
      setLoading(true)
      await loadFromLatestJson()
      await loadHotDeals()
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load from JSON:', err)
    } finally {
      setLoading(false)
    }
  }, [loadFromLatestJson, loadHotDeals])

  return { 
    hotdeals, 
    loading, 
    error, 
    createHotDeal, 
    updateHotDeal, 
    deleteHotDeal, 
    deleteAllHotDeals, 
    refetch: loadHotDeals,
    loadFromJson 
  }
}