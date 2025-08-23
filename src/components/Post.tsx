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
import { useCoverImage, normalizeCoverImage } from '../hooks/useImageUrl'
import { useLikes } from '../hooks/useLikes'

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
      <Link to={`/category/${category._id}`}>
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

const PostImage = ({ title, alt, src, className, onError }: { 
  title: string
  alt?: string
  src: string
  className: string
  onError: () => void
}) => (
  <img
    alt={alt || title}
    src={src}
    className={className}
    loading="lazy"
    decoding="async"
    onError={onError}
  />
)

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
  
  // Utiliser le hook pour l'image de couverture avec fallback
  const { url: postImageWithFallback, alt: postImageAlt, onError: onPostImageError } = useCoverImage(
    coverImage,
    "/placeholder.svg"
  )

  console.log('Post data:', { 
    id: _id, 
    likes: post.likes, 
    dislikes: post.dislikes,
    userId 
  })

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

  if (variant === "list") {
    return (
      <Card className={cn("overflow-hidden w-full max-w-full", fixedHeight && "h-[250px]", className)}>
        <div className="flex flex-col sm:flex-row gap-4 p-4 w-full min-w-0">
          <Link to={`/Post/${_id}`} className="relative block w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg min-w-0">
            {isFavorite && <FavoriteIndicator />}
            <AspectRatio ratio={16/10} className="w-full">
              <PostImage 
                title={title}
                alt={postImageAlt}
                src={postImageWithFallback}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                onError={onPostImageError}
              />
            </AspectRatio>
          </Link>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              <time dateTime={formatISO9075(new Date(createdAt))}>
                <CalendarIcon className="h-3 w-3 inline mr-1" />
                {formatDate(createdAt)}
              </time>
              <span className="inline-flex items-center">
                <User2 className="h-3 w-3 inline mr-1" />
                {author.username}
              </span>
              <StatsDisplay 
                showStats={showStats}
                stats={stats}
                likeCount={likeCount}
                dislikeCount={dislikeCount}
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              <Link
                to={`/Post/${_id}`}
                className="hover:text-primary transition-colors line-clamp-2"
                aria-label={`Read full post: ${title}`}
              >
                {title}
              </Link>
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground mb-3 flex-grow">{displaySummary}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {renderCategoryBadge(category)}
                <Link to={`/Post/${_id}`} className="text-primary text-sm font-medium hover:underline">
                  Read more →
                </Link>
              </div>
              <ActionButtons 
                showActions={showActions}
                handleLikeClick={handleLikeClick}
                handleDislikeClick={handleDislikeClick}
                handleBookmark={handleBookmark}
                handleShare={handleShare}
                isLiked={isLiked}
                isDisliked={isDisliked}
                isBookmarked={isBookmarked}
                isFavorite={isFavorite}
                likeCount={likeCount}
                dislikeCount={dislikeCount}
                userId={userId}
                likesLoading={likesLoading}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden flex flex-col w-full max-w-full", fixedHeight && "h-[450px]", className)}>
        <Link to={`/Post/${_id}`} className="relative block overflow-hidden min-w-0">
          {isFavorite && <FavoriteIndicator />}
          <AspectRatio ratio={16/10} className="w-full">
            <PostImage 
              title={title}
              alt={postImageAlt}
              src={postImageWithFallback}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              onError={onPostImageError}
            />
          </AspectRatio>
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
            <StatsDisplay 
              showStats={showStats}
              stats={stats}
              likeCount={likeCount}
              dislikeCount={dislikeCount}
            />
          </div>
          <CardTitle className="text-lg">
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
          <p className="line-clamp-2 text-sm text-muted-foreground">{displaySummary}</p>
          <ActionButtons 
            showActions={showActions}
            handleLikeClick={handleLikeClick}
            handleDislikeClick={handleDislikeClick}
            handleBookmark={handleBookmark}
            handleShare={handleShare}
            isLiked={isLiked}
            isDisliked={isDisliked}
            isBookmarked={isBookmarked}
            isFavorite={isFavorite}
            likeCount={likeCount}
            dislikeCount={dislikeCount}
            userId={userId}
            likesLoading={likesLoading}
          />
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {renderCategoryBadge(category)}
        </CardFooter>
      </Card>
    )
  }

  if (variant === "featured") {
    return (
      <Card className={cn("overflow-hidden border-0 shadow-none bg-transparent w-full max-w-full", fixedHeight && "h-[350px]", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full min-w-0">          
          <Link to={`/Post/${_id}`} className="relative block overflow-hidden rounded-xl min-w-0">
            {isFavorite && <FavoriteIndicator />}
            <AspectRatio ratio={16/10} className="w-full">
              <PostImage 
                title={title}
                src={postImageWithFallback}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                onError={onPostImageError}
              />
            </AspectRatio>
          </Link>
          <div className="flex flex-col min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
                Featured
              </Badge>
              {category?._id && category.name && renderCategoryBadge(category)}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
              <Link
                to={`/Post/${_id}`}
                className="hover:text-primary transition-colors line-clamp-2"
                aria-label={`Read full post: ${title}`}
              >
                {title}
              </Link>
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              <time dateTime={formatISO9075(new Date(createdAt))}>
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                {formatDate(createdAt)}
              </time>
              <span className="inline-flex items-center">
                <User2 className="h-4 w-4 inline mr-1" />
                {author.username}
              </span>
              <StatsDisplay 
                showStats={showStats}
                stats={stats}
                likeCount={likeCount}
                dislikeCount={dislikeCount}
              />
            </div>
            <p className="text-muted-foreground mb-4 line-clamp-3">{displaySummary}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Link to={`/Post/${_id}`} className="text-primary font-medium hover:underline">
                Read more →
              </Link>
              <ActionButtons 
                showActions={showActions}
                handleLikeClick={handleLikeClick}
                handleDislikeClick={handleDislikeClick}
                handleBookmark={handleBookmark}
                handleShare={handleShare}
                isLiked={isLiked}
                isDisliked={isDisliked}
                isBookmarked={isBookmarked}
                isFavorite={isFavorite}
                likeCount={likeCount}
                dislikeCount={dislikeCount}
                userId={userId}
                likesLoading={likesLoading}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden flex flex-col group relative w-full max-w-full", fixedHeight && "h-[450px]", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
      
      <Link to={`/Post/${_id}`} className="relative block overflow-hidden min-w-0">
        {isFavorite && (
          <div className="absolute top-2 right-2 z-20">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current" />
              Favori
            </span>
          </div>
        )}
        <div className="relative overflow-hidden">
          <PostImage 
            title={title}
            alt={postImageAlt}
            src={postImageWithFallback}
            className="h-56 w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            onError={onPostImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
          <StatsDisplay 
            showStats={showStats}
            stats={stats}
            likeCount={likeCount}
            dislikeCount={dislikeCount}
          />
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
        <p className="line-clamp-3 text-muted-foreground mb-3">{displaySummary}</p>
        <ActionButtons 
          showActions={showActions}
          handleLikeClick={handleLikeClick}
          handleDislikeClick={handleDislikeClick}
          handleBookmark={handleBookmark}
          handleShare={handleShare}
          isLiked={isLiked}
          isDisliked={isDisliked}
          isBookmarked={isBookmarked}
          isFavorite={isFavorite}
          likeCount={likeCount}
          dislikeCount={dislikeCount}
          userId={userId}
          likesLoading={likesLoading}
        />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {renderCategoryBadge(category)}
        <Link to={`/Post/${_id}`} className="text-primary text-sm font-medium hover:underline">
          Read more →
        </Link>
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
  PostImage,
  ActionButtons,
  StatsDisplay
}