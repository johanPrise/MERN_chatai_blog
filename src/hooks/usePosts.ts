/**
 * Custom hook for posts management
 * Provides unified interface for fetching, filtering, and managing posts
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Post as PostType } from '../types/PostType'

export interface PostFilters {
  search?: string
  category?: string
  author?: string
  tag?: string
  status?: 'published' | 'draft' | 'archived'
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes'
  sortOrder?: 'asc' | 'desc'
}

export interface PostsState {
  posts: PostType[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface UsePostsOptions {
  initialFilters?: PostFilters
  pageSize?: number
  autoFetch?: boolean
  enableCache?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export function usePosts(options: UsePostsOptions = {}) {
  const {
    initialFilters = {},
    pageSize = 12,
    autoFetch = true,
    enableCache = false
  } = options

  const [state, setState] = useState<PostsState>({
    posts: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  const [filters, setFilters] = useState<PostFilters>(initialFilters)
  const [cache, setCache] = useState<Map<string, { data: PostType[], timestamp: number }>>(new Map())

  // Cache duration: 30 seconds (reduced for better UX)
  const CACHE_DURATION = 30 * 1000

  // Generate cache key from filters and page
  const getCacheKey = useCallback((filters: PostFilters, page: number) => {
    return JSON.stringify({ ...filters, page, pageSize })
  }, [pageSize])

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION
  }, [])

  // Fetch posts from API
  const fetchPosts = useCallback(async (
    currentFilters: PostFilters = filters,
    page: number = 1,
    useCache: boolean = enableCache
  ) => {
    const cacheKey = getCacheKey(currentFilters, page)
    
    // Check cache first (only if explicitly enabled)
    if (useCache && enableCache && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!
      if (isCacheValid(cached.timestamp)) {
        setState(prev => ({
          ...prev,
          posts: cached.data,
          loading: false,
          error: null,
          currentPage: page
        }))
        return cached.data
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.category && { category: currentFilters.category }),
        ...(currentFilters.author && { author: currentFilters.author }),
        ...(currentFilters.tag && { tag: currentFilters.tag }),
        ...(currentFilters.status && { status: currentFilters.status }),
        ...(currentFilters.sortBy && { sortBy: currentFilters.sortBy }),
        ...(currentFilters.sortOrder && { sortOrder: currentFilters.sortOrder })
      })

      const response = await fetch(`${API_BASE_URL}/posts?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle different response formats
      let posts: PostType[]
      let totalCount: number
      
      if (Array.isArray(data)) {
        posts = data
        totalCount = data.length
      } else if (data.posts && Array.isArray(data.posts)) {
        posts = data.posts
        totalCount = data.totalCount || data.total || data.posts.length
      } else {
        throw new Error('Invalid response format')
      }

      const totalPages = Math.ceil(totalCount / pageSize)

      // Update cache
      if (useCache) {
        setCache(prev => new Map(prev).set(cacheKey, {
          data: posts,
          timestamp: Date.now()
        }))
      }

      setState(prev => ({
        ...prev,
        posts,
        loading: false,
        error: null,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }))

      return posts
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch posts'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        posts: []
      }))
      throw error
    }
  }, [filters, pageSize, enableCache, getCacheKey, cache, isCacheValid])

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: Partial<PostFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchPosts(updatedFilters, 1)
  }, [filters, fetchPosts])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    fetchPosts(initialFilters, 1)
  }, [initialFilters, fetchPosts])

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchPosts(filters, page)
    }
  }, [filters, fetchPosts, state.totalPages])

  // Go to next page
  const nextPage = useCallback(() => {
    if (state.hasNextPage) {
      goToPage(state.currentPage + 1)
    }
  }, [state.hasNextPage, state.currentPage, goToPage])

  // Go to previous page
  const prevPage = useCallback(() => {
    if (state.hasPrevPage) {
      goToPage(state.currentPage - 1)
    }
  }, [state.hasPrevPage, state.currentPage, goToPage])

  // Refresh current page
  const refresh = useCallback(() => {
    fetchPosts(filters, state.currentPage, false) // Skip cache
  }, [filters, state.currentPage, fetchPosts])

  // Force refresh - clears cache and refetches
  const forceRefresh = useCallback(() => {
    console.log('[usePosts] Force refresh triggered - clearing cache and refetching')
    setCache(new Map()) // Clear cache first
    return fetchPosts(filters, state.currentPage, false) // Then fetch without cache
  }, [filters, state.currentPage, fetchPosts])

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  // Invalidate cache for specific operations
  const invalidateCache = useCallback(() => {
    console.log('[usePosts] Cache invalidated - clearing all cached data')
    setCache(new Map())
    // Force immediate refresh after cache invalidation
    return fetchPosts(filters, state.currentPage, false)
  }, [filters, state.currentPage, fetchPosts])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPosts(filters, 1)
    }
  }, []) // Only run on mount

  // Memoized computed values
  const computedValues = useMemo(() => ({
    isEmpty: state.posts.length === 0 && !state.loading,
    isFirstPage: state.currentPage === 1,
    isLastPage: state.currentPage === state.totalPages,
    hasData: state.posts.length > 0,
    pageInfo: {
      current: state.currentPage,
      total: state.totalPages,
      size: pageSize,
      count: state.totalCount,
      hasNext: state.hasNextPage,
      hasPrev: state.hasPrevPage
    }
  }), [state, pageSize])

  return {
    // State
    ...state,
    filters,
    
    // Computed values
    ...computedValues,
    
    // Actions
    fetchPosts,
    updateFilters,
    resetFilters,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    forceRefresh,
    clearCache,
    invalidateCache,
    
    // Utils
    setFilters
  }
}
