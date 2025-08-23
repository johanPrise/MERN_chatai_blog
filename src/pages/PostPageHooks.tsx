import { useState, useEffect, useCallback } from "react"
import { API_ENDPOINTS } from "../config/api.config"
import { processCommentsResponse, handleCommentSubmission, sanitizeCommentPayload } from './PostHelpers'
import { Comment } from "../types/PostType"

// Custom hook for comment management
export const useCommentManagement = (
  id: string | undefined,
  userInfo: any,
  filterContent: (content: string) => any,
  setErrorMessage: (message: string | null) => void,
  setSuccessMessage: (message: string | null) => void
) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!id) return

    try {
      setErrorMessage(null)
      const response = await fetch(API_ENDPOINTS.comments.byPost(id), {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const responseData = await response.json()
      const commentsWithDefaults = processCommentsResponse(responseData)
      setComments(commentsWithDefaults)
    } catch (error) {
      console.error("Error fetching comments:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch comments")
    }
  }, [id, setErrorMessage])

  const handleCommentSubmit = async (e: React.FormEvent, newComment: string, parentId: string | null = null) => {
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
      const filterResult = filterContent(newComment)
      
      if (filterResult.wasFiltered) {
        setSuccessMessage("Your comment has been filtered for inappropriate content")
        setTimeout(() => setSuccessMessage(null), 5000)
      }

      const payload = sanitizeCommentPayload(filterResult.filteredContent, id || "", parentId)

      const response = await fetch(API_ENDPOINTS.comments.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to post comment")
      }

      await fetchComments()
      setSuccessMessage("Comment posted successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error posting comment:", error)
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while posting your comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleUpdateComment = async (commentId: string, editedContent: string) => {
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
      setSuccessMessage("Comment updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error updating comment:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to update comment")
    }
  }

  const executeCommentDeletion = async (commentId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.comments.delete(commentId)}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.status}`)
      }

      await fetchComments()
      setSuccessMessage("Comment deleted successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting comment:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete comment")
    }
  }

  const handleReply = async (parentId: string, replyContent: string) => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to reply")
      return
    }

    if (!replyContent.trim()) {
      setErrorMessage("Reply cannot be empty")
      return
    }

    if (isSubmittingComment) {
      return
    }

    setIsSubmittingComment(true)

    try {
      const { filterResult } = await handleCommentSubmission(
        replyContent,
        id || "",
        filterContent,
        parentId
      )
      
      if (filterResult.wasFiltered) {
        setSuccessMessage("Your reply has been filtered for inappropriate content")
        setTimeout(() => setSuccessMessage(null), 5000)
      }

      await fetchComments()
      setSuccessMessage("Reply posted successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error posting reply:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to post reply")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return {
    comments,
    isSubmittingComment,
    fetchComments,
    handleCommentSubmit,
    handleUpdateComment,
    executeCommentDeletion,
    handleReply
  }
}

// Custom hook for post interactions
export const usePostInteractions = (
  id: string | undefined,
  userInfo: any,
  setErrorMessage: (message: string | null) => void,
  setSuccessMessage: (message: string | null) => void
) => {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userDisliked, setUserDisliked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const hasUserLiked = (likes: any, userId: string | undefined): boolean => {
    if (!userId || !likes || !Array.isArray(likes)) return false
    return likes.includes(userId)
  }

  const hasUserDisliked = (dislikes: any, userId: string | undefined): boolean => {
    if (!userId || !dislikes || !Array.isArray(dislikes)) return false
    return dislikes.includes(userId)
  }

  const updatePostStateFromServer = (data: any) => {
    const serverLikes = Array.isArray(data.likes) ? data.likes : []
    const serverDislikes = Array.isArray(data.dislikes) ? data.dislikes : []
    setLikes(serverLikes.length)
    setDislikes(serverDislikes.length)
    setUserLiked(hasUserLiked(serverLikes, userInfo?.id))
    setUserDisliked(hasUserDisliked(serverDislikes, userInfo?.id))
  }

  const handleLikePost = async () => {
    if (!userInfo) {
      setErrorMessage("Vous devez être connecté pour aimer un article")
      return
    }

    if (isLoading) return

    setIsLoading(true)
    const originalState = { likes, dislikes, userLiked, userDisliked }
    const optimisticLikes = userLiked ? likes - 1 : likes + 1
    const optimisticDislikes = userDisliked ? dislikes - 1 : dislikes

    setLikes(optimisticLikes)
    setDislikes(optimisticDislikes)
    setUserLiked(!userLiked)
    setUserDisliked(false)

    try {
      const response = await fetch(`${API_ENDPOINTS.posts.like(id || '')}`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        updatePostStateFromServer(data)
        setSuccessMessage("Article aimé avec succès")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setLikes(originalState.likes)
        setDislikes(originalState.dislikes)
        setUserLiked(originalState.userLiked)
        setUserDisliked(originalState.userDisliked)
        setErrorMessage(data.message || "Erreur lors de l'action d'aimer l'article")
      }
    } catch (error) {
      setLikes(originalState.likes)
      setDislikes(originalState.dislikes)
      setUserLiked(originalState.userLiked)
      setUserDisliked(originalState.userDisliked)
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action d'aimer l'article"
      setErrorMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDislikePost = async () => {
    if (!userInfo) {
      setErrorMessage("Vous devez être connecté pour ne pas aimer un article")
      return
    }

    if (isLoading) return

    setIsLoading(true)
    const originalState = { likes, dislikes, userLiked, userDisliked }
    const optimisticLikes = userLiked ? likes - 1 : likes
    const optimisticDislikes = userDisliked ? dislikes - 1 : dislikes + 1

    setLikes(optimisticLikes)
    setDislikes(optimisticDislikes)
    setUserLiked(false)
    setUserDisliked(!userDisliked)

    try {
      const response = await fetch(`${API_ENDPOINTS.posts.dislike(id || '')}`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        updatePostStateFromServer(data)
        setSuccessMessage("Article disliké avec succès")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setLikes(originalState.likes)
        setDislikes(originalState.dislikes)
        setUserLiked(originalState.userLiked)
        setUserDisliked(originalState.userDisliked)
        setErrorMessage(data.message || "Erreur lors de l'action de ne pas aimer l'article")
      }
    } catch (error) {
      setLikes(originalState.likes)
      setDislikes(originalState.dislikes)
      setUserLiked(originalState.userLiked)
      setUserDisliked(originalState.userDisliked)
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion lors de l'action de ne pas aimer l'article"
      setErrorMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    likes,
    dislikes,
    userLiked,
    userDisliked,
    isLoading,
    setLikes,
    setDislikes,
    setUserLiked,
    setUserDisliked,
    hasUserLiked,
    hasUserDisliked,
    handleLikePost,
    handleDislikePost
  }
}