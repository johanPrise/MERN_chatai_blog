import { Comment } from "../types/PostType"
import { API_ENDPOINTS } from "../config/api.config"

// Helper to normalize comments data
export const normalizeComment = (c: any): Comment => {
  const normalized: any = {
    ...c,
    likes: Array.isArray(c?.likes) ? c.likes : [],
    dislikes: Array.isArray(c?.dislikes) ? c.dislikes : [],
    replies: Array.isArray(c?.replies)
      ? c.replies.map((reply: any) => normalizeComment(reply))
      : []
  }
  return normalized as Comment
}

// Helper to remove duplicate comments
export const removeDuplicateComments = (comments: Comment[]): Comment[] => {
  const seenCommentIds = new Set<string>()
  
  return comments.filter(comment => {
    if (!comment._id) return true
    if (seenCommentIds.has(comment._id)) return false
    seenCommentIds.add(comment._id)
    return true
  })
}

// Helper to process comments response
export const processCommentsResponse = (responseData: any): Comment[] => {
  const fetchedComments: Comment[] = 
    Array.isArray(responseData) ? responseData : 
    (responseData.comments && Array.isArray(responseData.comments)) ? responseData.comments : []

  const uniqueComments = removeDuplicateComments(fetchedComments)
  return uniqueComments.map(normalizeComment)
}

// Helper to sanitize comment payload
export const sanitizeCommentPayload = (
  content: string,
  postId: string,
  parentId: string | null = null
) => {
  const sanitized: { content: string, post: string, parent?: string } = {
    content,
    post: postId
  }
  if (typeof parentId === "string" && parentId.trim().length > 0) {
    sanitized.parent = parentId
  }
  return sanitized
}

// Helper to handle comment submission
export const handleCommentSubmission = async (
  content: string,
  postId: string,
  filterContent: (text: string) => any,
  parentId: string | null = null
) => {
  const filterResult = filterContent(content)
  const payload = sanitizeCommentPayload(filterResult.filteredContent, postId, parentId)
  
  const response = await fetch(API_ENDPOINTS.comments.create, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  })

  const responseData = await response.json()
  if (!response.ok) {
    throw new Error(responseData.message || "Failed to post comment")
  }

  return { filterResult, responseData }
}