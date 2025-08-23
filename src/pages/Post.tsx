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
import SafeImage from "../components/SafeImage"
import { detectDarkMode, setupThemeListener } from "../lib/themeDetector"
import { useSimpleContentFilter } from "../hooks/useContentFilter"
import {
  CalendarIcon, User2, MessageCircle, Edit, Trash2,
   Heart, ThumbsDown, AlertCircle
} from "lucide-react"
import { API_ENDPOINTS } from "../config/api.config"
import AnimateOnView from "../components/AnimateOnView"
import { Post, Comment } from "../types/PostType"
import "../css/theme-overrides.css"
import TiptapRenderer from '../components/TiptapRenderer'
import { ErrorMessage, SuccessMessage } from './PostComponents'
import { useCommentManagement, usePostInteractions } from './PostPageHooks'
import {
  validateComments,
  renderCommentHeader,
  renderCommentContent,
  renderCommentActions,
  renderReplyForm
} from './PostPageHelpers'

// Helper function to extract Tiptap doc from contentBlocks
const getTiptapDoc = (blocks: any[]) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  
  const tiptapBlock = blocks.find(b => b?.type === 'tiptap')
  return tiptapBlock?.data?.doc || null
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

// Extract text from a node (flattened to avoid deep nesting)
const extractTextFromNode = (node: any): string => {
  if (!node) return ''
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  const content = Array.isArray(node.content) ? node.content : []
  return content.map(extractTextFromNode).join(' ')
}

// Visit nodes to extract headings (flattened to avoid deep nesting)
const visitNodeForHeadings = (node: any, result: { id: string; text: string; level: number }[]) => {
  if (!node) return
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level || 1)
    const text = extractTextFromNode(node).replace(/\s+/g, ' ').trim()
    const id = slugify(text)
    result.push({ id, text, level })
  }
  const content = Array.isArray(node.content) ? node.content : []
  content.forEach(child => visitNodeForHeadings(child, result))
}

const extractTiptapHeadings = (tiptapDoc: any) => {
  if (!tiptapDoc) return [] as { id: string; text: string; level: number }[]
  const result: { id: string; text: string; level: number }[] = []
  visitNodeForHeadings(tiptapDoc, result)
  return result
}

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
      return (firstCategory as any).name;
    }
    // Si c'est une chaîne de caractères, la retourner directement
    // @ts-ignore
    if (typeof firstCategory === 'string') {
      return firstCategory as any;
    }
  }

  return "Non catégorisé";
}

// Helper to extract cover image URL safely
const getCoverImageUrl = (postInfo: Post | null): string => {
  if (!postInfo) return ''
  
  const ci: any = (postInfo as any)?.coverImage
  
  if (typeof ci === 'string') {
    return ci
  }
  
  if (ci && typeof ci.url === 'string') {
    return ci.url
  }
  
  return (postInfo as any)?.cover || ''
}

// Move heavy logic out of PostPage to reduce its cognitive complexity
async function fetchPostAndSetup(params: {
  id: string | undefined,
  userInfo: { id: string } | null | undefined,
  setIsLoading: (b: boolean) => void,
  setPostInfo: (p: Post | null) => void,
  setLikes: (n: number) => void,
  setDislikes: (n: number) => void,
  setUserLiked: (b: boolean) => void,
  setUserDisliked: (b: boolean) => void,
  hasUserLiked: (likes: any, userId: string) => boolean,
  hasUserDisliked: (dislikes: any, userId: string) => boolean,
  fetchComments: () => Promise<void>,
  setErrorMessage: (msg: string) => void,
}) {
  const {
    id,
    userInfo,
    setIsLoading,
    setPostInfo,
    setLikes,
    setDislikes,
    setUserLiked,
    setUserDisliked,
    hasUserLiked,
    hasUserDisliked,
    fetchComments,
    setErrorMessage,
  } = params

  setIsLoading(true)
  try {
    const response = await fetch(API_ENDPOINTS.posts.detail(id || ''), {
      credentials: 'include',
    })
    if (!response.ok) throw new Error(`Failed to fetch post: ${response.status}`)
    
    const postData = await response.json()
    const post = postData.post || postData

    setPostInfo(post)
    setLikes(post.likes?.length || 0)
    setDislikes(post.dislikes?.length || 0)
    
    if (userInfo) {
      setUserLiked(hasUserLiked(post.likes, (userInfo as any).id))
      setUserDisliked(hasUserDisliked(post.dislikes, (userInfo as any).id))
    }
    await fetchComments()
  } catch (error: any) {
    setErrorMessage(error instanceof Error ? error.message : "Failed to load post data")
  } finally {
    setIsLoading(false)
  }
}

async function executePostDeletionApi(
  postId: string,
  setSuccessMessage: (msg: string) => void,
  setErrorMessage: (msg: string) => void,
) {
  try {
    const response = await fetch(`${API_ENDPOINTS.posts.delete(postId)}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.status}`)
    }

    setSuccessMessage("Post deleted successfully")
    setTimeout(() => { window.location.href = "/" }, 1500)
  } catch (error: any) {
    console.error("Error deleting post:", error)
    setErrorMessage(error instanceof Error ? error.message : "Failed to delete post")
  }
}

function LoadingSkeleton() {
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

function PostHero({ postInfo }: { postInfo: Post }) {
  return (
    <AnimateOnView animation="fade">
      <div className="mb-8">
        <div className="relative w-full h-[400px] bg-cover bg-center rounded-xl overflow-hidden">
          <SafeImage
            src={getCoverImageUrl(postInfo)}
            alt={(postInfo as any).title}
            className="w-full h-full object-cover"
            height={400}
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
      </div>
    </AnimateOnView>
  )
}

function PostMeta({ postInfo, commentsCount }: { postInfo: Post, commentsCount: number }) {
  return (
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
            {formatDate((postInfo as any).createdAt)}
          </time>
          <div className="text-sm text-muted-foreground flex items-center">
            <User2 className="h-4 w-4 mr-1" />
            {(postInfo as any).author?.username || "Unknown author"}
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {commentsCount} comments
          </div>
        </div>

        <H1 className="text-3xl md:text-4xl font-bold mb-4">{(postInfo as any).title}</H1>
        <P className="text-lg text-muted-foreground mb-6">{(postInfo as any).summary}</P>
      </div>
    </AnimateOnView>
  )
}

function TableOfContents({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Smooth scroll with header offset handled by scroll-mt-* on headings
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Update URL hash without jumping
      history.replaceState(null, '', `#${id}`)
    }
  }

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(ent => ent.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.1, 0.5, 1] }
    )

    const headingEls = Array.from(document.querySelectorAll('h1[id], h2[id], h3[id]'))
    headingEls.forEach(h => observer.observe(h))

    return () => observer.disconnect()
  }, [])

  return (
    <AnimateOnView animation="slide-up" delay={200}>
      <div className="table-of-contents mb-8 rounded-lg border bg-card/50 p-4">
        <h3 className="flex items-center text-sm font-semibold text-muted-foreground mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Sommaire
        </h3>
        {headings.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {headings.map((heading) => (
              <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={`block rounded px-2 py-1 hover:bg-muted/60 transition-colors ${activeId === heading.id ? 'text-primary font-medium bg-muted/60' : 'text-muted-foreground'}`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun titre trouvé dans le contenu</p>
        )}
      </div>
    </AnimateOnView>
  )
}

function ContentSection({ tiptapDoc, containerRef }: { tiptapDoc: any, containerRef: React.RefObject<HTMLDivElement> }) {
  return (
    <AnimateOnView animation="slide-up" delay={200}>
      {tiptapDoc ? (
        <div ref={containerRef} className="prose prose-green max-w-none dark:prose-invert mb-8">
          <TiptapRenderer 
            doc={tiptapDoc} 
            className="prose prose-green max-w-none dark:prose-invert"
          />
        </div>
      ) : (
        <div className="prose prose-green max-w-none dark:prose-invert mb-8">
          <p className="text-muted-foreground italic">Ce post n'a pas de contenu Tiptap disponible.</p>
        </div>
      )}
    </AnimateOnView>
  )
}

function ArticleInfoSection({ postInfo }: { postInfo: Post }) {
  return (
    <AnimateOnView animation="slide-up" delay={200}>
      <div className="bg-muted/30 rounded-lg p-4 mb-8 text-sm text-muted-foreground">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Dernière mise à jour: {formatDate(((postInfo as any).updatedAt || (postInfo as any).createdAt))}</span>
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <span>Catégorie: {getCategoryName(postInfo)}</span>
        </div>
      </div>
    </AnimateOnView>
  )
}

function InteractionBar(props: {
  likes: number,
  dislikes: number,
  userLiked: boolean,
  userDisliked: boolean,
  isLoading: boolean,
  userInfo: any,
  onLike: () => void,
  onDislike: () => void,
}) {
  const { likes, dislikes, userLiked, userDisliked, isLoading, userInfo, onLike, onDislike } = props
  return (
    <AnimateOnView animation="slide-up" delay={300}>
      <div className="flex justify-center items-center space-x-8 mb-8 border-t border-b py-6">
        <button
          onClick={onLike}
          disabled={isLoading || !userInfo}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md border ${userLiked ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" : "text-muted-foreground border-transparent hover:bg-muted/30"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""} transition-colors`}
          aria-label="J'aime cet article"
          title={!userInfo ? "Vous devez être connecté pour aimer un article" : "J'aime cet article"}
        >
          <Heart className={`h-6 w-6 ${userLiked ? "text-green-700 dark:text-green-300" : ""} ${isLoading ? "animate-pulse" : ""}`} />
          <span className="text-lg">{likes}</span>
        </button>
        <button
          onClick={onDislike}
          disabled={isLoading || !userInfo}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md border ${userDisliked ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" : "text-muted-foreground border-transparent hover:bg-muted/30"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""} transition-colors`}
          aria-label="Je n'aime pas cet article"
          title={!userInfo ? "Vous devez être connecté pour ne pas aimer un article" : "Je n'aime pas cet article"}
        >
          <ThumbsDown className={`h-6 w-6 ${userDisliked ? "text-red-700 dark:text-red-300" : ""} ${isLoading ? "animate-pulse" : ""}`} />
          <span className="text-lg">{dislikes}</span>
        </button>
      </div>
    </AnimateOnView>
  )
}

function AuthorActions({ isAuthor, postId, onDelete }: { isAuthor: boolean, postId: string, onDelete: (id: string) => void }) {
  if (!isAuthor) return null
  return (
    <AnimateOnView animation="slide-up" delay={400}>
      <div className="flex justify-center space-x-4 mb-12">
        <Link to={`/edit_page/${postId}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Post
          </Button>
        </Link>
        <Button
          variant="destructive"
          onClick={() => onDelete(postId)}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Post
        </Button>
      </div>
    </AnimateOnView>
  )
}

function CommentComposer(props: {
  username?: string,
  newComment: string,
  commentWarnings: string[],
  handleCommentSubmit: (e: React.FormEvent) => Promise<void>,
  handleCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  isDarkMode: boolean,
}) {
  const { username, newComment, commentWarnings, handleCommentSubmit, handleCommentChange, isDarkMode } = props
  return (
    <AnimateOnView animation="slide-up" delay={500}>
      <div className="bg-muted/30 rounded-xl p-6">
        <H2 className="text-2xl font-bold mb-6">Discussion</H2>

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
              onChange={handleCommentChange}
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

        {/* Placeholder for children (comments list) to be rendered by parent */}
      </div>
    </AnimateOnView>
  )
}

function renderCommentsTree({
  commentsInput = [],
  depth = 0,
  parentId = null,
  editingComment,
  editedContent,
  setEditedContent,
  handleUpdateCommentWrapper,
  setEditingComment,
  isDarkMode,
  userInfo,
  setReplyingTo,
  setReplyContent,
  handleEditComment,
  handleDeleteComment,
  replyingTo,
  replyContent,
  checkReplyContent,
  replyWarnings,
  handleReply,
}: {
  commentsInput?: Comment[],
  depth?: number,
  parentId?: string | null,
  editingComment: string | null,
  editedContent: string,
  setEditedContent: (s: string) => void,
  handleUpdateCommentWrapper: (id: string) => Promise<void>,
  setEditingComment: (id: string | null) => void,
  isDarkMode: boolean,
  userInfo: any,
  setReplyingTo: (id: string | null) => void,
  setReplyContent: (s: string) => void,
  handleEditComment: (id: string) => void,
  handleDeleteComment: (id: string) => void,
  replyingTo: string | null,
  replyContent: string,
  checkReplyContent: (s: string) => void,
  replyWarnings: string[],
  handleReply: (parentId: string) => void,
}) {
  const validatedComments = validateComments(commentsInput)

  return validatedComments.map((comment: Comment) => (
    <div
      key={`${(comment as any)._id}-${depth}`}
      id={`comment-${(comment as any)._id}`}
      className={`${depth > 0 ? "ml-8" : ""} bg-card rounded-lg shadow-sm p-4 mb-4 border`}
    >
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <img
            className="w-10 h-10 rounded-full"
            src={`https://ui-avatars.com/api/?name=${(comment as any).author.username}&background=random`}
            alt={(comment as any).author.username}
          />
        </div>
        <div className="flex-1 min-w-0">
          {renderCommentHeader(comment, parentId, validatedComments)}
          {renderCommentContent(comment, editingComment, editedContent, setEditedContent, handleUpdateCommentWrapper, setEditingComment, isDarkMode)}
          {renderCommentActions(comment, userInfo, setReplyingTo, setReplyContent, handleEditComment, handleDeleteComment)}
        </div>
      </div>
      {renderReplyForm(comment, replyingTo, replyContent, setReplyContent, checkReplyContent, replyWarnings, handleReply, setReplyingTo, isDarkMode)}
      {(comment as any).replies && Array.isArray((comment as any).replies) && (comment as any).replies.length > 0 && (
        <div className="mt-4">{renderCommentsTree({ commentsInput: (comment as any).replies, depth: depth + 1, parentId: (comment as any)._id, editingComment, editedContent, setEditedContent, handleUpdateCommentWrapper, setEditingComment, isDarkMode, userInfo, setReplyingTo, setReplyContent, handleEditComment, handleDeleteComment, replyingTo, replyContent, checkReplyContent, replyWarnings, handleReply })}</div>
      )}
    </div>
  ))
}

const PostPage = () => {
  // State for theme detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Post state
  const [postInfo, setPostInfo] = useState<Post | null>(null)

  // Comment form state
  const [newComment, setNewComment] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Extract Tiptap document from contentBlocks
  const tiptapDoc = React.useMemo(() => {
    const blocks: any[] = (postInfo as any)?.contentBlocks || []
    return getTiptapDoc(blocks)
  }, [postInfo])

  // TOC support for Tiptap: collect headings and assign ids after render
  const tiptapContainerRef = React.useRef<HTMLDivElement>(null)
  const tiptapHeadings = React.useMemo(() => {
    // Ensure unique ids in case of duplicate headings
    const raw = extractTiptapHeadings(tiptapDoc)
    const seen = new Map<string, number>()
    return raw.map(h => {
      const count = seen.get(h.id) || 0
      const uniqueId = count === 0 ? h.id : `${h.id}-${count}`
      seen.set(h.id, count + 1)
      return { ...h, id: uniqueId }
    })
  }, [tiptapDoc])

  React.useEffect(() => {
    if (!tiptapDoc || !tiptapContainerRef.current) return

    const headings = tiptapContainerRef.current.querySelectorAll('h1, h2, h3')
    const seen = new Map<string, number>()
    headings.forEach((h) => {
      const text = (h.textContent || '').replace(/\s+/g, ' ').trim()
      let baseId = slugify(text)
      const count = seen.get(baseId) || 0
      const finalId = count === 0 ? baseId : `${baseId}-${count}`
      seen.set(baseId, count + 1)
      if (finalId) (h as any).id = finalId
      // Add utility class to ensure scroll offset works even without TiptapRenderer change
      h.classList.add('scroll-mt-24')
    })
  }, [tiptapDoc])

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

  // Confirmation modal state
  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false)
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => {})

  // Context and params
  const { userInfo } = UserContext()
  const { id } = useParams<{ id: string }>()

  // Custom hooks for complex logic
  const {
    comments,
    fetchComments,
    handleCommentSubmit: handleCommentSubmitHook,
    handleUpdateComment,
    executeCommentDeletion,
    handleReply: handleReplyHook
  } = useCommentManagement(id, userInfo, filterContent, setErrorMessage, setSuccessMessage)

  const {
    likes,
    dislikes,
    userLiked,
    userDisliked,
    isLoading: postInteractionLoading,
    setLikes,
    setDislikes,
    setUserLiked,
    setUserDisliked,
    hasUserLiked,
    hasUserDisliked,
    handleLikePost,
    handleDislikePost
  } = usePostInteractions(id, userInfo, setErrorMessage, setSuccessMessage)

  // Handlers (simple wrappers)
  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => (c as any)._id === commentId)
    setEditingComment(commentId)
    setEditedContent(comment ? (comment as any).content : "")
  }

  const handleDeleteComment = async (commentId: string) => {
    const confirmAction = () => {
      executeCommentDeletion(commentId)
      setConfirmModalIsOpen(false)
    }
    setConfirmModalIsOpen(true)
    setConfirmModalOnConfirm(() => confirmAction)
  }

  const handleReply = async (parentId: string) => {
    await handleReplyHook(parentId, replyContent)
    setReplyContent("")
    setReplyingTo(null)
  }

  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    await handleCommentSubmitHook(e, newComment, parentId)
    setNewComment("")
    setReplyingTo(null)
  }

  const handleUpdateCommentWrapper = async (commentId: string) => {
    await handleUpdateComment(commentId, editedContent)
    setEditingComment(null)
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    checkCommentContent(e.target.value)
  }

  // Effect to detect theme changes
  useEffect(() => {
    setIsDarkMode(detectDarkMode())
    const cleanup = setupThemeListener(setIsDarkMode)
    return cleanup
  }, [])

  useEffect(() => {
    fetchPostAndSetup({
      id,
      userInfo: userInfo as any,
      setIsLoading,
      setPostInfo,
      setLikes,
      setDislikes,
      setUserLiked,
      setUserDisliked,
      hasUserLiked,
      hasUserDisliked,
      fetchComments,
      setErrorMessage: (msg: string) => setErrorMessage(msg),
    })
  }, [id, userInfo, fetchComments])

  const deletePost = (postId: string) => {
    const confirmAction = () => {
      setConfirmModalIsOpen(false)
      executePostDeletionApi(postId, setSuccessMessage, setErrorMessage)
    }
    setConfirmModalIsOpen(true)
    setConfirmModalOnConfirm(() => confirmAction)
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!postInfo) return null

  const username = (userInfo as any)?.username
  const userId = (userInfo as any)?.id

  // Check if the current user is the author of the post
  const isAuthor = userId && (postInfo as any)?.author?._id === userId

  
  const handleDismissError = () => setErrorMessage(null)
  const handleDismissSuccess = () => setSuccessMessage(null)

  return (
    <main className="py-10">
      <Container>
        <article className="max-w-3xl mx-auto">
          {/* Error and success messages */}
          <ErrorMessage message={errorMessage} onDismiss={handleDismissError} />
          <SuccessMessage message={successMessage} onDismiss={handleDismissSuccess} />

          <PostHero postInfo={postInfo} />
          <PostMeta postInfo={postInfo} commentsCount={comments.length} />

          <TableOfContents headings={tiptapHeadings} />
          <ContentSection tiptapDoc={tiptapDoc} containerRef={tiptapContainerRef} />
          <ArticleInfoSection postInfo={postInfo} />

          <InteractionBar
            likes={likes}
            dislikes={dislikes}
            userLiked={userLiked}
            userDisliked={userDisliked}
            isLoading={postInteractionLoading}
            userInfo={userInfo}
            onLike={handleLikePost}
            onDislike={handleDislikePost}
          />

          <AuthorActions isAuthor={Boolean(isAuthor)} postId={(postInfo as any)._id} onDelete={deletePost} />

          <AnimateOnView animation="slide-up" delay={500}>
            <div className="bg-muted/30 rounded-xl p-6">
              <H2 className="text-2xl font-bold mb-6">Discussion ({comments.length})</H2>

              <CommentComposer
                username={username}
                newComment={newComment}
                commentWarnings={commentWarnings}
                handleCommentSubmit={handleCommentSubmit as any}
                handleCommentChange={handleCommentChange}
                isDarkMode={isDarkMode}
              />

              <div className="space-y-6">
                {renderCommentsTree({
                  commentsInput: comments,
                  depth: 0,
                  parentId: null,
                  editingComment,
                  editedContent,
                  setEditedContent,
                  handleUpdateCommentWrapper,
                  setEditingComment,
                  isDarkMode,
                  userInfo,
                  setReplyingTo,
                  setReplyContent,
                  handleEditComment,
                  handleDeleteComment,
                  replyingTo,
                  replyContent,
                  checkReplyContent,
                  replyWarnings,
                  handleReply,
                })}
              </div>
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
