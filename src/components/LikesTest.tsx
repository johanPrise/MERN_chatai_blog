import React from 'react'
import { Button } from './ui/button'
import { Heart, ThumbsDown } from 'lucide-react'
import { useLikes } from '../hooks/useLikes'
import { UserContext } from '../UserContext'

interface LikesTestProps {
  postId: string
  initialLikes?: string[]
  initialDislikes?: string[]
}

export default function LikesTest({ 
  postId, 
  initialLikes = [], 
  initialDislikes = [] 
}: LikesTestProps) {
  const { userInfo } = UserContext()
  const userId = userInfo?.id

  const {
    isLiked,
    isDisliked,
    likeCount,
    dislikeCount,
    isLoading,
    handleLike,
    handleDislike
  } = useLikes({
    postId,
    initialLikes,
    initialDislikes
  })

  if (!userId) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Connectez-vous pour tester les likes</p>
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Test du système de likes</h3>
      <div className="flex items-center gap-4">
        <Button
          variant={isLiked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          Like ({likeCount})
        </Button>
        
        <Button
          variant={isDisliked ? "destructive" : "outline"}
          size="sm"
          onClick={handleDislike}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ThumbsDown className={`h-4 w-4 ${isDisliked ? 'fill-current' : ''}`} />
          Dislike ({dislikeCount})
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>Post ID: {postId}</p>
        <p>User ID: {userId}</p>
        <p>État: {isLiked ? 'Liké' : isDisliked ? 'Disliké' : 'Neutre'}</p>
        <p>Chargement: {isLoading ? 'Oui' : 'Non'}</p>
      </div>
    </div>
  )
}