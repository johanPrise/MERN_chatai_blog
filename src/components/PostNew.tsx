import { Link } from "react-router-dom"
import { formatISO9075 } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { formatDate, cn } from "../lib/utils"
import { CalendarIcon, User2, Eye, Heart, MessageCircle, ThumbsDown } from "lucide-react"
import { Post as PostType } from '../types/PostType'
import React, { useState, useEffect } from "react"
import { API_ENDPOINTS } from "../config/api.config"
import { UserContext } from "../UserContext"
import { AspectRatio } from "@radix-ui/react-aspect-ratio"
import { useImageWithFallback } from '../hooks/useImageUrl'

export interface PostProps {
  post: PostType
  variant?: "default" | "featured" | "compact" | "list"
  showActions?: boolean
  showStats?: boolean
  className?: string
  onLike?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onShare?: (post: PostType) => void
  isFavorite?: boolean
  fixedHeight?: boolean
}

export default function PostNew({
  post,
  variant = "default",
  showActions = false,
  showStats = false,
  className = "",
  onLike,
  onBookmark,
  onShare,
  isFavorite = false,
  fixedHeight = true
}: PostProps) {
  const { _id, title, summary, cover, author, createdAt } = post
  const { userInfo } = UserContext()
  const userId = userInfo?.id

  // États locaux pour les interactions
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Hook pour l'image avec fallback
  const { url: postImageWithFallback, onError: onPostImageError } = useImageWithFallback(
    cover,
    "/placeholder.svg"
  )

  // Initialiser les états à partir des données du post
  useEffect(() => {
    if (userId && Array.isArray(post.likes)) {
      setIsLiked(post.likes.includes(userId))
      setLikeCount(post.likes.length)
    } else {
      setLikeCount(Array.isArray(post.likes) ? post.likes.length : 0)
    }

    if (userId && Array.isArray(post.dislikes)) {
      setIsDisliked(post.dislikes.includes(userId))
      setDislikeCount(post.dislikes.length)
    } else {
      setDislikeCount(Array.isArray(post.dislikes) ? post.dislikes.length : 0)
    }
  }, [post.likes, post.dislikes, userId])

  // Fonction pour gérer le like
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.posts.like(_id), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour les états avec les données du serveur
        setIsLiked(data.isLiked)
        setIsDisliked(data.isDisliked)
        setLikeCount(data.likeCount)
        setDislikeCount(data.dislikeCount)
        
        onLike?.(_id)
      } else {
        console.error('Erreur lors du like:', response.status)
      }
    } catch (error) {
      console.error('Erreur réseau lors du like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour gérer le dislike
  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.posts.dislike(_id), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour les états avec les données du serveur
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
  }

  // Utiliser la catégorie principale
  const category = post.category || (post.categories && post.categories[0])

  // Composant image
  const PostImage = ({ className: imgClassName }: { className: string }) => (
    <img
      alt={title}
      src={postImageWithFallback}
      className={imgClassName}
      loading="lazy"
      decoding="async"
      onError={onPostImageError}
    />
  )

  // Boutons d'action
  const ActionButtons = () => showActions && (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={cn("h-8 px-2", isLiked && "text-green-500")}
        title={userId ? "J'aime" : "Connectez-vous pour aimer ce post"}
        disabled={!userId || isLoading}
      >
        <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
        {likeCount}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDislike}
        className={cn("h-8 px-2", isDisliked && "text-red-500")}
        title={userId ? "Je n'aime pas" : "Connectez-vous pour ne pas aimer ce post"}
        disabled={!userId || isLoading}
      >
        <ThumbsDown className={cn("h-4 w-4 mr-1", isDisliked && "fill-current")} />
        {dislikeCount}
      </Button>
    </div>
  )

  // Affichage des statistiques
  const StatsDisplay = () => showStats && (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {post.views || 0}
      </span>
      <span className="flex items-center gap-1 text-green-500">
        <Heart className="h-3 w-3" />
        {likeCount}
      </span>
      <span className="flex items-center gap-1 text-red-500">
        <ThumbsDown className="h-3 w-3" />
        {dislikeCount}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {post.comments?.length || 0}
      </span>
    </div>
  )

  // Variante par défaut
  return (
    <Card className={cn("overflow-hidden flex flex-col group relative w-full max-w-full", fixedHeight && "h-[450px]", className)}>
      <Link to={`/Post/${_id}`} className="relative block overflow-hidden min-w-0">
        <div className="relative overflow-hidden">
          <PostImage className="h-56 w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" />
        </div>
      </Link>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <time dateTime={formatISO9075(new Date(createdAt))}>
            <CalendarIcon className="h-3 w-3 inline mr-1" />
            {formatDate(createdAt)}
          </time>
          <span className="inline-flex items-center">
            <User2 className="h-3 w-3 inline mr-1" />
            {author.username}
          </span>
          <StatsDisplay />
        </div>
        <CardTitle className="text-xl">
          <Link
            to={`/Post/${_id}`}
            className="hover:text-primary transition-colors"
            aria-label={`Read full post: ${title}`}
          >
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="line-clamp-3 text-muted-foreground mb-3">{summary}</p>
        <ActionButtons />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {category && typeof category === 'object' && category._id && category.name ? (
          <Link to={`/category/${category._id}`}>
            <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
              {category.name}
            </Badge>
          </Link>
        ) : (
          <Badge variant="outline">Non catégorisé</Badge>
        )}
        <Link to={`/Post/${_id}`} className="text-primary text-sm font-medium hover:underline">
          Read more →
        </Link>
      </CardFooter>
    </Card>
  )
}

export type { PostType }