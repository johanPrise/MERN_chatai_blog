import { useState, useCallback } from 'react'
import { useGlobalErrorHandler } from './useGlobalErrorHandler'
import { ApiError } from '../types/ErrorTypes'

interface InteractionState {
  isLoading: boolean
  error: string | null
}

interface UseInteractionsReturn {
  likePost: (postId: string) => Promise<boolean>
  dislikePost: (postId: string) => Promise<boolean>
  likeComment: (commentId: string) => Promise<boolean>
  dislikeComment: (commentId: string) => Promise<boolean>
  interactionState: InteractionState
  clearError: () => void
}

/**
 * Hook for handling user interactions (likes/dislikes) with centralized error handling
 * Provides consistent error handling and user feedback for all interaction types
 */
export const useInteractions = (): UseInteractionsReturn => {
  const [interactionState, setInteractionState] = useState<InteractionState>({
    isLoading: false,
    error: null
  })
  const { handleInteractionError, handleApiError } = useGlobalErrorHandler()

  const clearError = useCallback(() => {
    setInteractionState(prev => ({ ...prev, error: null }))
  }, [])

  const handleInteractionRequest = useCallback(async (
    type: 'like' | 'dislike',
    target: 'post' | 'comment',
    targetId: string,
    apiCall: () => Promise<Response>
  ): Promise<boolean> => {
    setInteractionState({ isLoading: true, error: null })

    try {
      const response = await apiCall()

      if (!response.ok) {
        const apiError: ApiError = new Error(`${type} ${target} failed`) as ApiError
        apiError.status = response.status

        // Try to get error details from response
        try {
          const errorData = await response.json()
          apiError.message = errorData.message || apiError.message
          apiError.details = errorData
        } catch {
          // Response is not JSON, use default message
        }

        handleInteractionError(type, target, targetId, {
          context: { 
            component: 'useInteractions', 
            action: `${type}_${target}`,
            userId: undefined // Could be populated from user context
          },
          showToUser: true,
          logToConsole: true
        })

        setInteractionState({ isLoading: false, error: apiError.message })
        return false
      }

      setInteractionState({ isLoading: false, error: null })
      return true

    } catch (error) {
      const apiError = error as ApiError
      
      handleInteractionError(type, target, targetId, {
        context: { 
          component: 'useInteractions', 
          action: `${type}_${target}_network_error`,
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })

      setInteractionState({ 
        isLoading: false, 
        error: apiError.message || `Erreur lors du ${type} du ${target}` 
      })
      return false
    }
  }, [handleInteractionError])

  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    return handleInteractionRequest('like', 'post', postId, async () => {
      return fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
    })
  }, [handleInteractionRequest])

  const dislikePost = useCallback(async (postId: string): Promise<boolean> => {
    return handleInteractionRequest('dislike', 'post', postId, async () => {
      return fetch(`/api/posts/${postId}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
    })
  }, [handleInteractionRequest])

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    return handleInteractionRequest('like', 'comment', commentId, async () => {
      return fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
    })
  }, [handleInteractionRequest])

  const dislikeComment = useCallback(async (commentId: string): Promise<boolean> => {
    return handleInteractionRequest('dislike', 'comment', commentId, async () => {
      return fetch(`/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
    })
  }, [handleInteractionRequest])

  return {
    likePost,
    dislikePost,
    likeComment,
    dislikeComment,
    interactionState,
    clearError
  }
}