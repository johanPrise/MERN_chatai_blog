import { Link } from "react-router-dom"
import { formatISO9075 } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { formatDate, getOptimizedImageUrl, cn } from "../lib/utils"
import { getImageUrl } from "../config/api.config"
import { CalendarIcon, User2, Eye, Heart, MessageCircle, Share2, BookmarkPlus, ExternalLink, Star, ThumbsDown } from "lucide-react"
import { Post as PostType } from '../types/PostType'
import React, { useState, useEffect } from "react"
import { API_ENDPOINTS } from "../config/api.config"
import { AspectRatio } from "@radix-ui/react-aspect-ratio"
import { useImageUrl, useImageWithFallback } from '../hooks/useImageUrl'

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
  const { _id, title, summary, cover, author, createdAt } = post
  // Récupérer l'ID de l'utilisateur actuel depuis localStorage
  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
  const userId = userInfo?.id

  // Initialiser l'état de like et dislike en fonction des données du post
  const [isLiked, setIsLiked] = useState(userId && Array.isArray(post.likes) ? post.likes.includes(userId) : false)
  const [isDisliked, setIsDisliked] = useState(userId && Array.isArray(post.dislikes) ? post.dislikes.includes(userId) : false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // Utilisation du hook pour l'image principale du post
  const postImageUrl = useImageUrl(cover)
  
  // Utilisation du hook avec fallback pour l'image du post
  const { url: postImageWithFallback, onError: onPostImageError } = useImageWithFallback(
    cover,
    "/placeholder.svg"
  )

  // Synchroniser l'état avec les données du post quand elles changent
  React.useEffect(() => {
    if (userId) {
      setIsLiked(Array.isArray(post.likes) ? post.likes.includes(userId) : false)
      setIsDisliked(Array.isArray(post.dislikes) ? post.dislikes.includes(userId) : false)
    }
  }, [post.likes, post.dislikes, userId])

  // Utiliser la catégorie principale ou la première catégorie du tableau si disponible
  const categoryFromArray = post.categories && Array.isArray(post.categories) && post.categories.length > 0 
    ? post.categories[0] 
    : null
  const category = post.category || categoryFromArray

  // État local pour gérer les statistiques mises à jour
  const [stats, setStats] = React.useState({
    views: post.views || 0,
    likes: Array.isArray(post.likes) ? post.likes.length : 0,
    dislikes: Array.isArray(post.dislikes) ? post.dislikes.length : 0,
    comments: Array.isArray(post.comments) ? post.comments.length : 0
  })

  // Utilisez les données réelles du post - récupération des statistiques
  // Note: Les statistiques sont récupérées directement depuis les données fournies par l'API
  // - views: À implémenter - actuellement non disponible dans l'API
  // - likes: Dénombrement du tableau post.likes fourni par l'API
  // - comments: Récupération du nombre de commentaires depuis l'API
  // Initialisation de l'état pour les statistiques

  // Mettre à jour les statistiques avec des appels API pour obtenir les valeurs réelles
  React.useEffect(() => {
    // Fonction pour récupérer le nombre de commentaires
    const fetchCommentCount = async () => {
      try {
        if (!_id) return;

        // Utiliser l'endpoint de l'API pour récupérer les commentaires du post
        const commentsResponse = await fetch(API_ENDPOINTS.comments.byPost(_id));
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();

          // Mettre à jour le nombre de commentaires
          const commentCount = Array.isArray(commentsData) 
            ? commentsData.length 
            : (commentsData.comments && Array.isArray(commentsData.comments)) 
              ? commentsData.comments.length 
              : 0;

          setStats(prev => ({ ...prev, comments: commentCount }));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des commentaires:', error);
      }
    };

    // Appeler les fonctions de récupération des statistiques
    fetchCommentCount();
  }, [_id]);

  // L'état local pour gérer les statistiques est déclaré plus haut dans le composant

  // Handle actions
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Si l'utilisateur n'est pas connecté, afficher un message
      if (!userId) {
        console.warn('Utilisateur non connecté - like impossible');
        // On pourrait ajouter ici un toast ou une notification
        // pour informer l'utilisateur qu'il doit se connecter
        return;
      }

      // Optimistic UI update - Mettre à jour l'interface avant la réponse du serveur
      const wasLiked = isLiked;
      const wasDisliked = isDisliked;

      // Mise à jour optimiste des états
      setIsLiked(!wasLiked);
      if (wasDisliked) setIsDisliked(false);

      // Calcul optimiste des nouveaux compteurs
      const optimisticLikes = wasLiked 
        ? Math.max(0, stats.likes - 1) 
        : stats.likes + 1;
      const optimisticDislikes = wasDisliked 
        ? Math.max(0, stats.dislikes - 1) 
        : stats.dislikes;

      // Mise à jour optimiste des statistiques
      setStats(prev => ({
        ...prev,
        likes: optimisticLikes,
        dislikes: optimisticDislikes
      }));

      // Appeler l'API de like
      const response = await fetch(API_ENDPOINTS.posts.like(_id), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        // Mise à jour avec les valeurs réelles du serveur
        setIsLiked(Array.isArray(data.likes) ? data.likes.includes(userId) : false);
        setIsDisliked(Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : false);

        // Mettre à jour le nombre de likes et dislikes avec les données du serveur
        setStats(prev => ({
          ...prev,
          likes: Array.isArray(data.likes) ? data.likes.length : 0,
          dislikes: Array.isArray(data.dislikes) ? data.dislikes.length : 0
        }));
      } else {
        // Récupérer le message d'erreur
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));

        // Si l'erreur est "Vous avez déjà liké cet article", on garde l'état "liké"
        if (errorData.message === "Vous avez déjà liké cet article" || errorData.message === "You have already liked this post") {
          // Garder l'état liké et s'assurer que les stats reflètent cet état
          setIsLiked(true);
          setIsDisliked(false);
          // Recalculer les stats pour s'assurer qu'elles sont cohérentes
          setStats(prev => ({
            ...prev,
            likes: wasLiked ? prev.likes : prev.likes, // Si déjà liké, garder le count
            dislikes: wasDisliked ? Math.max(0, prev.dislikes - 1) : prev.dislikes
          }));
          // Ne pas afficher d'erreur pour ce cas, c'est normal
          return;
        } else {
          // Pour les autres erreurs, on revient à l'état précédent
          setIsLiked(wasLiked);
          setIsDisliked(wasDisliked);
          setStats(prev => ({
            ...prev,
            likes: wasLiked ? prev.likes : Math.max(0, prev.likes - 1),
            dislikes: wasDisliked ? prev.dislikes : Math.max(0, prev.dislikes - 1)
          }));
          console.error('Erreur API lors du like:', response.status, errorData.message);
        }
      }

      // Appeler le callback passé en props si disponible
      onLike?.(_id);
    } catch (error) {
      console.error('Erreur lors du like:', error);
      // Revenir à l'état précédent en cas d'erreur réseau
      setIsLiked(userId && Array.isArray(post.likes) ? post.likes.includes(userId) : false);
      setIsDisliked(userId && Array.isArray(post.dislikes) ? post.dislikes.includes(userId) : false);
      setStats(prev => ({
        ...prev,
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        dislikes: Array.isArray(post.dislikes) ? post.dislikes.length : 0
      }));
    }
  }

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Si l'utilisateur n'est pas connecté, afficher un message
      if (!userId) {
        console.warn('Utilisateur non connecté - dislike impossible');
        // On pourrait ajouter ici un toast ou une notification
        // pour informer l'utilisateur qu'il doit se connecter
        return;
      }

      // Optimistic UI update - Mettre à jour l'interface avant la réponse du serveur
      const wasLiked = isLiked;
      const wasDisliked = isDisliked;

      // Mise à jour optimiste des états
      setIsDisliked(!wasDisliked);
      if (wasLiked) setIsLiked(false);

      // Calcul optimiste des nouveaux compteurs
      const optimisticLikes = wasLiked 
        ? Math.max(0, stats.likes - 1) 
        : stats.likes;
      const optimisticDislikes = wasDisliked 
        ? Math.max(0, stats.dislikes - 1) 
        : stats.dislikes + 1;

      // Mise à jour optimiste des statistiques
      setStats(prev => ({
        ...prev,
        likes: optimisticLikes,
        dislikes: optimisticDislikes
      }));

      // Appeler l'API de dislike
      const response = await fetch(API_ENDPOINTS.posts.dislike(_id), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        // Mise à jour avec les valeurs réelles du serveur
        setIsLiked(Array.isArray(data.likes) ? data.likes.includes(userId) : false);
        setIsDisliked(Array.isArray(data.dislikes) ? data.dislikes.includes(userId) : false);

        // Mettre à jour le nombre de likes et dislikes avec les données du serveur
        setStats(prev => ({
          ...prev,
          likes: Array.isArray(data.likes) ? data.likes.length : 0,
          dislikes: Array.isArray(data.dislikes) ? data.dislikes.length : 0
        }));
      } else {
        // Récupérer le message d'erreur
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));

        // Si l'erreur est "Vous avez déjà disliké cet article", on garde l'état "disliké"
        if (errorData.message === "Vous avez déjà disliké cet article" || errorData.message === "You have already disliked this post") {
          // Garder l'état disliké et s'assurer que les stats reflètent cet état
          setIsDisliked(true);
          setIsLiked(false);
          // Recalculer les stats pour s'assurer qu'elles sont cohérentes
          setStats(prev => ({
            ...prev,
            likes: wasLiked ? Math.max(0, prev.likes - 1) : prev.likes,
            dislikes: wasDisliked ? prev.dislikes : prev.dislikes // Si déjà disliké, garder le count
          }));
          // Ne pas afficher d'erreur pour ce cas, c'est normal
          return;
        } else {
          // Pour les autres erreurs, on revient à l'état précédent
          setIsLiked(wasLiked);
          setIsDisliked(wasDisliked);
          setStats(prev => ({
            ...prev,
            likes: wasLiked ? prev.likes : Math.max(0, prev.likes - 1),
            dislikes: wasDisliked ? prev.dislikes : Math.max(0, prev.dislikes - 1)
          }));
          console.error('Erreur API lors du dislike:', response.status, errorData.message);
        }
      }
    } catch (error) {
      console.error('Erreur lors du dislike:', error);
      // Revenir à l'état précédent en cas d'erreur réseau
      setIsLiked(userId && Array.isArray(post.likes) ? post.likes.includes(userId) : false);
      setIsDisliked(userId && Array.isArray(post.dislikes) ? post.dislikes.includes(userId) : false);
      setStats(prev => ({
        ...prev,
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        dislikes: Array.isArray(post.dislikes) ? post.dislikes.length : 0
      }));
    }
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Si déjà en favori, on utilise cette action pour retirer des favoris
    // sinon on met à jour le statut de bookmark normal
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

  // Image component with error handling using the hook
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

  // Action buttons component
  const ActionButtons = () => showActions && (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={cn("h-8 px-2", isLiked && "text-green-500")}
        title={userId ? "J'aime" : "Connectez-vous pour aimer ce post"}
        disabled={!userId}
      >
        <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
        {stats.likes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDislike}
        className={cn("h-8 px-2", isDisliked && "text-red-500")}
        title={userId ? "Je n'aime pas" : "Connectez-vous pour ne pas aimer ce post"}
        disabled={!userId}
      >
        <ThumbsDown className={cn("h-4 w-4 mr-1", isDisliked && "fill-current")} />
        {stats.dislikes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBookmark}
        className={cn("h-8 px-2", isBookmarked && "text-blue-500", isFavorite && "text-yellow-500")}
        title={!userId ? "Connectez-vous pour ajouter aux favoris" : (isFavorite ? "Retirer des favoris" : "Ajouter aux favoris")}
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

  // Stats component
  const StatsDisplay = () => showStats && (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {stats.views}
      </span>
      <span className="flex items-center gap-1 text-green-500">
        <Heart className="h-3 w-3" />
        {stats.likes}
      </span>
      <span className="flex items-center gap-1 text-red-500">
        <ThumbsDown className="h-3 w-3" />
        {stats.dislikes}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {stats.comments}
      </span>
    </div>
  )

  // List variant - horizontal layout
  if (variant === "list") {
    return (
      <Card className={cn("overflow-hidden w-full max-w-full", fixedHeight && "h-[250px]", className)}>
        <div className="flex flex-col sm:flex-row gap-4 p-4 w-full min-w-0">
          <Link to={`/Post/${_id}`} className="relative block w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg min-w-0">
            {isFavorite && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-md">
                  <Star className="h-3 w-3 fill-current" />
                  Favori
                </span>
              </div>
            )}
            <AspectRatio ratio={16/10} className="w-full">
              <PostImage className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
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
              <StatsDisplay />
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
            <p className="line-clamp-2 text-sm text-muted-foreground mb-3 flex-grow">{summary}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
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
              </div>
              <ActionButtons />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Card className={cn("overflow-hidden flex flex-col w-full max-w-full", fixedHeight && "h-[450px]", className)}>
        <Link to={`/Post/${_id}`} className="relative block overflow-hidden min-w-0">
          {isFavorite && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-md">
                <Star className="h-3 w-3 fill-current" />
                Favori
              </span>
            </div>
          )}
          <AspectRatio ratio={16/10} className="w-full">
            <PostImage className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
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
            <StatsDisplay />
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
          <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
          <ActionButtons />
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {category && typeof category === 'object' && category._id && category.name ? (
            <Link to={`/category/${category._id}`}>
              <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
                {category.name}
              </Badge>
            </Link>
          ) : (
            <Badge variant="outline">Non catégorisé</Badge>
          )}
        </CardFooter>
      </Card>
    )
  }

  // Featured variant
  if (variant === "featured") {
    return (
      <Card className={cn("overflow-hidden border-0 shadow-none bg-transparent w-full max-w-full", fixedHeight && "h-[350px]", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full min-w-0">          
          <Link to={`/Post/${_id}`} className="relative block overflow-hidden rounded-xl min-w-0">
            {isFavorite && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-md">
                  <Star className="h-3 w-3 fill-current" />
                  Favori
                </span>
              </div>
            )}
            <AspectRatio ratio={16/10} className="w-full">
              <PostImage className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
            </AspectRatio>
          </Link>
          <div className="flex flex-col min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
                Featured
              </Badge>
              {category && typeof category === 'object' && category._id && category.name && (
                <Link to={`/category/${category._id}`}>
                  <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
                    {category.name}
                  </Badge>
                </Link>
              )}
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
              <StatsDisplay />
            </div>
            <p className="text-muted-foreground mb-4 line-clamp-3">{summary}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Link to={`/Post/${_id}`} className="text-primary font-medium hover:underline">
                Read more →
              </Link>
              <ActionButtons />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn("overflow-hidden flex flex-col group relative w-full max-w-full", fixedHeight && "h-[450px]", className)}>
      {/* Gradient overlay for enhanced visual appeal */}
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
          <PostImage className="h-56 w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" />
          {/* Image overlay gradient */}
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
