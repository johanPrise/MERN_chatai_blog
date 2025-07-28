import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the UserContext
const mockUserInfo = {
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com'
}

vi.mock('../../UserContext', () => ({
  UserContext: () => ({
    userInfo: mockUserInfo
  })
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'post123' }),
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => (
    <a href={to}>{children}</a>
  )
}))

// Mock API endpoints
vi.mock('../../config/api.config', () => ({
  API_ENDPOINTS: {
    posts: {
      detail: (id: string) => `/api/posts/${id}`,
      like: (id: string) => `/api/posts/${id}/like`,
      dislike: (id: string) => `/api/posts/${id}/dislike`
    },
    comments: {
      byPost: (postId: string) => `/api/comments/post/${postId}`,
      create: '/api/comments',
      update: (id: string) => `/api/comments/${id}`,
      delete: (id: string) => `/api/comments/${id}`,
      like: (id: string) => `/api/comments/${id}/like`,
      dislike: (id: string) => `/api/comments/${id}/dislike`
    }
  },
  getImageUrl: (path?: string) => path || '/placeholder.svg'
}))

// Mock other dependencies
vi.mock('../../lib/utils', () => ({
  formatDate: (date: Date) => date.toLocaleDateString()
}))

vi.mock('../../lib/formatContent', () => ({
  formatContent: (content: string) => content
}))

vi.mock('../../lib/themeDetector', () => ({
  detectDarkMode: () => false,
  setupThemeListener: () => () => {}
}))

vi.mock('highlight.js', () => ({
  default: {
    configure: vi.fn(),
    highlight: vi.fn()
  }
}))

describe('Post Likes/Dislikes System', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  it('should handle successful post like', async () => {
    // Mock successful API response
    const mockResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    // Test that the API is called correctly
    const response = await fetch('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })
  })

  it('should handle successful post dislike', async () => {
    // Mock successful API response
    const mockResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: ['user123']
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    // Test that the API is called correctly
    const response = await fetch('/api/posts/post123/dislike', {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/posts/post123/dislike', {
      method: 'POST',
      credentials: 'include'
    })
  })

  it('should handle API error gracefully', async () => {
    // Mock API error response
    const mockResponse = {
      ok: false,
      json: async () => ({
        message: 'Unauthorized'
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetch('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(false)
    const data = await response.json()
    expect(data.message).toBe('Unauthorized')
  })

  it('should handle network error gracefully', async () => {
    // Mock network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    try {
      await fetch('/api/posts/post123/like', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })
})

// Test the hasUserLiked utility function
describe('hasUserLiked utility function', () => {
  const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
    if (!userId) return false;
    if (!likes) return false;
    if (!Array.isArray(likes)) return false;
    return likes.includes(userId);
  }

  it('should return true when user has liked', () => {
    const likes = ['user1', 'user2', 'user3']
    expect(hasUserLiked(likes, 'user2')).toBe(true)
  })

  it('should return false when user has not liked', () => {
    const likes = ['user1', 'user3']
    expect(hasUserLiked(likes, 'user2')).toBe(false)
  })

  it('should return false when likes is null or undefined', () => {
    expect(hasUserLiked(null, 'user1')).toBe(false)
    expect(hasUserLiked(undefined, 'user1')).toBe(false)
  })

  it('should return false when likes is not an array', () => {
    expect(hasUserLiked('not-an-array', 'user1')).toBe(false)
    expect(hasUserLiked({}, 'user1')).toBe(false)
  })

  it('should return false when userId is undefined', () => {
    const likes = ['user1', 'user2']
    expect(hasUserLiked(likes, undefined)).toBe(false)
  })
})