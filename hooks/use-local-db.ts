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
      setHotDeals(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load hotdeals:', err)
    } finally {
      setLoading(false)
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

  return { hotdeals, loading, error, createHotDeal, updateHotDeal, deleteHotDeal, deleteAllHotDeals, refetch: loadHotDeals }
}