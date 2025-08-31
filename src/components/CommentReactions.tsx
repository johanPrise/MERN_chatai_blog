import React, { useState, useCallback, useEffect } from 'react'
import { Heart, ThumbsDown } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api.config'

interface CommentReactionsProps {
  commentId: string
  userId?: string
  initialLikes: string[]
  initialDislikes: string[]
}

const CommentReactions: React.FC<CommentReactionsProps> = ({
  commentId,
  userId,
  initialLikes,
  initialDislikes
}) => {
  const [likes, setLikes] = useState(initialLikes || [])
  const [dislikes, setDislikes] = useState(initialDislikes || [])
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    setLikes(initialLikes || [])
    setDislikes(initialDislikes || [])
  }, [initialLikes, initialDislikes])
  
  const isLiked = userId ? likes.includes(userId) : false
  const isDisliked = userId ? dislikes.includes(userId) : false

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
        setLikes(data.likes || [])
        setDislikes(data.dislikes || [])
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
        setLikes(data.likes || [])
        setDislikes(data.dislikes || [])
      }
    } catch (error) {
      console.error('Erreur dislike:', error)
    } finally {
      setIsLoading(false)
    }
  }, [commentId, userId, isLoading])

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleLike}
        disabled={isLoading || !userId}
        className={`flex items-center space-x-1 text-sm transition-colors ${
          isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        <span>{likes.length}</span>
      </button>

      <button
        onClick={handleDislike}
        disabled={isLoading || !userId}
        className={`flex items-center space-x-1 text-sm transition-colors ${
          isDisliked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <ThumbsDown className={`h-4 w-4 ${isDisliked ? 'fill-current' : ''}`} />
        <span>{dislikes.length}</span>
      </button>
    </div>
  )
}

export default CommentReactions