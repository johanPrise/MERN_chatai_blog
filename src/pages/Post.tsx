"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { UserContext } from "../UserContext"
import ConfirmationModal from "../components/ConfirmationModal"
import { Container } from "../components/ui/container"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { H1, H2, P } from "../components/ui/typography"
import { formatDate } from "../lib/utils"
import { CalendarIcon, User2, MessageCircle, Edit, Trash2, Reply, Heart, ThumbsDown } from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"
import React from "react"

interface Comment {
  _id: string
  author: {
    username: string
    _id: string
  }
  content: string
  createdAt: string
  likes: string[]
  dislikes: string[]
  replies?: Comment[]
}

const PostPage = () => {
  interface Post {
    _id: string;
    cover: string;
    category?: { name: string } | null;
    createdAt: string;
    title: string;
    summary: string;
    content: string;
    likes: string[];
    dislikes: string[];
    author: { _id: string; username: string };
  }
  
  const [postInfo, setPostInfo] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState(null)
  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editedContent, setEditedContent] = useState("")
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userDisliked, setUserDisliked] = useState(false)
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => {})
  const [isLoading, setIsLoading] = useState(true)
  const { userInfo } = UserContext()
  const { id } = useParams()

  const fetchComments = async () => {
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/comments/${id}`)
      const fetchedComments: Comment[] = await response.json()
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const formatContent = (content) => {
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
      const element = heading as HTMLElement;
      element.style.marginTop = "2rem";
      element.style.marginBottom = "1rem";
      element.style.fontWeight = "600";
      element.style.lineHeight = "1.25";
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

  const handleLikeComment = async (commentId: string) => {
    if (!userInfo) {
      alert("You must be logged in to like a comment")
      return
    }
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setComments(
          comments.map((comment) =>
            comment._id === commentId ? { ...comment, likes: data.likes, dislikes: data.dislikes } : comment,
          ),
        )
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const handleDislikeComment = async (commentId: string) => {
    if (!userInfo) {
      alert("You must be logged in to dislike a comment")
      return
    }
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}/dislike`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setComments(
          comments.map((comment) =>
            comment._id === commentId ? { ...comment, likes: data.likes, dislikes: data.dislikes } : comment,
          ),
        )
      }
    } catch (error) {
      console.error("Error disliking comment:", error)
    }
  }

  const handleEditComment = (commentId) => {
    const comment = comments.find((c) => c._id === commentId)
    setEditingComment(commentId)
    setEditedContent(comment ? comment.content : "")
  }

  const handleUpdateComment = async (commentId) => {
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editedContent }),
        credentials: "include",
      })
      if (response.ok) {
        fetchComments()
        setEditingComment(null)
      } else {
        alert("Failed to update comment")
      }
    } catch (error) {
      console.error("Error updating comment:", error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const response = await fetch(`api/comment/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        })
        if (response.ok) {
          fetchComments()
        } else {
          alert("Failed to delete comment")
        }
      } catch (error) {
        console.error("Error deleting comment:", error)
      }
    }
  }

  const handleReply = async (parentId, content) => {
    if (!userInfo) {
      alert("You must be logged in to reply")
      return
    }
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/comment", {
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
      if (response.ok) {
        fetchComments()
        setNewComment("")
        setReplyingTo(null)
      } else {
        alert("Failed to post reply")
      }
    } catch (error) {
      console.error("Error posting reply:", error)
    }
  }

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault()
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/comment", {
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
      if (response.ok) {
        setNewComment("")
        setReplyingTo(null)
        fetchComments()
      } else {
        const data = await response.json()
        alert(data.message || "Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      alert("An error occurred while posting your comment")
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

  const scrollToComment = (commentId) => {
    const element = document.getElementById(`comment-${commentId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      element.classList.add("highlight")
      setTimeout(() => {
        element.classList.remove("highlight")
      }, 2000)
    }
  }

  const renderComments = (comments, depth = 0, parentId = null) => {
    return comments.map((comment) => (
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
                className={`flex items-center space-x-1 text-sm ${comment.likes.includes(userInfo?.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
              >
                <Heart className="h-4 w-4" />
                <span>{comment.likes.length}</span>
              </button>
              <button
                onClick={() => handleDislikeComment(comment._id)}
                className={`flex items-center space-x-1 text-sm ${comment.dislikes.includes(userInfo?.id) ? "text-destructive" : "text-muted-foreground"} hover:text-destructive transition-colors`}
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

  async function deletePost(postId) {
    try {
      setConfirmModalIsOpen(true)
      const confirmDeletion = await new Promise((resolve) => {
        setConfirmModalOnConfirm(() => {
          resolve(true)
          setConfirmModalIsOpen(false)
        })
      })

      if (confirmDeletion) {
        const response = await fetch(`https://mern-backend-neon.vercel.app/posts/${postId}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (response.ok) {
          console.log("Post deleted successfully")
          alert("Post deleted successfully")
          window.location.href = "/"
        } else {
          console.error("Error deleting post")
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const formatImagePath = (path) => {
    if (path.startsWith("http")) {
      return path
    }
    return `https://mern-backend-neon.vercel.app/${path.replace(/\\/g, "/")}`
  }

  return (
    <main className="py-10">
      <Container>
        <article className="max-w-3xl mx-auto">
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

