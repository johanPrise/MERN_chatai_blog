"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { UserContext } from "../UserContext"
import ConfirmationModal from "../components/ConfirmationModal"
import { Container } from "../components/ui/container"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { H1, H2, P } from "../components/ui/typography"
import { formatDate } from "../lib/utils"
import { getImageUrl } from "../config/api.config"
import { formatContent } from "../lib/formatContent"
import SafeImage from "../components/SafeImage"
import { detectDarkMode, setupThemeListener } from "../lib/themeDetector"
import { useSimpleContentFilter } from "../hooks/useContentFilter"
import {
  CalendarIcon, User2, MessageCircle, Edit, Trash2,
  Reply, Heart, ThumbsDown, AlertCircle, CheckCircle
} from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"
import { ActionStatus } from "../types/Action"
import { Post, Comment } from "../types/PostType"
import "../css/markdown.css"
import "../css/theme-overrides.css"
// Import highlight.js for syntax highlighting
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// Helper to extract the category name safely
const getCategoryName = (post: Post | null): string => {
  if (!post) return "Non catégorisé"

  // Vérifier si post.category est défini et a une propriété name
  if (post.category && typeof post.category === 'object' && 'name' in post.category && post.category.name) {
    return post.category.name;
  }

  // Vérifier si post.categories existe et contient des éléments
  // @ts-ignore - Ignorer l'erreur TypeScript car categories n'est pas toujours dans le type
  if (post.categories && Array.isArray(post.categories) && post.categories.length > 0) {
    // Vérifier que le premier élément a une propriété name
    // @ts-ignore
    const firstCategory = post.categories[0];
    if (typeof firstCategory === 'object' && firstCategory && 'name' in firstCategory) {
      return firstCategory.name;
    }
    // Si c'est une chaîne de caractères, la retourner directement
    // @ts-ignore
    if (typeof firstCategory === 'string') {
      return firstCategory;
    }
  }

  return "Non catégorisé";
}

// Action states
interface ActionState {
  status: ActionStatus
  error: string | null
}

interface CommentActionStates {
  [commentId: string]: ActionState
}

// État d'interaction avec les articles
interface PostInteractionState {
  isLoading: boolean
  error: string | null
  success: string | null
}

// Import API configuration
import { API_BASE_URL, API_ENDPOINTS } from "../config/api.config"

/**
 * Vérifie si un utilisateur a aimé un élément
 * @param likes - Tableau des IDs des utilisateurs qui ont aimé l'élément
 * @param userId - ID de l'utilisateur à vérifier
 * @returns true si l'utilisateur a aimé l'élément, false sinon
 */
const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
  if (!userId) return false;
  if (!likes) return false;
  if (!Array.isArray(likes)) return false;
  return likes.includes(userId);
}

const PostPage = () => {
  // State for theme detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Post and comments state
  const [postInfo, setPostInfo] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])

  // Comment form state
  const [newComment, setNewComment] = useState("")
  const [replyContent, setReplyContent] = useState("") // Nouvel état pour les réponses
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")

  // Post interaction state
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userDisliked, setUserDisliked] = useState(false)
  const [postInteraction, setPostInteraction] = useState<PostInteractionState>({
    isLoading: false,
    error: null,
    success: null
  })

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentActionStates, setCommentActionStates] = useState<CommentActionStates>({})

  // Content filtering
  const { filterContent, testContent } = useSimpleContentFilter()
  const [commentWarnings, setCommentWarnings] = useState<string[]>([])
  const [replyWarnings, setReplyWarnings] = useState<string[]>([])

  // Check content for inappropriate words
  const checkCommentContent = useCallback((content: string) => {
    const testResult = testContent(content)
    setCommentWarnings(testResult.flaggedWords)
  }, [testContent])

  const checkReplyContent = useCallback((content: string) => {
    const testResult = testContent(content)
    setReplyWarnings(testResult.flaggedWords)
  }, [testContent])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Confirmation modal state
  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false)
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => {})

  // Context and params
  const { userInfo } = UserContext()
  const { id } = useParams<{ id: string }>()

  /**
   * Fetch comments for the current post
   */
  const fetchComments = useCallback(async () => {
    if (!id) return

    try {
      setErrorMessage(null)
      console.log('Fetching comments for post:', id)
      const response = await fetch(API_ENDPOINTS.comments.byPost(id))

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Comments API response:', responseData)

      // Vérifier si la réponse contient un tableau de commentaires ou un objet avec une propriété comments
      let fetchedComments: Comment[] = 
        Array.isArray(responseData) ? responseData : 
        (responseData.comments && Array.isArray(responseData.comments)) ? responseData.comments : []

      // Créer un Set pour suivre les IDs de commentaires déjà vus
      const seenCommentIds = new Set<string>()

      // Filtrer les commentaires pour supprimer les doublons
      fetchedComments = fetchedComments.filter(comment => {
        if (!comment._id) return true // Garder les commentaires sans ID

        // Si on a déjà vu cet ID, on supprime le doublon
        if (seenCommentIds.has(comment._id)) {
          return false
        }

        // Sinon, on l'ajoute au set et on garde le commentaire
        seenCommentIds.add(comment._id)
        return true
      })

      // S'assurer que tous les commentaires ont les champs nécessaires
      const commentsWithDefaults = fetchedComments.map(comment => ({
        ...comment,
        likes: Array.isArray(comment.likes) ? comment.likes : [],
        dislikes: Array.isArray(comment.dislikes) ? comment.dislikes : [],
        replies: Array.isArray(comment.replies) ? comment.replies.map(reply => ({
          ...reply,
          likes: Array.isArray(reply.likes) ? reply.likes : [],
          dislikes: Array.isArray(reply.dislikes) ? reply.dislikes : []
        })) : []
      }))

      console.log('Processed comments (after deduplication and defaults):', commentsWithDefaults)
      setComments(commentsWithDefaults)
    } catch (error) {
      console.error("Error fetching comments:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch comments")
    }
  }, [id])

  // Les fonctions de formatage de contenu et de détection de thème
  // ont été déplacées vers les helpers src/lib/formatContent.ts et src/lib/themeDetector.ts

  /**
   * Update comment action state
   * @param commentId - ID of the comment
   * @param status - New status
   * @param error - Error message (if any)
   */
  const updateCommentActionState = (commentId: string, status: ActionStatus, error: string | null = null) => {
    setCommentActionStates(prev => ({
      ...prev,
      [commentId]: { status, error }
    }))
  }

  /**
   * Like a comment
   * @param commentId - ID of the comment to like
   */
  const handleLikeComment = async (commentId: string) => {
    if (!userInfo) {
      setErrorMessage("Vous devez être connecté pour aimer un commentaire")
      return
    }

    // Prevent multiple submissions
    if (commentActionStates[commentId]?.status === "loading") return

    updateCommentActionState(commentId, "loading")

    // Store original comment state for rollback
    const originalComment = comments.find(c => c._id === commentId)
    if (!originalComment) {
      updateCommentActionState(commentId, "error", "Comment not found")
      return
    }

    const originalLikes = Array.isArray(originalComment.likes) ? [...originalComment.likes] : []
    const originalDislikes = Array.isArray(originalComment.dislikes) ? [...originalComment.dislikes] : []

    // Optimistic update
    const userHasLiked = originalLikes.includes(userInfo.id)
    const userHasDisliked = originalDislikes.includes(userInfo.id)
    
    const optimisticLikes = userHasLiked 
      ? originalLikes.filter(id => id !== userInfo.id)
      : [...originalLikes, userInfo.id]
    
    const optimisticDislikes = userHasDisliked 
      ? originalDislikes.filter(id => id !== userInfo.id)
      : originalDislikes.filter(id => id !== userInfo.id) // Remove dislike when liking

    // Apply optimistic update
    setComments(prevComments =>
      prevComments.map(comment =>
        comment._id === commentId
          ? { ...comment, likes: optimisticLikes, dislikes: optimisticDislikes }
          : comment
      )
    )

    try {
      const response = await fetch(`${API_ENDPOINTS.comments.like(commentId)}`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        // Update with server data to ensure consistency
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? {
                  ...comment,
                  likes: Array.isArray(data.likes) ? data.likes : [],
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : []
                }
              : comment
          )
        )
        updateCommentActionState(commentId, "success")
        setSuccessMessage("Commentaire aimé avec succès")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        // Rollback on API error
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? { ...comment, likes: originalLikes, dislikes: originalDislikes }
              : comment
          )
        )
        const errorMessage = data.message || "Erreur lors de l'action d'aimer le commentaire"
        updateCommentActionState(commentId, "error", errorMessage)
        setErrorMessage(errorMessage)
        console.warn("Erreur lors du like du commentaire:", data.message)
      }
    } catch (error) {
      // Rollback on network error
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? { ...comment, likes: originalLikes, dislikes: originalDislikes }
            : comment
        )
      )
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action d'aimer le commentaire"
      updateCommentActionState(commentId, "error", errorMessage)
      setErrorMessage(errorMessage)
      console.error("Erreur lors de l'action d'aimer le commentaire:", error)
    }
  }

  /**
   * Dislike a comment
   * @param commentId - ID of the comment to dislike
   */
  const handleDislikeComment = async (commentId: string) => {
    if (!userInfo) {
      setErrorMessage("Vous devez être connecté pour ne pas aimer un commentaire")
      return
    }

    // Prevent multiple submissions
    if (commentActionStates[commentId]?.status === "loading") return

    updateCommentActionState(commentId, "loading")

    // Store original comment state for rollback
    const originalComment = comments.find(c => c._id === commentId)
    if (!originalComment) {
      updateCommentActionState(commentId, "error", "Comment not found")
      return
    }

    const originalLikes = Array.isArray(originalComment.likes) ? [...originalComment.likes] : []
    const originalDislikes = Array.isArray(originalComment.dislikes) ? [...originalComment.dislikes] : []

    // Optimistic update
    const userHasLiked = originalLikes.includes(userInfo.id)
    const userHasDisliked = originalDislikes.includes(userInfo.id)
    
    const optimisticLikes = userHasLiked 
      ? originalLikes.filter(id => id !== userInfo.id) // Remove like when disliking
      : originalLikes.filter(id => id !== userInfo.id)
    
    const optimisticDislikes = userHasDisliked 
      ? originalDislikes.filter(id => id !== userInfo.id)
      : [...originalDislikes, userInfo.id]

    // Apply optimistic update
    setComments(prevComments =>
      prevComments.map(comment =>
        comment._id === commentId
          ? { ...comment, likes: optimisticLikes, dislikes: optimisticDislikes }
          : comment
      )
    )

    try {
      const response = await fetch(`${API_ENDPOINTS.comments.dislike(commentId)}`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        // Update with server data to ensure consistency
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? {
                  ...comment,
                  likes: Array.isArray(data.likes) ? data.likes : [],
                  dislikes: Array.isArray(data.dislikes) ? data.dislikes : []
                }
              : comment
          )
        )
        updateCommentActionState(commentId, "success")
        setSuccessMessage("Commentaire disliké avec succès")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        // Rollback on API error
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? { ...comment, likes: originalLikes, dislikes: originalDislikes }
              : comment
          )
        )
        const errorMessage = data.message || "Erreur lors de l'action de ne pas aimer le commentaire"
        updateCommentActionState(commentId, "error", errorMessage)
        setErrorMessage(errorMessage)
        console.warn("Erreur lors du dislike du commentaire:", data.message)
      }
    } catch (error) {
      // Rollback on network error
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? { ...comment, likes: originalLikes, dislikes: originalDislikes }
            : comment
        )
      )
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action de ne pas aimer le commentaire"
      updateCommentActionState(commentId, "error", errorMessage)
      setErrorMessage(errorMessage)
      console.error("Erreur lors de l'action de ne pas aimer le commentaire:", error)
    }
  }

  /**
   * Set a comment for editing
   * @param commentId - ID of the comment to edit
   */
  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => c._id === commentId)
    setEditingComment(commentId)
    setEditedContent(comment ? comment.content : "")
  }

  /**
   * Update a comment
   * @param commentId - ID of the comment to update
   */
  const handleUpdateComment = async (commentId: string) => {
    updateCommentActionState(commentId, "loading")

    try {
      const response = await fetch(`${API_ENDPOINTS.comments.update(commentId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editedContent }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to update comment: ${response.status}`)
      }

      await fetchComments()
      setEditingComment(null)
      updateCommentActionState(commentId, "success")
      setSuccessMessage("Comment updated successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error updating comment:", error)
      updateCommentActionState(commentId, "error", error instanceof Error ? error.message : "Failed to update comment")
      setErrorMessage(error instanceof Error ? error.message : "Failed to update comment")
    }
  }

  /**
   * Delete a comment
   * @param commentId - ID of the comment to delete
   */
  const handleDeleteComment = async (commentId: string) => {
    // Use the confirmation modal instead of window.confirm
    setConfirmModalIsOpen(true)
    setConfirmModalOnConfirm(() => async () => {
      updateCommentActionState(commentId, "loading")

      try {
        // Fix the incorrect URL
        const response = await fetch(`${API_ENDPOINTS.comments.delete(commentId)}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete comment: ${response.status}`)
        }

        await fetchComments()
        updateCommentActionState(commentId, "success")
        setSuccessMessage("Comment deleted successfully")

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        console.error("Error deleting comment:", error)
        updateCommentActionState(commentId, "error", error instanceof Error ? error.message : "Failed to delete comment")
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete comment")
      } finally {
        setConfirmModalIsOpen(false)
      }
    })
  }

  /**
   * Sanitize comment payload to avoid circular structures and ensure proper schema
   * @param content - Comment content
   * @param postId - ID of the post
   * @param parentId - ID of the parent comment (if replying)
   * @returns Sanitized payload object
   */
  function sanitizeCommentPayload(
    content: string,
    postId: string,
    parentId: string | null = null
  ) {
    // Just string or undefined/null for parent; nothing else!
    const sanitized: { content: string, post: string, parent?: string } = {
      content,
      post: postId
    }
    if (typeof parentId === "string" && parentId.trim().length > 0) {
      sanitized.parent = parentId
    }
    return sanitized
  }

  /**
   * Reply to a comment
   * @param parentId - ID of the parent comment
   * @param content - Content of the reply
   */
  const handleReply = async (parentId: string) => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to reply")
      return
    }

    if (!replyContent.trim()) {
      setErrorMessage("Reply cannot be empty")
      return
    }

    // Éviter les soumissions multiples
    if (isSubmittingComment) {
      return
    }

    updateCommentActionState(parentId, "loading")
    setIsSubmittingComment(true)

    try {
      // Apply content filtering before submission
      const filterResult = filterContent(replyContent)
      
      // Show notification if content was filtered
      if (filterResult.wasFiltered) {
        console.log('Reply content was filtered:', filterResult.replacements)
        setSuccessMessage("Your reply has been filtered for inappropriate content")
        setTimeout(() => setSuccessMessage(null), 5000)
      }

      const payload = sanitizeCommentPayload(filterResult.filteredContent, id || "", parentId)
      console.log("[handleReply] Payload:", payload)

      // Defensive check - ensure payload can be serialized
      JSON.stringify(payload)

      const response = await fetch(API_ENDPOINTS.comments.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      // Read the response body once
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to post reply: ${response.status}`)
      }

      // Si nous avons reçu les données du commentaire dans la réponse,
      // nous l'utilisons directement au lieu de refaire un fetchComments
      if (responseData && responseData.comment) {
        // Nous ne manipulons pas manuellement le state ici, car cela pourrait créer des doublons
        // lors du prochain rechargement des commentaires
        console.log("Reply created successfully, fetching all comments")
      }

      // Dans tous les cas, nous rechargeons tous les commentaires pour assurer la cohérence
      await fetchComments()

      // Réinitialiser le contenu de la réponse et fermer le formulaire
      setReplyContent("")
      setReplyingTo(null)
      updateCommentActionState(parentId, "success")
      setSuccessMessage("Reply posted successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error posting reply:", error)
      updateCommentActionState(parentId, "error", error instanceof Error ? error.message : "Failed to post reply")
      setErrorMessage(error instanceof Error ? error.message : "Failed to post reply")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  /**
   * Submit a new comment
   * @param e - Form event
   * @param parentId - ID of the parent comment (if replying)
   */
  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()

    if (!userInfo) {
      setErrorMessage("You must be logged in to comment")
      return
    }

    if (!newComment.trim()) {
      setErrorMessage("Comment cannot be empty")
      return
    }

    setIsSubmittingComment(true)

    try {
      // Apply content filtering before submission
      const filterResult = filterContent(newComment)
      
      // Show notification if content was filtered
      if (filterResult.wasFiltered) {
        console.log('Comment content was filtered:', filterResult.replacements)
        setSuccessMessage("Your comment has been filtered for inappropriate content")
        setTimeout(() => setSuccessMessage(null), 5000)
      }

      // Use sanitized payload with filtered content
      const payload = sanitizeCommentPayload(filterResult.filteredContent, id || "", parentId)
      console.log("[handleCommentSubmit] Payload:", payload)

      // Defensive check - ensure payload can be serialized
      JSON.stringify(payload)

      const response = await fetch(API_ENDPOINTS.comments.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      // Read the response body once
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to post comment")
      }

      // Nous rechargerons tous les commentaires pour éviter les problèmes de duplication
      console.log("Comment created successfully, fetching all comments")
      await fetchComments()

      setNewComment("")
      setReplyingTo(null)
      setSuccessMessage("Comment posted successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error posting comment:", error)
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while posting your comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

    // Effect to detect theme changes
    useEffect(() => {
      // Importer les fonctions pour la gestion du thème
      // Forcer l'application des variables CSS pour le contenu Markdown avec une spécificité accrue
      const style = document.createElement('style');
      style.id = 'markdown-theme-overrides';
      style.textContent = `
        /* Augmenter la spécificité des variables CSS pour surcharger le thème du navigateur */
        html:root {
          --md-text-heading: #111827 !important; 
          --md-text-body: #374151 !important;   
          --md-border: #e5e7eb !important;      
        }

        html.dark:root, html[data-theme="dark"]:root, html[data-mode="dark"]:root {
          --md-text-heading: #f5f5f5 !important; 
          --md-text-body: #d4d4d4 !important;    
          --md-border: #333 !important;          
        }

        /* Forcer les styles sur les éléments Markdown spécifiques */
        .markdown-body h1, .markdown-body h2, .markdown-body h3, 
        .markdown-body h4, .markdown-body h5, .markdown-body h6 {
          color: var(--md-text-heading) !important;
        }

        .markdown-body p, .markdown-body li, .markdown-body td {
          color: var(--md-text-body) !important;
        }

        .markdown-body pre, .markdown-body code {
          background-color: var(--md-code-block-bg, #1a1a1a) !important;
          border-color: var(--md-code-block-border, #333) !important;
        }
      `;

      // Remplacer le style s'il existe déjà
      const existingStyle = document.getElementById('markdown-theme-overrides');
      if (existingStyle) {
        existingStyle.replaceWith(style);
      } else {
        document.head.appendChild(style);
      }

      // Détection initiale du thème
      setIsDarkMode(detectDarkMode());

      // Configuration de l'écouteur de changement de thème
      const cleanup = setupThemeListener((isDark) => {
        setIsDarkMode(isDark);
        console.log('Theme detection - Dark mode:', isDark);

        // Forcer une mise à jour des styles après un changement de thème
        document.querySelectorAll('.markdown-body pre').forEach(pre => {
          (pre as HTMLElement).style.backgroundColor = '';
          (pre as HTMLElement).style.borderColor = '';
          setTimeout(() => {
            (pre as HTMLElement).style.backgroundColor = getComputedStyle(pre as HTMLElement).backgroundColor;
            (pre as HTMLElement).style.borderColor = getComputedStyle(pre as HTMLElement).borderColor;
          }, 0);
        });
      });

      // Nettoyage lors du démontage du composant
      return cleanup;
    }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(API_ENDPOINTS.posts.detail(id || ''))

        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.status}`)
        }

        const postData = await response.json()
        // Correction : compatibilité avec backend qui retourne { post }
        const post = postData.post || postData
        setPostInfo(post)
        setLikes(post.likes?.length || 0)
        setDislikes(post.dislikes?.length || 0)
        if (userInfo) {
          // Utiliser la fonction dédiée pour vérifier si l'utilisateur a aimé le post
          setUserLiked(hasUserLiked(post.likes, userInfo.id))
          setUserDisliked(hasUserLiked(post.dislikes, userInfo.id))
        }

        await fetchComments()
      } catch (error) {
        console.error("Error fetching data:", error)
        setErrorMessage(error instanceof Error ? error.message : "Failed to load post data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Vérifier si highlight.js est disponible
    const isHighlightJsAvailable = () => {
      try {
        return typeof hljs !== 'undefined' && hljs !== null && typeof hljs.highlight === 'function';
      } catch (e) {
        console.error("highlight.js n'est pas disponible:", e);
        return false;
      }
    };

    // Initialiser highlight.js s'il est disponible
    if (isHighlightJsAvailable()) {
      try {
        hljs.configure({
          languages: ['javascript', 'typescript', 'python', 'html', 'css', 'bash', 'json', 'markdown'],
          ignoreUnescapedHTML: true
        });
        console.log("highlight.js initialisé avec succès");
      } catch (e) {
        console.error("Erreur lors de l'initialisation de highlight.js:", e);
      }
    } else {
      console.warn("highlight.js n'est pas disponible, la coloration syntaxique sera désactivée");
    }

    // Add styles for animations and interactions
    const style = document.createElement("style")
    style.textContent = `
      .highlight {
        animation: highlightFade 2s;
      }
      @keyframes highlightFade {
        0% { background-color: rgba(34, 197, 94, 0.2); }
        100% { background-color: transparent; }
      }

      /* Animation pour les éléments qui apparaissent au défilement */
      [data-aos] {
        opacity: 0;
        transition: opacity 0.8s, transform 0.8s;
      }

      [data-aos="fade-up"] {
        transform: translateY(20px);
      }

      [data-aos="fade-right"] {
        transform: translateX(-20px);
      }

      [data-aos="zoom-in"] {
        transform: scale(0.95);
      }

      [data-aos].aos-animate {
        opacity: 1;
        transform: translateY(0) translateX(0) scale(1);
      }

      /* Style pour la table des matières */
      .table-of-contents {
        background-color: #f9f9f9;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid #eaeaea;
      }

      .table-of-contents h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }

      .table-of-contents ul {
        list-style-type: none;
        padding-left: 0;
      }

      .table-of-contents li {
        margin-bottom: 0.5rem;
      }

      .table-of-contents a {
        color: #16a34a;
        text-decoration: none;
        transition: color 0.2s;
      }

      .table-of-contents a:hover {
        color: #15803d;
        text-decoration: underline;
      }

      /* Style pour le mode sombre */
      @media (prefers-color-scheme: dark) {
        .table-of-contents {
          background-color: #222;
          border-color: #333;
        }

        .table-of-contents a {
          color: #4ade80;
        }

        .table-of-contents a:hover {
          color: #86efac;
        }
      }
    `
    document.head.appendChild(style)

    // Fonction pour animer les éléments au défilement
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('[data-aos]')

      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top
        const windowHeight = window.innerHeight

        if (elementPosition < windowHeight * 0.85) {
          element.classList.add('aos-animate')
        }
      })
    }

    // Ajouter les écouteurs d'événements
    window.addEventListener('scroll', animateOnScroll)

    // Déclencher l'animation initiale
    setTimeout(animateOnScroll, 100)

    return () => {
      document.head.removeChild(style)
      window.removeEventListener('scroll', animateOnScroll)
    }
  }, [id, userInfo, fetchComments])

  /**
   * Aimer un article
   */
  const handleLikePost = async () => {
      if (!userInfo) {
        setPostInteraction({
          isLoading: false,
          error: "Vous devez être connecté pour aimer un article",
          success: null
        })
        return
      }
  
      // Éviter les soumissions multiples
      if (postInteraction.isLoading) return
  
      // Set loading state
      setPostInteraction({
        isLoading: true,
        error: null,
        success: null
      })
  
      // Store original values for rollback
      const originalLikes = likes;
      const originalDislikes = dislikes;
      const originalUserLiked = userLiked;
      const originalUserDisliked = userDisliked;
  
      // Optimistic update
      const wasLiked = userLiked;
      const wasDisliked = userDisliked;
      const optimisticLikes = wasLiked ? likes - 1 : likes + 1;
      const optimisticDislikes = wasDisliked ? dislikes - 1 : dislikes;
  
      setLikes(optimisticLikes);
      setDislikes(optimisticDislikes);
      setUserLiked(!wasLiked);
      setUserDisliked(false);
  
      try {
        const response = await fetch(`${API_ENDPOINTS.posts.like(id || '')}`, {
          method: "POST",
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (response.ok) {
          // Update with server data
          setLikes(Array.isArray(data.likes) ? data.likes.length : 0)
          setDislikes(Array.isArray(data.dislikes) ? data.dislikes.length : 0)
          setUserLiked(hasUserLiked(data.likes, userInfo?.id))
          setUserDisliked(hasUserLiked(data.dislikes, userInfo?.id))
          
          setPostInteraction({
            isLoading: false,
            error: null,
            success: "Article aimé avec succès"
          })
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setPostInteraction(prev => ({ ...prev, success: null }))
          }, 3000)
        } else {
          // Rollback on API error
          setLikes(originalLikes)
          setDislikes(originalDislikes)
          setUserLiked(originalUserLiked)
          setUserDisliked(originalUserDisliked)
          
          const errorMessage = data.message || "Erreur lors de l'action d'aimer l'article"
          setPostInteraction({
            isLoading: false,
            error: errorMessage,
            success: null
          })
          console.warn("Erreur lors du like:", data.message)
        }
      } catch (error) {
        // Rollback on network error
        setLikes(originalLikes)
        setDislikes(originalDislikes)
        setUserLiked(originalUserLiked)
        setUserDisliked(originalUserDisliked)
        
        const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action d'aimer l'article"
        setPostInteraction({
          isLoading: false,
          error: errorMessage,
          success: null
        })
        console.error("Erreur lors de l'action d'aimer l'article:", error)
      }
    }

  /**
   * Ne pas aimer un article
   */
  const handleDislikePost = async () => {
      if (!userInfo) {
        setPostInteraction({
          isLoading: false,
          error: "Vous devez être connecté pour ne pas aimer un article",
          success: null
        })
        return
      }
  
      // Éviter les soumissions multiples
      if (postInteraction.isLoading) return
  
      // Set loading state
      setPostInteraction({
        isLoading: true,
        error: null,
        success: null
      })
  
      // Store original values for rollback
      const originalLikes = likes;
      const originalDislikes = dislikes;
      const originalUserLiked = userLiked;
      const originalUserDisliked = userDisliked;
  
      // Optimistic update
      const wasLiked = userLiked;
      const wasDisliked = userDisliked;
      const optimisticLikes = wasLiked ? likes - 1 : likes;
      const optimisticDislikes = wasDisliked ? dislikes - 1 : dislikes + 1;
  
      setLikes(optimisticLikes);
      setDislikes(optimisticDislikes);
      setUserLiked(false);
      setUserDisliked(!wasDisliked);
  
      try {
        const response = await fetch(`${API_ENDPOINTS.posts.dislike(id || '')}`, {
          method: "POST",
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (response.ok) {
          // Update with server data
          setLikes(Array.isArray(data.likes) ? data.likes.length : 0)
          setDislikes(Array.isArray(data.dislikes) ? data.dislikes.length : 0)
          setUserLiked(hasUserLiked(data.likes, userInfo?.id))
          setUserDisliked(hasUserLiked(data.dislikes, userInfo?.id))
          
          setPostInteraction({
            isLoading: false,
            error: null,
            success: "Article disliké avec succès"
          })
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setPostInteraction(prev => ({ ...prev, success: null }))
          }, 3000)
        } else {
          // Rollback on API error
          setLikes(originalLikes)
          setDislikes(originalDislikes)
          setUserLiked(originalUserLiked)
          setUserDisliked(originalUserDisliked)
          
          const errorMessage = data.message || "Erreur lors de l'action de ne pas aimer l'article"
          setPostInteraction({
            isLoading: false,
            error: errorMessage,
            success: null
          })
          console.warn("Erreur lors du dislike:", data.message)
        }
      } catch (error) {
        // Rollback on network error
        setLikes(originalLikes)
        setDislikes(originalDislikes)
        setUserLiked(originalUserLiked)
        setUserDisliked(originalUserDisliked)
        
        const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action de ne pas aimer l'article"
        setPostInteraction({
          isLoading: false,
          error: errorMessage,
          success: null
        })
        console.error("Erreur lors de l'action de ne pas aimer l'article:", error)
      }
    }

  /**
   * Scroll to a specific comment and highlight it
   * @param commentId - ID of the comment to scroll to
   */
  const scrollToComment = (commentId: string): void => {
    const element = document.getElementById(`comment-${commentId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      element.classList.add("highlight")
      setTimeout(() => {
        element.classList.remove("highlight")
      }, 2000)
    }
  }

  /**
   * Render comments recursively with proper indentation
   * @param comments - Array of comments to render
   * @param depth - Current depth level for indentation
   * @param parentId - ID of the parent comment (if any)
   */
  const renderComments = (commentsInput: Comment[] = [], depth = 0, parentId: string | null = null) => {
    // Defensive: always use an array and filter out invalid comments
    const comments = Array.isArray(commentsInput) 
      ? commentsInput.filter(comment => 
          comment && typeof comment === 'object' && comment._id && 
          // S'assurer que l'auteur existe
          comment.author && typeof comment.author === 'object')
      : []

    // Vérifier les doublons pour déboguer
    const commentIds = comments.map(c => c._id)
    const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      console.warn('Duplicate comment IDs found:', duplicateIds)
    }

    return comments.map((comment: Comment, index) => {
      // Log de débogage pour l'état des likes/dislikes
      const userLiked = userInfo?.id && Array.isArray(comment.likes) && comment.likes.includes(userInfo.id)
      const userDisliked = userInfo?.id && Array.isArray(comment.dislikes) && comment.dislikes.includes(userInfo.id)
      
      console.log(`Comment ${comment._id}:`, {
        userId: userInfo?.id,
        likes: comment.likes,
        dislikes: comment.dislikes,
        userLiked,
        userDisliked
      })

      // FIX: Wrap the returned JSX in parentheses so the arrow function returns it
      return (
        <div
          key={`${comment._id}-${depth}-${index}`}
          id={`comment-${comment._id}`}
          className={`${depth > 0 ? "ml-8" : ""} bg-card rounded-lg shadow-sm p-4 mb-4 border`}
        >
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0">
            <img
              className="w-10 h-10 rounded-full"
              src={`https://ui-avatars.com/api/?name=${comment.author.username}&background=random`}
              alt={comment.author.username}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{comment.author.username}</h4>
              <time className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</time>
            </div>

            {parentId && (
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                replying to{" "}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToComment(parentId)
                  }}
                  className="text-primary hover:underline"
                >
                  {comments.find((c) => c._id === parentId)?.author.username}
                </button>
              </div>
            )}

            {editingComment === comment._id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleUpdateComment(comment._id)
                }}
                className="mt-2"
              >
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-2 border rounded text-sm resize-none min-h-[100px]"
                  style={{
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    color: isDarkMode ? '#e0e0e0' : '#000000',
                    borderColor: isDarkMode ? '#3a3a3a' : '#e5e7eb'
                  }}
                  required
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button type="submit" size="sm">
                    Update
                  </Button>
                  <Button onClick={() => setEditingComment(null)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-foreground mt-1">{comment.content}</p>
            )}

            <div className="flex items-center space-x-4 mt-3">
              <button
                onClick={() => handleLikeComment(comment._id)}
                className={`flex items-center space-x-1 text-sm ${userInfo?.id && Array.isArray(comment.likes) && comment.likes.includes(userInfo.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
              >
                <Heart className={`h-4 w-4 ${userInfo?.id && Array.isArray(comment.likes) && comment.likes.includes(userInfo.id) ? "fill-current" : ""}`} />
                <span>{Array.isArray(comment.likes) ? comment.likes.length : 0}</span>
              </button>
              <button
                onClick={() => handleDislikeComment(comment._id)}
                className={`flex items-center space-x-1 text-sm ${userInfo?.id && Array.isArray(comment.dislikes) && comment.dislikes.includes(userInfo.id) ? "text-destructive" : "text-muted-foreground"} hover:text-destructive transition-colors`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{Array.isArray(comment.dislikes) ? comment.dislikes.length : 0}</span>
              </button>
              <button
                onClick={() => {
                  setReplyingTo(comment._id)
                  setReplyContent("") // Réinitialiser le contenu de la réponse
                }}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </button>
              {userInfo && userInfo.id === comment.author._id && (
                <>
                  <button
                    onClick={() => handleEditComment(comment._id)}
                    className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {replyingTo === comment._id && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleReply(comment._id)
            }}
            className="mt-4"
          >
            <textarea
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value)
                checkReplyContent(e.target.value)
              }}
              placeholder="Write your reply..."
              className="w-full p-3 border rounded-md text-sm resize-none min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
              style={{
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                color: isDarkMode ? '#e0e0e0' : '#000000',
                borderColor: isDarkMode ? '#3a3a3a' : '#e5e7eb'
              }}
              required
            />
            {replyWarnings.length > 0 && (
              <div className="mt-2 flex items-center text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Content may be filtered: {replyWarnings.join(', ')}</span>
              </div>
            )}
            <div className="flex justify-end mt-2 space-x-2">
              <Button type="submit" size="sm">
                Post Reply
              </Button>
              <Button
                onClick={() => {
                  setReplyingTo(null)
                  setReplyContent("")
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className="mt-4">{renderComments(comment.replies, depth + 1, comment._id)}</div>
        )}
      </div>
      )
    })
  }

  if (isLoading) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8"></div>
            <div className="h-10 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  if (!postInfo) return null

  const username = userInfo?.username
  const userId = userInfo?.id

  // Check if the current user is the author of the post
  const isAuthor = userId && postInfo?.author?._id === userId

  /**
   * Delete a post with confirmation
   * @param postId - ID of the post to delete
   */
  async function deletePost(postId: string): Promise<void> {
    try {
      // Show confirmation modal
      setConfirmModalIsOpen(true)

      // Wait for user confirmation
      const confirmDeletion = await new Promise<boolean>((resolve) => {
        setConfirmModalOnConfirm(() => {
          resolve(true)
          setConfirmModalIsOpen(false)
        })
      })

      if (confirmDeletion) {
        // Show loading state
        setIsSubmittingComment(true)

        const response = await fetch(`${API_ENDPOINTS.posts.delete(postId)}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete post: ${response.status}`)
        }

        setSuccessMessage("Post deleted successfully")

        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  /**
   * Format image path to handle both relative and absolute URLs safely
   * @param path - Image path (may be undefined or null)
   * @returns Formatted image URL or a placeholder if not valid
   */
  const formatImagePath = (path?: string | null): string => {
    if (!path || path.trim() === '') {
      // Return a default placeholder
      return "/images/placeholder.png";
    }
    if (path.startsWith("http")) {
      return path;
    }
    return `${API_BASE_URL}/${path.replace(/\\/g, "/")}`;
  }

  // Render error message
  const renderErrorMessage = () => {
    // Déterminer le message d'erreur à afficher (priorité aux erreurs d'interaction avec les articles)
    const displayedError = postInteraction.error || errorMessage;

    if (!displayedError) return null;

    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 text-sm font-medium">{displayedError}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
              setPostInteraction(prev => ({ ...prev, error: null }));
            }}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    // Déterminer le message de succès à afficher (priorité aux messages d'interaction avec les articles)
    const displayedSuccess = postInteraction.success || successMessage;

    if (!displayedSuccess) return null;

    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-800 text-sm font-medium">{displayedSuccess}</p>
          <button
            onClick={() => {
              setSuccessMessage(null);
              setPostInteraction(prev => ({ ...prev, success: null }));
            }}
            className="text-xs text-green-600 hover:text-green-800 mt-1"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
    <> 
    <main className="py-10">
            <Container>
        <article className="max-w-3xl mx-auto">
          {/* Error and success messages */}
          {renderErrorMessage()}
          {renderSuccessMessage()}

          <AnimateOnView animation="fade">
            <div className="mb-8">
              <div className="relative w-full h-[400px] bg-cover bg-center rounded-xl overflow-hidden">
                <SafeImage
                  src={postInfo.cover}
                  alt={postInfo.title}
                  className="w-full h-full object-cover"
                  height={400}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
            </div>
          </AnimateOnView>

          <AnimateOnView animation="slide-up" delay={100}>
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="badge-outline bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-800 shadow-sm"
                >
                  {getCategoryName(postInfo)}
                </Badge>
                <time className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(postInfo.createdAt)}
                </time>
                <div className="text-sm text-muted-foreground flex items-center">
                  <User2 className="h-4 w-4 mr-1" />
                  {postInfo.author?.username || "Unknown author"}
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {comments.length} comments
                </div>
              </div>

              <H1 className="text-3xl md:text-4xl font-bold mb-4">{postInfo.title}</H1>
              <P className="text-lg text-muted-foreground mb-6">{postInfo.summary}</P>
            </div>
          </AnimateOnView>

          <AnimateOnView animation="slide-up" delay={200}>
            {/* Table des matières générée automatiquement */}
            <div className="table-of-contents mb-8">
              <h3 className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Sommaire
              </h3>
              {(() => {
                // Extraire les titres du contenu pour générer la table des matières
                const headings: {id: string, text: string, level: number}[] = [];
                const parser = new DOMParser();
                const htmlContent = formatContent(postInfo.content);
                const doc = parser.parseFromString(htmlContent, 'text/html');

                doc.querySelectorAll('h1, h2, h3').forEach((heading) => {
                  const id = heading.getAttribute('id') || '';
                  const level = parseInt(heading.tagName.substring(1));
                  headings.push({
                    id,
                    text: heading.textContent?.replace('#', '') || '',
                    level
                  });
                });

                // Générer la liste des liens
                return (
                  <ul>
                    {headings.map((heading, index) => (
                      <li key={index} style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            {/* Contenu principal avec mise en forme améliorée */}
            <div className="prose prose-green max-w-none dark:prose-invert mb-8 markdown-content">
              <div
                dangerouslySetInnerHTML={{ __html: formatContent(postInfo.content) }}
                className="markdown-body"
              />
            </div>

            {/* Informations sur l'article */}
            <div className="bg-muted/30 rounded-lg p-4 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Dernière mise à jour: {formatDate(postInfo.updatedAt || postInfo.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span>Catégorie: {getCategoryName(postInfo)}</span>
              </div>
            </div>
          </AnimateOnView>

          <AnimateOnView animation="slide-up" delay={300}>
            <div className="flex justify-center items-center space-x-8 mb-8 border-t border-b py-6">
              <button
                onClick={handleLikePost}
                disabled={postInteraction.isLoading || !userInfo}
                className={`flex items-center space-x-2 ${userLiked ? "text-primary" : "text-muted-foreground"} ${postInteraction.isLoading ? "opacity-50 cursor-not-allowed" : "hover:text-primary"} transition-colors`}
                aria-label="J'aime cet article"
                title={!userInfo ? "Vous devez être connecté pour aimer un article" : "J'aime cet article"}
              >
                <Heart className={`h-6 w-6 ${userLiked ? "fill-current text-primary" : ""} ${postInteraction.isLoading ? "animate-pulse" : ""}`} />
                <span className="text-lg">{likes}</span>
              </button>
              <button
                onClick={handleDislikePost}
                disabled={postInteraction.isLoading || !userInfo}
                className={`flex items-center space-x-2 ${userDisliked ? "text-destructive" : "text-muted-foreground"} ${postInteraction.isLoading ? "opacity-50 cursor-not-allowed" : "hover:text-destructive"} transition-colors`}
                aria-label="Je n'aime pas cet article"
                title={!userInfo ? "Vous devez être connecté pour ne pas aimer un article" : "Je n'aime pas cet article"}
              >
                <ThumbsDown className={`h-6 w-6 ${userDisliked ? "fill-current" : ""} ${postInteraction.isLoading ? "animate-pulse" : ""}`} />
                <span className="text-lg">{dislikes}</span>
              </button>
            </div>
          </AnimateOnView>

          {isAuthor && (
            <AnimateOnView animation="slide-up" delay={400}>
              <div className="flex justify-center space-x-4 mb-12">
                <Link to={`/edit_page/${postInfo._id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Post
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => deletePost(postInfo._id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </Button>
              </div>
            </AnimateOnView>
          )}

          <AnimateOnView animation="slide-up" delay={500}>
            <div className="bg-muted/30 rounded-xl p-6">
              <H2 className="text-2xl font-bold mb-6">Discussion ({comments.length})</H2>

              {username ? (
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none min-h-[150px] focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{
                      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                      color: isDarkMode ? '#e0e0e0' : '#000000',
                      borderColor: isDarkMode ? '#3a3a3a' : '#e5e7eb'
                    }}
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      checkCommentContent(e.target.value)
                    }}
                    required
                  ></textarea>
                  {commentWarnings.length > 0 && (
                    <div className="mt-2 flex items-center text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Content may be filtered: {commentWarnings.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <Button type="submit" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Post Comment
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
                  <p className="text-muted-foreground">
                    Please{" "}
                    <Link to="/login_page" className="text-primary font-medium hover:underline">
                      log in
                    </Link>{" "}
                    to join the discussion.
                  </p>
                </div>
              )}

              <div className="space-y-6">{renderComments(comments)}</div>
            </div>
          </AnimateOnView>
        </article>
      </Container>

      <ConfirmationModal
        isOpen={confirmModalIsOpen}
        onRequestClose={() => setConfirmModalIsOpen(false)}
        onConfirm={confirmModalOnConfirm}
      />
    </main>
     </>
  )
}

export default PostPage
