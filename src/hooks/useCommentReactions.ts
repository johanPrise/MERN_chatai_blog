import { useState, useCallback } from 'react'
import { API_ENDPOINTS } from '../config/api.config'

interface ReactionState {
  likes: string[]
  dislikes: string[]
  isLiked: boolean
  isDisliked: boolean
}

export const useCommentReactions = (commentId: string, userId?: string) => {
  const [state, setState] = useState<ReactionState>({
    likes: [],
    dislikes: [],
    isLiked: false,
    isDisliked: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const updateState = useCallback((likes: string[], dislikes: string[]) => {
    setState({
      likes,
      dislikes,
      isLiked: userId ? likes.includes(userId) : false,
      isDisliked: userId ? dislikes.includes(userId) : false
    })
  }, [userId])

  const handleLike = useCallback(async () => {
    if (!userId || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch(API_ENDPOINTS.comments.like(commentId), {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Like response data:', data)
        setState({
          likes: data.likes || [],
          dislikes: data.dislikes || [],
          isLiked: data.isLiked || false,
          isDisliked: data.isDisliked || false
        })
      }
    } catch (error) {
      console.error('Erreur like:', error)
    } finally {
      setIsLoading(false)
    }
  }, [commentId, userId, isLoading])

  const handleDislike = useCallback(async () => {
    if (!userId || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch(API_ENDPOINTS.comments.dislike(commentId), {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Dislike response data:', data)
        setState({
          likes: data.likes || [],
          dislikes: data.dislikes || [],
          isLiked: data.isLiked || false,
          isDisliked: data.isDisliked || false
        })
      }
    } catch (error) {
      console.error('Erreur dislike:', error)
    } finally {
      setIsLoading(false)
    }
  }, [commentId, userId, isLoading])

  return {
    ...state,
    isLoading,
    handleLike,
    handleDislike,
    updateState
  }
}