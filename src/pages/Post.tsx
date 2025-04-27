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
import {
  CalendarIcon, User2, MessageCircle, Edit, Trash2,
  Reply, Heart, ThumbsDown, AlertCircle, CheckCircle
} from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"
import { ActionStatus } from "../types/Action"
import { Post, Comment } from "../types/PostType"

// Action states
interface ActionState {
  status: ActionStatus
  error: string | null
}

interface CommentActionStates {
  [commentId: string]: ActionState
}

// API configuration
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  posts: `${API_BASE_URL}/posts`,
  comments: `${API_BASE_URL}/comments`,
  comment: `${API_BASE_URL}/comment`
}


const PostPage = () => {
  // Post and comments state
  const [postInfo, setPostInfo] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])

  // Comment form state
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")

  // Post interaction state
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userDisliked, setUserDisliked] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentActionStates, setCommentActionStates] = useState<CommentActionStates>({})
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
      const response = await fetch(`${API_ENDPOINTS.comments}/${id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const fetchedComments: Comment[] = await response.json()
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch comments")
    }
  }, [id])

  /**
   * Format HTML content with enhanced styling
   * @param content - HTML content to format
   * @returns Formatted HTML string
   */
  const formatContent = (content: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")

    // Enhance images
    doc.querySelectorAll("img").forEach((img) => {
      img.style.display = "block"
      img.style.margin = "2rem auto"
      img.style.borderRadius = "0.5rem"
      img.style.maxWidth = "100%"
      img.style.height = "auto"
      img.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    })

    // Enhance headings
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      const element = heading as HTMLElement
      element.style.marginTop = "2rem"
      element.style.marginBottom = "1rem"
      element.style.fontWeight = "600"
      element.style.lineHeight = "1.25"
    })

    // Enhance paragraphs
    doc.querySelectorAll("p").forEach((paragraph) => {
      paragraph.style.marginTop = "1rem"
      paragraph.style.marginBottom = "1rem"
      paragraph.style.lineHeight = "1.7"
    })

    // Enhance links
    doc.querySelectorAll("a").forEach((link) => {
      link.style.color = "#16a34a"
      link.style.textDecoration = "none"
    })

    // Enhance blockquotes
    doc.querySelectorAll("blockquote").forEach((quote) => {
      quote.style.borderLeft = "4px solid #22c55e"
      quote.style.paddingLeft = "1rem"
      quote.style.fontStyle = "italic"
      quote.style.margin = "1.5rem 0"
      quote.style.color = "#4b5563"
    })

    return doc.body.innerHTML
  }

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
      setErrorMessage("You must be logged in to like a comment")
      return
    }

    updateCommentActionState(commentId, "loading")

    try {
      const response = await fetch(`${API_ENDPOINTS.comment}/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to like comment: ${response.status}`)
      }

      const data = await response.json()

      setComments(
        comments.map((comment) =>
          comment._id === commentId ? { ...comment, likes: data.likes, dislikes: data.dislikes } : comment,
        ),
      )

      updateCommentActionState(commentId, "success")
      setSuccessMessage("Comment liked successfully")

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error liking comment:", error)
      updateCommentActionState(commentId, "error", error instanceof Error ? error.message : "Failed to like comment")
      setErrorMessage(error instanceof Error ? error.message : "Failed to like comment")
    }
  }

  /**
   * Dislike a comment
   * @param commentId - ID of the comment to dislike
   */
  const handleDislikeComment = async (commentId: string) => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to dislike a comment")
      return
    }

    updateCommentActionState(commentId, "loading")

    try {
      const response = await fetch(`${API_ENDPOINTS.comment}/${commentId}/dislike`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to dislike comment: ${response.status}`)
      }

      const data = await response.json()

      setComments(
        comments.map((comment) =>
          comment._id === commentId ? { ...comment, likes: data.likes, dislikes: data.dislikes } : comment,
        ),
      )

      updateCommentActionState(commentId, "success")
    } catch (error) {
      console.error("Error disliking comment:", error)
      updateCommentActionState(commentId, "error", error instanceof Error ? error.message : "Failed to dislike comment")
      setErrorMessage(error instanceof Error ? error.message : "Failed to dislike comment")
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
      const response = await fetch(`${API_ENDPOINTS.comment}/${commentId}`, {
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
        const response = await fetch(`${API_ENDPOINTS.comment}/${commentId}`, {
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
   * Reply to a comment
   * @param parentId - ID of the parent comment
   * @param content - Content of the reply
   */
  const handleReply = async (parentId: string, content: string) => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to reply")
      return
    }

    if (!content.trim()) {
      setErrorMessage("Reply cannot be empty")
      return
    }

    updateCommentActionState(parentId, "loading")
    setIsSubmittingComment(true)

    try {
      const response = await fetch(API_ENDPOINTS.comment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          postId: id,
          parentId,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to post reply: ${response.status}`)
      }

      await fetchComments()
      setNewComment("")
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
      const response = await fetch(API_ENDPOINTS.comment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: newComment,
          postId: id,
          parentId,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to post comment")
      }

      setNewComment("")
      setReplyingTo(null)
      await fetchComments()
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${id}`)
        const postData = await response.json()
        setPostInfo(postData)
        setLikes(postData.likes?.length || 0)
        setDislikes(postData.dislikes?.length || 0)
        if (userInfo) {
          setUserLiked(postData.likes?.includes(userInfo.id))
          setUserDisliked(postData.dislikes?.includes(userInfo.id))
        }

        await fetchComments()
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Add highlight animation styles
    const style = document.createElement("style")
    style.textContent = `
      .highlight {
        animation: highlightFade 2s;
      }
      @keyframes highlightFade {
        0% { background-color: rgba(34, 197, 94, 0.2); }
        100% { background-color: transparent; }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [id, userInfo])

  const handleLikePost = async () => {
    if (!userInfo) {
      alert("You must be logged in to like a post")
      return
    }
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${id}/like`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes.length)
        setDislikes(data.dislikes.length)
        setUserLiked(data.likes.includes(userInfo.id))
        setUserDisliked(data.dislikes.includes(userInfo.id))
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleDislikePost = async () => {
    if (!userInfo) {
      alert("You must be logged in to dislike a post")
      return
    }
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${id}/dislike`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes.length)
        setDislikes(data.dislikes.length)
        setUserLiked(data.likes.includes(userInfo.id))
        setUserDisliked(data.dislikes.includes(userInfo.id))
      }
    } catch (error) {
      console.error("Error disliking post:", error)
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
  const renderComments = (comments: Comment[], depth = 0, parentId: string | null = null) => {
    return comments.map((comment: Comment) => (
      <div
        key={comment._id}
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
                className={`flex items-center space-x-1 text-sm ${userInfo?.id && comment.likes.includes(userInfo.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
              >
                <Heart className="h-4 w-4" />
                <span>{comment.likes.length}</span>
              </button>
              <button
                onClick={() => handleDislikeComment(comment._id)}
                className={`flex items-center space-x-1 text-sm ${userInfo?.id && comment.dislikes.includes(userInfo.id) ? "text-destructive" : "text-muted-foreground"} hover:text-destructive transition-colors`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{comment.dislikes.length}</span>
              </button>
              <button
                onClick={() => setReplyingTo(comment._id)}
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
              handleReply(comment._id, newComment)
            }}
            className="mt-4"
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-3 border rounded-md text-sm resize-none min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <div className="flex justify-end mt-2 space-x-2">
              <Button type="submit" size="sm">
                Post Reply
              </Button>
              <Button onClick={() => setReplyingTo(null)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">{renderComments(comment.replies, depth + 1, comment._id)}</div>
        )}
      </div>
    ))
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

        const response = await fetch(`${API_ENDPOINTS.posts}/${postId}`, {
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
   * Format image path to handle both relative and absolute URLs
   * @param path - Image path
   * @returns Formatted image URL
   */
  const formatImagePath = (path: string): string => {
    if (path.startsWith("http")) {
      return path
    }
    return `${API_BASE_URL}/${path.replace(/\\/g, "/")}`
  }

  // Render error message
  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;

    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-green-600 hover:text-green-800 mt-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="py-10">
      <Container>
        <article className="max-w-3xl mx-auto">
          {/* Error and success messages */}
          {renderErrorMessage()}
          {renderSuccessMessage()}

          <AnimateOnView animation="fade">
            <div className="mb-8">
              <div className="relative w-full h-[400px] bg-cover bg-center rounded-xl overflow-hidden">
                <img
                  src={formatImagePath(postInfo.cover) || "/placeholder.svg"}
                  alt={postInfo.title}
                  className="w-full h-full object-cover"
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
                  className="bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-800"
                >
                  {postInfo.category?.name || "Uncategorized"}
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
            <div className="prose prose-green max-w-none dark:prose-invert mb-8">
              <div dangerouslySetInnerHTML={{ __html: formatContent(postInfo.content) }} />
            </div>
          </AnimateOnView>

          <AnimateOnView animation="slide-up" delay={300}>
            <div className="flex justify-center items-center space-x-8 mb-8 border-t border-b py-6">
              <button
                onClick={handleLikePost}
                className={`flex items-center space-x-2 ${userLiked ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
              >
                <Heart className={`h-6 w-6 ${userLiked ? "fill-current" : ""}`} />
                <span className="text-lg">{likes}</span>
              </button>
              <button
                onClick={handleDislikePost}
                className={`flex items-center space-x-2 ${userDisliked ? "text-destructive" : "text-muted-foreground"} hover:text-destructive transition-colors`}
              >
                <ThumbsDown className="h-6 w-6" />
                <span className="text-lg">{dislikes}</span>
              </button>
            </div>
          </AnimateOnView>

          {userId === postInfo.author._id && (
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
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
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
  )
}

export default PostPage

