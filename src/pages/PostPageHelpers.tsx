import React from "react"
import { Button } from "../components/ui/button"
import { formatDate } from "../lib/utils"
import CommentReactions from "../components/CommentReactions"
import { Edit, Trash2, Reply, AlertCircle } from "lucide-react"
import { Comment } from "../types/PostType"

// Helper function to validate and filter comments
export const validateComments = (commentsInput: Comment[] = []) => {
  const comments = Array.isArray(commentsInput) 
    ? commentsInput.filter(comment => 
        comment && typeof comment === 'object' && comment._id && 
        comment.author && typeof comment.author === 'object')
    : []

  const commentIds = comments.map(c => c._id)
  const duplicateIds = commentIds.filter((id, index) => commentIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    console.warn('Duplicate comment IDs found:', duplicateIds)
  }
  return comments
}

// Helper function to scroll to a specific comment and highlight it
export const scrollToComment = (commentId: string): void => {
  const element = document.getElementById(`comment-${commentId}`)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
    element.classList.add("highlight")
    setTimeout(() => {
      element.classList.remove("highlight")
    }, 2000)
  }
}

// Helper function to render comment header
export const renderCommentHeader = (
  comment: Comment, 
  parentId: string | null, 
  comments: Comment[]
) => (
  <>
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
          className="text-primary hover:text-primary/80 transition-colors no-underline"
        >
          {comments.find((c) => c._id === parentId)?.author.username}
        </button>
      </div>
    )}
  </>
)

// Helper function to render comment content
export const renderCommentContent = (
  comment: Comment,
  editingComment: string | null,
  editedContent: string,
  setEditedContent: (content: string) => void,
  handleUpdateComment: (commentId: string) => void,
  setEditingComment: (commentId: string | null) => void,
  isDarkMode: boolean
) => {
  if (editingComment === comment._id) {
    return (
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
          <Button type="submit" size="sm">Update</Button>
          <Button onClick={() => setEditingComment(null)} variant="outline" size="sm">Cancel</Button>
        </div>
      </form>
    )
  }
  return <p className="text-foreground mt-1">{comment.content}</p>
}

// Helper function to render comment actions
export const renderCommentActions = (
  comment: Comment,
  userInfo: any,
  setReplyingTo: (commentId: string) => void,
  setReplyContent: (content: string) => void,
  handleEditComment: (commentId: string) => void,
  handleDeleteComment: (commentId: string) => void
) => (
  <div className="flex items-center space-x-4 mt-3">
    <CommentReactions
      commentId={comment._id}
      userId={userInfo?.id}
      initialLikes={Array.isArray(comment.likes) ? comment.likes : []}
      initialDislikes={Array.isArray(comment.dislikes) ? comment.dislikes : []}
    />
    <button
      onClick={() => {
        setReplyingTo(comment._id)
        setReplyContent("")
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
)

// Helper function to render reply form
export const renderReplyForm = (
  comment: Comment,
  replyingTo: string | null,
  replyContent: string,
  setReplyContent: (content: string) => void,
  checkReplyContent: (content: string) => void,
  replyWarnings: string[],
  handleReply: (commentId: string) => void,
  setReplyingTo: (commentId: string | null) => void,
  isDarkMode: boolean
) => {
  if (replyingTo !== comment._id) return null
  
  return (
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
        <Button type="submit" size="sm">Post Reply</Button>
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
  )
}