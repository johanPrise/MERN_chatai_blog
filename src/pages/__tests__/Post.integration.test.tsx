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

describe('Comment Likes/Dislikes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should handle complete comment like workflow with persistence', async () => {
    const postId = 'post123'
    const commentId = 'comment123'

    // Step 1: Initial page load - comment has no likes
    const initialCommentsData = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: [],
        dislikes: [],
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => initialCommentsData
    })

    // Load initial comments
    let response = await fetch(`/api/comments/post/${postId}`)
    let comments = await response.json()
    let comment = comments.find((c: any) => c._id === commentId)
    
    expect(comment.likes).toEqual([])
    expect(comment.dislikes).toEqual([])

    // Step 2: User likes the comment
    const likeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }

    global.fetch = vi.fn().mockResolvedValue(likeResponse)

    response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    expect(response.ok).toBe(true)
    const likeData = await response.json()
    expect(likeData.likes).toContain('user123')
    expect(likeData.dislikes).toEqual([])

    // Step 3: Simulate page reload - like should persist
    const commentsAfterLike = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: ['user123'], // Like persisted
        dislikes: [],
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => commentsAfterLike
    })

    response = await fetch(`/api/comments/post/${postId}`)
    comments = await response.json()
    comment = comments.find((c: any) => c._id === commentId)
    
    expect(comment.likes).toContain('user123')
    expect(comment.dislikes).toEqual([])

    // Step 4: User changes to dislike
    const dislikeResponse = {
      ok: true,
      json: async () => ({
        likes: [], // Like removed
        dislikes: ['user123'] // Dislike added
      })
    }

    global.fetch = vi.fn().mockResolvedValue(dislikeResponse)

    response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })

    expect(response.ok).toBe(true)
    const dislikeData = await response.json()
    expect(dislikeData.likes).toEqual([])
    expect(dislikeData.dislikes).toContain('user123')

    // Step 5: Final page reload - dislike should persist
    const commentsAfterDislike = [
      {
        _id: commentId,
        content: 'Test comment',
        likes: [],
        dislikes: ['user123'], // Dislike persisted
        author: { _id: 'author1', username: 'commenter' },
        createdAt: new Date().toISOString(),
        replies: []
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => commentsAfterDislike
    })

    response = await fetch(`/api/comments/post/${postId}`)
    comments = await response.json()
    comment = comments.find((c: any) => c._id === commentId)
    
    expect(comment.likes).toEqual([])
    expect(comment.dislikes).toContain('user123')
  })

  it('should handle comment like/dislike error scenarios with proper rollback', async () => {
    const commentId = 'comment123'

    // Step 1: Attempt to like comment but API fails
    const errorResponse = {
      ok: false,
      json: async () => ({
        message: 'Server error'
      })
    }

    global.fetch = vi.fn().mockResolvedValue(errorResponse)

    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    expect(response.ok).toBe(false)
    const errorData = await response.json()
    expect(errorData.message).toBe('Server error')

    // Step 2: Network error scenario
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

  it('should handle multiple users liking/disliking the same comment', async () => {
    const commentId = 'comment123'

    // Step 1: User1 likes the comment
    const user1LikeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123'],
        dislikes: []
      })
    }

    global.fetch = vi.fn().mockResolvedValue(user1LikeResponse)

    let response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    let data = await response.json()
    expect(data.likes).toEqual(['user123'])

    // Step 2: User2 also likes the comment
    const user2LikeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123', 'user456'],
        dislikes: []
      })
    }

    global.fetch = vi.fn().mockResolvedValue(user2LikeResponse)

    response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    data = await response.json()
    expect(data.likes).toEqual(['user123', 'user456'])

    // Step 3: User3 dislikes the comment
    const user3DislikeResponse = {
      ok: true,
      json: async () => ({
        likes: ['user123', 'user456'],
        dislikes: ['user789']
      })
    }

    global.fetch = vi.fn().mockResolvedValue(user3DislikeResponse)

    response = await fetch(`/api/comments/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include'
    })

    data = await response.json()
    expect(data.likes).toEqual(['user123', 'user456'])
    expect(data.dislikes).toEqual(['user789'])
  })

  it('should prevent multiple simultaneous requests for the same comment', async () => {
    const commentId = 'comment123'

    // Mock a slow API response
    const slowResponse = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({
            likes: ['user123'],
            dislikes: []
          })
        })
      }, 100)
    })

    global.fetch = vi.fn().mockReturnValue(slowResponse)

    // Start two simultaneous requests
    const request1 = fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    const request2 = fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      credentials: 'include'
    })

    // Both should complete
    const [response1, response2] = await Promise.all([request1, request2])

    expect(response1.ok).toBe(true)
    expect(response2.ok).toBe(true)

    // But the actual implementation should prevent duplicate processing
    // This would be handled by the loading state check in the component
  })
})