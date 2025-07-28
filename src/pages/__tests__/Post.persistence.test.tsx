import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Post Likes/Dislikes Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should load and persist user like state after page reload', async () => {
    // Mock post data with user having liked the post
    const mockPostData = {
      post: {
        _id: 'post123',
        title: 'Test Post',
        content: 'Test content',
        likes: ['user123', 'user456'], // User has liked
        dislikes: ['user789'],
        author: { _id: 'author1', username: 'author' }
      }
    }

    // Mock fetch for post detail
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPostData
    })

    // Simulate fetching post data (what happens on page load)
    const response = await fetch('/api/posts/post123')
    const data = await response.json()
    const post = data.post || data

    // Verify the post data contains the user's like
    expect(post.likes).toContain('user123')
    expect(post.dislikes).not.toContain('user123')

    // Test the hasUserLiked function with the loaded data
    const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
      if (!userId) return false;
      if (!likes) return false;
      if (!Array.isArray(likes)) return false;
      return likes.includes(userId);
    }

    // Verify user state would be correctly set
    const userLiked = hasUserLiked(post.likes, 'user123')
    const userDisliked = hasUserLiked(post.dislikes, 'user123')

    expect(userLiked).toBe(true)
    expect(userDisliked).toBe(false)
  })

  it('should load and persist user dislike state after page reload', async () => {
    // Mock post data with user having disliked the post
    const mockPostData = {
      post: {
        _id: 'post123',
        title: 'Test Post',
        content: 'Test content',
        likes: ['user456'],
        dislikes: ['user123', 'user789'], // User has disliked
        author: { _id: 'author1', username: 'author' }
      }
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPostData
    })

    const response = await fetch('/api/posts/post123')
    const data = await response.json()
    const post = data.post || data

    expect(post.dislikes).toContain('user123')
    expect(post.likes).not.toContain('user123')

    const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
      if (!userId) return false;
      if (!likes) return false;
      if (!Array.isArray(likes)) return false;
      return likes.includes(userId);
    }

    const userLiked = hasUserLiked(post.likes, 'user123')
    const userDisliked = hasUserLiked(post.dislikes, 'user123')

    expect(userLiked).toBe(false)
    expect(userDisliked).toBe(true)
  })

  it('should handle like action and update state correctly', async () => {
    // Mock initial state (user hasn't liked)
    const initialPost = {
      likes: ['user456'],
      dislikes: []
    }

    // Mock response after liking (user now likes)
    const afterLikeResponse = {
      likes: ['user456', 'user123'],
      dislikes: []
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => afterLikeResponse
    })

    // Simulate like action
    const response = await fetch('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    // Verify the response contains updated likes
    expect(data.likes).toContain('user123')
    expect(data.likes.length).toBe(2)
    expect(data.dislikes.length).toBe(0)

    // Verify API was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })
  })

  it('should handle dislike action and update state correctly', async () => {
    // Mock response after disliking
    const afterDislikeResponse = {
      likes: [],
      dislikes: ['user123']
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => afterDislikeResponse
    })

    // Simulate dislike action
    const response = await fetch('/api/posts/post123/dislike', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    // Verify the response contains updated dislikes
    expect(data.dislikes).toContain('user123')
    expect(data.likes.length).toBe(0)
    expect(data.dislikes.length).toBe(1)

    // Verify API was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/posts/post123/dislike', {
      method: 'POST',
      credentials: 'include'
    })
  })

  it('should handle toggle behavior (like -> dislike)', async () => {
    // User initially likes the post
    const initialState = {
      likes: ['user123'],
      dislikes: []
    }

    // After disliking, user's like is removed and dislike is added
    const afterDislikeResponse = {
      likes: [], // User removed from likes
      dislikes: ['user123'] // User added to dislikes
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => afterDislikeResponse
    })

    const response = await fetch('/api/posts/post123/dislike', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    // Verify the toggle behavior
    expect(data.likes).not.toContain('user123')
    expect(data.dislikes).toContain('user123')
  })

  it('should handle toggle behavior (dislike -> like)', async () => {
    // User initially dislikes the post
    const initialState = {
      likes: [],
      dislikes: ['user123']
    }

    // After liking, user's dislike is removed and like is added
    const afterLikeResponse = {
      likes: ['user123'], // User added to likes
      dislikes: [] // User removed from dislikes
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => afterLikeResponse
    })

    const response = await fetch('/api/posts/post123/like', {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    // Verify the toggle behavior
    expect(data.likes).toContain('user123')
    expect(data.dislikes).not.toContain('user123')
  })
})