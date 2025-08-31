import { Link } from "react-router-dom"
import { formatISO9075 } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { formatDate, cn } from "../lib/utils"
import { CalendarIcon, User2, Eye, Heart, MessageCircle, Share2, BookmarkPlus, Star, ThumbsDown } from "lucide-react"
import { Post as PostType } from '../types/PostType'
import React, { useState } from "react"
import { API_ENDPOINTS } from "../config/api.config"
import { UserContext } from "../UserContext"
import { AspectRatio } from "@radix-ui/react-aspect-ratio"
import { useImageUrl } from '../hooks/useImageUrl'
import { useLikes } from '../hooks/useLikes'
import SafeImage from './SafeImage'

// Helper functions
const extractSummaryFromTiptap = (post: any): string => {
  const blocks: any[] = post?.contentBlocks || []
  if (!Array.isArray(blocks) || blocks.length === 0) return 'Aucun résumé disponible'
  
  const tiptapBlock = blocks.find(b => b.type === 'tiptap' && b.data?.doc)
  if (!tiptapBlock?.data.doc.content) return 'Aucun résumé disponible'
  
  const firstParagraph = tiptapBlock.data.doc.content.find((node: any) => 
    node.type === 'paragraph' && node.content?.length > 0
  )
  
  if (!firstParagraph) return 'Aucun résumé disponible'
  
  const text = firstParagraph.content
    .filter((node: any) => node.type === 'text')
    .map((node: any) => node.text)
    .join(' ')
  
  return text.substring(0, 150) + (text.length > 150 ? '...' : '')
}

const getCategory = (post: PostType) => {
  const categoryFromArray = post.categories?.[0] || null
  return post.category || categoryFromArray
}

const renderCategoryBadge = (category: any) => {
  if (category?._id && category.name) {
    return (
      <Link to={`/category/${category._id}`} className="no-underline">
        <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
          {category.name}
        </Badge>
      </Link>
    )
  }
  return <Badge variant="outline">Non catégorisé</Badge>
}

const FavoriteIndicator = () => (
  <div className="absolute top-2 right-2 z-10">
    <span className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-md">
      <Star className="h-3 w-3 fill-current" />
      Favori
    </span>
  </div>
)

const getBookmarkTitle = (userId: string | undefined, isFavorite: boolean): string => {
  if (!userId) return "Connectez-vous pour ajouter aux favoris"
  return isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
}

const getCommentCount = (commentsData: any): number => {
  if (Array.isArray(commentsData)) return commentsData.length
  if (commentsData.comments && Array.isArray(commentsData.comments)) return commentsData.comments.length
  return 0
}



const ActionButtons = ({ 
  showActions, 
  handleLikeClick, 
  handleDislikeClick, 
  handleBookmark, 
  handleShare,
  isLiked,
  isDisliked,
  isBookmarked,
  isFavorite,
  likeCount,
  dislikeCount,
  userId,
  likesLoading
}: {
  showActions: boolean
  handleLikeClick: (e: React.MouseEvent) => void
  handleDislikeClick: (e: React.MouseEvent) => void
  handleBookmark: (e: React.MouseEvent) => void
  handleShare: (e: React.MouseEvent) => void
  isLiked: boolean
  isDisliked: boolean
  isBookmarked: boolean
  isFavorite: boolean
  likeCount: number
  dislikeCount: number
  userId: string | undefined
  likesLoading: boolean
}) => showActions && (
  <div className="flex items-center gap-2 mt-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeClick}
      className={cn("h-8 px-2", isLiked && "text-green-500")}
      title={userId ? "J'aime" : "Connectez-vous pour aimer ce post"}
      disabled={!userId || likesLoading}
    >
      <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
      {likeCount}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDislikeClick}
      className={cn("h-8 px-2", isDisliked && "text-red-500")}
      title={userId ? "Je n'aime pas" : "Connectez-vous pour ne pas aimer ce post"}
      disabled={!userId || likesLoading}
    >
      <ThumbsDown className={cn("h-4 w-4 mr-1", isDisliked && "fill-current")} />
      {dislikeCount}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBookmark}
      className={cn("h-8 px-2", isBookmarked && "text-blue-500", isFavorite && "text-yellow-500")}
      title={getBookmarkTitle(userId, isFavorite)}
      disabled={!userId}
    >
      {isFavorite ? (
        <Star className="h-4 w-4 fill-current" />
      ) : (
        <BookmarkPlus className={cn("h-4 w-4", isBookmarked && "fill-current")} />
      )}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="h-8 px-2"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  </div>
)

const StatsDisplay = ({ showStats, stats, likeCount, dislikeCount }: {
  showStats: boolean
  stats: { views: number; comments: number }
  likeCount: number
  dislikeCount: number
}) => showStats && (
  <div className="flex items-center gap-4 text-xs text-muted-foreground">
    <span className="flex items-center gap-1">
      <Eye className="h-3 w-3" />
      {stats.views}
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
      {stats.comments}
    </span>
  </div>
)

export interface PostProps {
  post: PostType
  variant?: "default" | "enhanced-text" // Enhanced text-only design is now default
  showActions?: boolean
  showStats?: boolean
  className?: string
  onLike?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onShare?: (post: PostType) => void
  isFavorite?: boolean
  fixedHeight?: boolean
}

export default function Post({
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
  const { _id, title, summary, coverImage, author, createdAt } = post
  
  const displaySummary = React.useMemo(() => {
    return summary?.trim() || extractSummaryFromTiptap(post)
  }, [summary, post])

  const { userInfo } = UserContext()
  const userId = userInfo?.id
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // Utiliser le hook pour l'image de couverture avec fallback et support du champ legacy
  const { getImageUrl } = useImageUrl()
  const postImageWithFallback = getImageUrl(coverImage?.url || (post as any).cover)
  const postImageAlt = coverImage?.alt || title
  const onPostImageError = () => {
    // Handle image error if needed
  }

  const {
    isLiked,
    isDisliked,
    likeCount,
    dislikeCount,
    isLoading: likesLoading,
    handleLike,
    handleDislike
  } = useLikes({
    postId: _id,
    initialLikes: Array.isArray(post.likes) ? post.likes : [],
    initialDislikes: Array.isArray(post.dislikes) ? post.dislikes : []
  })

  const category = getCategory(post)

  const [stats, setStats] = React.useState({
    views: post.views || 0,
    comments: Array.isArray(post.comments) ? post.comments.length : 0
  })

  React.useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        if (!_id) return;
        const commentsResponse = await fetch(API_ENDPOINTS.comments.byPost(_id));
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          const commentCount = getCommentCount(commentsData);
          setStats(prev => ({ ...prev, comments: commentCount }));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des commentaires:', error);
      }
    };
    fetchCommentCount();
  }, [_id]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return;
    await handleLike()
    onLike?.(_id)
  }

  const handleDislikeClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return;
    await handleDislike()
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isFavorite) {
      setIsBookmarked(!isBookmarked)
    }
    onBookmark?.(_id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare?.(post)
  }

  // Enhanced text-only variant - now the default for all cards
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
      "bg-gradient-to-br from-card via-card/95 to-card/90",
      "border border-border/50 hover:border-primary/20",
      "backdrop-blur-sm w-full max-w-full",
      fixedHeight && "h-[380px]",
      className
    )}>
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/8 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/8 to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
      
      {/* Featured badge */}
      {isFavorite && (
        <div className="absolute top-4 right-4 z-20">
          <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm animate-pulse">
            <Star className="h-3.5 w-3.5 fill-current" />
            Featured
          </span>
        </div>
      )}

      <CardHeader className="p-6 pb-4 relative z-10">
        {/* Category and meta info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="transform group-hover:scale-105 transition-transform duration-300">
              {renderCategoryBadge(category)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80 font-medium">
              <CalendarIcon className="h-3 w-3" />
              <time dateTime={formatISO9075(new Date(createdAt))}>
                {formatDate(createdAt)}
              </time>
            </div>
          </div>
          
          {showStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 hover:text-primary transition-colors">
                <Eye className="h-3 w-3" />
                {stats.views || 0}
              </span>
              <span className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                <MessageCircle className="h-3 w-3" />
                {stats.comments || 0}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced title with better typography */}
        <CardTitle className="text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors duration-300">
          <Link 
            to={`/Post/${_id}`} 
            className="hover:text-primary transition-colors line-clamp-2 no-underline"
            aria-label={`Read full post: ${title}`}
          >
            {title}
          </Link>
        </CardTitle>

        {/* Enhanced author section */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 rounded-full flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
              <User2 className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{author.username}</span>
            <span className="text-xs text-muted-foreground">Author</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4 relative z-10 flex-grow">
        {/* Enhanced summary with better readability */}
        <div className="relative mb-6">
          <p className="text-muted-foreground leading-relaxed line-clamp-3 text-sm">
            {displaySummary}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent opacity-50"></div>
        </div>
        
        {/* Enhanced read more button */}
        <Link 
          to={`/Post/${_id}`} 
          className="inline-flex items-center gap-2 text-primary font-semibold text-sm px-4 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all duration-300 group/button border border-primary/20 hover:border-primary/30 no-underline"
        >
          <span>Continue reading</span>
          <svg 
            className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-2 relative z-10">
        <div className="flex items-center justify-between w-full">
          {/* Enhanced stats section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <Eye className="h-3 w-3" />
                <span className="font-medium">{stats.views || 0}</span>
              </span>
              {likeCount > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                  <Heart className="h-3 w-3" />
                  <span className="font-medium">{likeCount}</span>
                </span>
              )}
            </div>
          </div>
          
          {/* Enhanced action buttons */}
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeClick}
                className={cn(
                  "h-8 px-3 rounded-lg hover:bg-green-50 hover:text-green-600 transition-all duration-300", 
                  isLiked && "text-green-600 bg-green-50 shadow-sm"
                )}
                title={userId ? "Like this post" : "Sign in to like"}
                disabled={!userId || likesLoading}
              >
                <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                {likeCount > 0 && <span className="ml-1.5 text-xs font-medium">{likeCount}</span>}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={cn(
                  "h-8 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-300", 
                  (isBookmarked || isFavorite) && "text-blue-600 bg-blue-50 shadow-sm"
                )}
                title={getBookmarkTitle(userId, isFavorite)}
                disabled={!userId}
              >
                {isFavorite ? (
                  <Star className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <BookmarkPlus className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-300"
                title="Share this post"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export type { PostType }
export { 
  extractSummaryFromTiptap,
  getCategory,
  renderCategoryBadge,
  FavoriteIndicator,
  getBookmarkTitle,
  getCommentCount,
  ActionButtons,
  StatsDisplay
}