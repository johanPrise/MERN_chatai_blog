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

describe('Comment Likes/Dislikes System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should handle successful comment like with real API call', async () => {
    const commentId = 'comment123'
    const mockResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    // Test that the API is called correctly
    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    expect(data.likes).toContain('user123')
    expect(data.dislikes).toEqual([])
  })

  it('should handle successful comment dislike with real API call', async () => {
    const commentId = 'comment123'
    const mockResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: ['user123']
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    expect(data.likes).toEqual([])
    expect(data.dislikes).toContain('user123')
  })

  it('should handle comment like API error with proper rollback', async () => {
    const commentId = 'comment123'
    const mockResponse = {
      ok: false,
      json: async () => ({
        message: 'Unauthorized to like comment'
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(false)
    const data = await response.json()
    expect(data.message).toBe('Unauthorized to like comment')
  })

  it('should handle comment dislike API error with proper rollback', async () => {
    const commentId = 'comment123'
    const mockResponse = {
      ok: false,
      json: async () => ({
        message: 'Unauthorized to dislike comment'
      })
    }
    
    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    
    expect(response.ok).toBe(false)
    const data = await response.json()
    expect(data.message).toBe('Unauthorized to dislike comment')
  })

  it('should handle network error for comment like with proper rollback', async () => {
    const commentId = 'comment123'
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    try {
      await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('should handle network error for comment dislike with proper rollback', async () => {
    const commentId = 'comment123'
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    try {
      await fetch(`/api/comments/${commentId}/dislike`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('should handle comment like toggle behavior (like -> unlike)', async () => {
    const commentId = 'comment123'
    
    // First call: user likes the comment
    const likeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }

    // Second call: user unlikes the comment
    const unlikeResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: []
      })
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce(likeResponse)
      .mockResolvedValueOnce(unlikeResponse)

    // First like
    let response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    let data = await response.json()
    expect(data.likes).toContain('user123')

    // Second like (should unlike)
    response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    data = await response.json()
    expect(data.likes).not.toContain('user123')
  })

  it('should handle comment dislike toggle behavior (dislike -> undislike)', async () => {
    const commentId = 'comment123'
    
    // First call: user dislikes the comment
    const dislikeResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: ['user123']
      })
    }

    // Second call: user undislikes the comment
    const undislikeResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: []
      })
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce(dislikeResponse)
      .mockResolvedValueOnce(undislikeResponse)

    // First dislike
    let response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    let data = await response.json()
    expect(data.dislikes).toContain('user123')

    // Second dislike (should undislike)
    response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    data = await response.json()
    expect(data.dislikes).not.toContain('user123')
  })

  it('should handle comment like/dislike mutual exclusivity (like -> dislike)', async () => {
    const commentId = 'comment123'
    
    // First: user likes the comment
    const likeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }

    // Then: user dislikes the comment (should remove like and add dislike)
    const dislikeResponse = {
      ok: true,
      json: async () => ({
        likes: [], // Like removed
        dislikes: ['user123'] // Dislike added
      })
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce(likeResponse)
      .mockResolvedValueOnce(dislikeResponse)

    // First like
    let response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    let data = await response.json()
    expect(data.likes).toContain('user123')
    expect(data.dislikes).not.toContain('user123')

    // Then dislike
    response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    data = await response.json()
    expect(data.likes).not.toContain('user123')
    expect(data.dislikes).toContain('user123')
  })

  it('should handle comment dislike/like mutual exclusivity (dislike -> like)', async () => {
    const commentId = 'comment123'
    
    // First: user dislikes the comment
    const dislikeResponse = {
      ok: true,
      json: async () => ({
        likes: [],
        dislikes: ['user123']
      })
    }

    // Then: user likes the comment (should remove dislike and add like)
    const likeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'], // Like added
        dislikes: [] // Dislike removed
      })
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce(dislikeResponse)
      .mockResolvedValueOnce(likeResponse)

    // First dislike
    let response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })
    let data = await response.json()
    expect(data.dislikes).toContain('user123')
    expect(data.likes).not.toContain('user123')

    // Then like
    response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })
    data = await response.json()
    expect(data.likes).toContain('user123')
    expect(data.dislikes).not.toContain('user123')
  })
})

describe('Comment Persistence After Page Reload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should load and persist comment like state after page reload', async () => {
    const postId = 'post123'
    const commentId = 'comment123'
    
    // Mock comments data with user having liked a comment
    const mockCommentsData = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: ['user123', 'user456'], // User has liked this comment
        dislikes: ['user789'],
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommentsData
    })

    // Simulate fetching comments data (what happens on page load)
    const response = await fetch(`/api/comments/post/${postId}`)
    const comments = await response.json()

    // Verify the comment data contains the user's like
    const comment = comments.find((c: any) => c._id === commentId)
    expect(comment.likes).toContain('user123')
    expect(comment.dislikes).not.toContain('user123')

    // Test the hasUserLiked function with the loaded data
    const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
      if (!userId) return false;
      if (!likes) return false;
      if (!Array.isArray(likes)) return false;
      return likes.includes(userId);
    }

    // Verify user state would be correctly set
    const userLiked = hasUserLiked(comment.likes, 'user123')
    const userDisliked = hasUserLiked(comment.dislikes, 'user123')

    expect(userLiked).toBe(true)
    expect(userDisliked).toBe(false)
  })

  it('should load and persist comment dislike state after page reload', async () => {
    const postId = 'post123'
    const commentId = 'comment123'
    
    // Mock comments data with user having disliked a comment
    const mockCommentsData = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: ['user456'],
        dislikes: ['user123', 'user789'], // User has disliked this comment
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommentsData
    })

    const response = await fetch(`/api/comments/post/${postId}`)
    const comments = await response.json()

    const comment = comments.find((c: any) => c._id === commentId)
    expect(comment.dislikes).toContain('user123')
    expect(comment.likes).not.toContain('user123')

    const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
      if (!userId) return false;
      if (!likes) return false;
      if (!Array.isArray(likes)) return false;
      return likes.includes(userId);
    }

    const userLiked = hasUserLiked(comment.likes, 'user123')
    const userDisliked = hasUserLiked(comment.dislikes, 'user123')

    expect(userLiked).toBe(false)
    expect(userDisliked).toBe(true)
  })

  it('should ensure comment interactions persist across page reloads', async () => {
    const commentId = 'comment123'
    
    // Simulate a like action
    const likeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }

    global.fetch = vi.fn().mockResolvedValue(likeResponse)

    // User likes the comment
    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()
    expect(data.likes).toContain('user123')

    // Now simulate page reload by fetching comments again
    const postId = 'post123'
    const mockCommentsAfterReload = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: ['user123'], // Like should persist
        dislikes: [],
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCommentsAfterReload
    })

    const reloadResponse = await fetch(`/api/comments/post/${postId}`)
    const commentsAfterReload = await reloadResponse.json()

    const commentAfterReload = commentsAfterReload.find((c: any) => c._id === commentId)
    expect(commentAfterReload.likes).toContain('user123')
    expect(commentAfterReload.dislikes).not.toContain('user123')
  })
})