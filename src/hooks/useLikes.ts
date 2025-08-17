import { useState, useEffect, useCallback } from 'react'
import { API_ENDPOINTS } from '../config/api.config'
import { UserContext } from '../UserContext'

interface UseLikesProps {
  postId: string
  initialLikes: string[]
  initialDislikes: string[]
}

interface UseLikesReturn {
  isLiked: boolean
  isDisliked: boolean
  likeCount: number
  dislikeCount: number
  isLoading: boolean
  handleLike: () => Promise<void>
  handleDislike: () => Promise<void>
}

export const useLikes = ({ postId, initialLikes, initialDislikes }: UseLikesProps): UseLikesReturn => {
  const { userInfo } = UserContext()
  const userId = userInfo?.id

  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Initialiser les états à partir des données initiales
  useEffect(() => {
    const likes = Array.isArray(initialLikes) ? initialLikes : []
    const dislikes = Array.isArray(initialDislikes) ? initialDislikes : []
    
    setLikeCount(likes.length)
    setDislikeCount(dislikes.length)
    
    if (userId) {
      setIsLiked(likes.includes(userId))
      setIsDisliked(dislikes.includes(userId))
    } else {
      setIsLiked(false)
      setIsDisliked(false)
    }
  }, [initialLikes, initialDislikes, userId])

  const handleLike = useCallback(async () => {
    if (!userId || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch(API_ENDPOINTS.posts.like(postId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Utiliser directement les données du serveur
        setIsLiked(data.isLiked)
        setIsDisliked(data.isDisliked)
        setLikeCount(data.likeCount)
        setDislikeCount(data.dislikeCount)
      } else {
        console.error('Erreur lors du like:', response.status)
      }
    } catch (error) {
      console.error('Erreur réseau lors du like:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, userId, isLoading])

  const handleDislike = useCallback(async () => {
    if (!userId || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch(API_ENDPOINTS.posts.dislike(postId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Utiliser directement les données du serveur
        setIsLiked(data.isLiked)
        setIsDisliked(data.isDisliked)
        setLikeCount(data.likeCount)
        setDislikeCount(data.dislikeCount)
      } else {
        console.error('Erreur lors du dislike:', response.status)
      }
    } catch (error) {
      console.error('Erreur réseau lors du dislike:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, userId, isLoading])

  return {
    isLiked,
    isDisliked,
    likeCount,
    dislikeCount,
    isLoading,
    handleLike,
    handleDislike
  }
}