"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { UserContext } from "../UserContext"
import ConfirmationModal from "../components/ConfirmationModal"
import { Container } from "../components/ui/container"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { H1, H2, P } from "../components/ui/typography"
import { formatDate } from "../lib/utils"
import PostImage from "../components/PostImage"
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
import { useGlobalStateEvent, globalStateManager } from '../services/globalStateManager'
import { enhancedNavigationService } from '../services/enhancedNavigationService'

// Helper function to extract Tiptap doc from contentBlocks
const getTiptapDoc = (blocks: any[]) => {
  console.log('[getTiptapDoc] Input blocks:', blocks)
  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.log('[getTiptapDoc] No blocks found')
    return null
  }
  
  const tiptapBlock = blocks.find(b => b?.type === 'tiptap')
  console.log('[getTiptapDoc] Found tiptap block:', tiptapBlock)
  const doc = tiptapBlock?.data?.doc || null
  console.log('[getTiptapDoc] Extracted doc:', doc)
  return doc
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

// Helper to extract cover image URL safely (supports both string and object formats)
const getCoverImageUrl = (postInfo: Post | null): string => {
  if (!postInfo) return ''
  
  const ci: any = (postInfo as any)?.coverImage
  
  if (typeof ci === 'string') {
    // Handle legacy string format
    return ci
  }
  
  if (ci && typeof ci === 'object' && typeof ci.url === 'string') {
    // Handle new object format
    return ci.url
  }
  
  // Fallback to legacy cover field
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
  fetchUrl?: string,
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
    fetchUrl
  } = params

  setIsLoading(true)
  try {
    const url = fetchUrl || API_ENDPOINTS.posts.detail(id || '')
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-cache'
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
    
    // Use enhanced navigation service for smart deletion handling
    setTimeout(() => {
      enhancedNavigationService.handlePostDeletionNavigation(postId)
    }, 1500)
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
      <div className="mb-12">
        <div className="relative w-full h-[500px] bg-cover bg-center rounded-2xl overflow-hidden shadow-2xl">
          <PostImage
            src={getCoverImageUrl(postInfo)}
            alt={(postInfo as any).title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          {/* Subtle glass effect overlay */}
          <div className="absolute inset-0 backdrop-blur-[0.5px] bg-gradient-to-t from-transparent via-white/5 to-white/10"></div>
        </div>
      </div>
    </AnimateOnView>
  )
}

function PostMeta({ postInfo, commentsCount }: { postInfo: Post, commentsCount: number }) {
  return (
    <AnimateOnView animation="slide-up" delay={100}>
      <div className="mb-12">
        {/* Enhanced meta information bar */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-gradient-to-r from-card via-card/95 to-card/90 border border-border/50 shadow-sm">
          <Badge
            variant="outline"
            className="badge-outline bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors shadow-sm px-3 py-1.5 font-medium"
          >
            {getCategoryName(postInfo)}
          </Badge>
          <time className="text-sm text-muted-foreground flex items-center bg-muted/50 px-3 py-1.5 rounded-lg">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formatDate((postInfo as any).createdAt)}
          </time>
          <div className="text-sm text-muted-foreground flex items-center bg-muted/50 px-3 py-1.5 rounded-lg">
            <User2 className="h-4 w-4 mr-2" />
            {(postInfo as any).author?.username || "Unknown author"}
          </div>
          <div className="text-sm text-muted-foreground flex items-center bg-muted/50 px-3 py-1.5 rounded-lg">
            <MessageCircle className="h-4 w-4 mr-2" />
            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </div>
        </div>

        {/* Enhanced title with gradient */}
        <H1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          {(postInfo as any).title}
        </H1>
        
        {/* Enhanced summary */}
        <div className="relative p-6 rounded-xl bg-gradient-to-br from-muted/30 via-card to-muted/20 border border-border/30">
          <P className="text-lg leading-relaxed text-muted-foreground mb-0">
            {(postInfo as any).summary}
          </P>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-l-xl"></div>
        </div>
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
      <div className="table-of-contents mb-12">
        {/* Unified background design */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
          <h3 className="flex items-center text-lg font-semibold text-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Sommaire
          </h3>
          {headings.length > 0 ? (
            <ul className="space-y-2">
              {headings.map((heading) => (
                <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => handleClick(e, heading.id)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      activeId === heading.id 
                        ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Aucun titre trouvé dans le contenu</p>
          )}
        </div>
      </div>
    </AnimateOnView>
  )
}

function ContentSection({ tiptapDoc, containerRef }: { tiptapDoc: any, containerRef: React.RefObject<HTMLDivElement> }) {
  return (
    <AnimateOnView animation="slide-up" delay={200}>
      {tiptapDoc ? (
        <article className="mb-12">
          {/* Unified background for content */}
          <div className="p-8 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
            <div ref={containerRef} className="prose prose-green max-w-none dark:prose-invert">
              <TiptapRenderer 
                doc={tiptapDoc} 
                className="prose prose-green max-w-none dark:prose-invert"
              />
            </div>
          </div>
        </article>
      ) : (
        <div className="mb-12 p-8 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
          <div className="prose prose-green max-w-none dark:prose-invert">
            <p className="text-muted-foreground italic flex items-center justify-center gap-2 py-8">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ce post n'a pas de contenu Tiptap disponible.
            </p>
          </div>
        </div>
      )}
    </AnimateOnView>
  )
}

function ArticleInfoSection({ postInfo }: { postInfo: Post }) {
  return (
    <AnimateOnView animation="slide-up" delay={200}>
      <div className="mb-12">
        {/* Unified design with consistent background */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Informations sur l'article</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-3 rounded-lg bg-muted/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                <p className="text-sm text-foreground truncate">{formatDate(((postInfo as any).updatedAt || (postInfo as any).createdAt))}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 rounded-lg bg-muted/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                <p className="text-sm text-foreground truncate">{getCategoryName(postInfo)}</p>
              </div>
            </div>
          </div>
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
      <div className="mb-12">
        {/* Enhanced interaction bar with unified design */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Like button */}
            <button
              onClick={onLike}
              disabled={isLoading || !userInfo}
              className={`group flex items-center space-x-3 px-6 py-3 rounded-xl border-2 transition-all duration-300 ${
                userLiked 
                  ? "bg-green-50 text-green-700 border-green-200 shadow-lg shadow-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:shadow-green-900/20" 
                  : "bg-background text-muted-foreground border-border hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg hover:shadow-green-100 dark:hover:bg-green-900/20 dark:hover:border-green-700"
              } ${
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${!userInfo ? "opacity-60 cursor-not-allowed" : ""}`}
              aria-label="J'aime cet article"
              title={!userInfo ? "Vous devez être connecté pour aimer un article" : "J'aime cet article"}
            >
              <Heart className={`h-6 w-6 transition-all duration-300 ${
                userLiked ? "text-green-600 dark:text-green-400 scale-110" : "group-hover:scale-110"
              } ${isLoading ? "animate-pulse" : ""}`} 
              fill={userLiked ? "currentColor" : "none"} />
              <div className="flex flex-col items-start">
                <span className="text-xl font-bold">{likes}</span>
                <span className="text-xs uppercase tracking-wide font-medium">J'aime</span>
              </div>
            </button>
            
            {/* Separator */}
            <div className="w-px h-12 bg-border hidden sm:block"></div>
            <div className="w-12 h-px bg-border sm:hidden"></div>
            
            {/* Dislike button */}
            <button
              onClick={onDislike}
              disabled={isLoading || !userInfo}
              className={`group flex items-center space-x-3 px-6 py-3 rounded-xl border-2 transition-all duration-300 ${
                userDisliked 
                  ? "bg-red-50 text-red-700 border-red-200 shadow-lg shadow-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:shadow-red-900/20" 
                  : "bg-background text-muted-foreground border-border hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-lg hover:shadow-red-100 dark:hover:bg-red-900/20 dark:hover:border-red-700"
              } ${
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${!userInfo ? "opacity-60 cursor-not-allowed" : ""}`}
              aria-label="Je n'aime pas cet article"
              title={!userInfo ? "Vous devez être connecté pour ne pas aimer un article" : "Je n'aime pas cet article"}
            >
              <ThumbsDown className={`h-6 w-6 transition-all duration-300 ${
                userDisliked ? "text-red-600 dark:text-red-400 scale-110" : "group-hover:scale-110"
              } ${isLoading ? "animate-pulse" : ""}`}
              fill={userDisliked ? "currentColor" : "none"} />
              <div className="flex flex-col items-start">
                <span className="text-xl font-bold">{dislikes}</span>
                <span className="text-xs uppercase tracking-wide font-medium">Pas d'accord</span>
              </div>
            </button>
          </div>
          
          {!userInfo && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-center text-sm text-muted-foreground">
                <a href="/login_page" className="text-primary font-medium hover:underline">
                  Connectez-vous
                </a> pour interagir avec cet article
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimateOnView>
  )
}

function AuthorActions({ isAuthor, postId, onDelete }: { isAuthor: boolean, postId: string, onDelete: (id: string) => void }) {
  if (!isAuthor) return null
  return (
    <AnimateOnView animation="slide-up" delay={400}>
      <div className="flex justify-center space-x-4 mb-12">
        <Link to={`/posts/edit/${postId}`}>
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
      {/* Unified background design for comments section */}
      <div className="p-8 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <H2 className="text-2xl font-bold text-foreground mb-0">Discussion</H2>
        </div>

        {username ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="relative">
              <textarea
                className="w-full p-4 border-2 rounded-xl resize-none min-h-[150px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-background"
                style={{
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                  color: isDarkMode ? '#e0e0e0' : '#000000',
                  borderColor: isDarkMode ? '#3a3a3a' : '#e5e7eb'
                }}
                placeholder="Partagez vos impressions sur cet article..."
                value={newComment}
                onChange={handleCommentChange}
                required
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {newComment.length}/1000
              </div>
            </div>
            
            {commentWarnings.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Le contenu pourrait être filtré : {commentWarnings.join(', ')}</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button 
                type="submit" 
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Publier le commentaire
              </Button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-muted-foreground mb-4">
                Rejoignez la discussion et partagez vos idées
              </p>
              <Link 
                to="/login_page" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-200 no-underline shadow-lg hover:shadow-xl"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se connecter pour commenter
              </Link>
            </div>
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
      className={`${depth > 0 ? "ml-6" : ""} bg-gradient-to-br from-card via-card/98 to-card/95 rounded-xl shadow-sm p-6 mb-4 border border-border/30 hover:shadow-md transition-all duration-200`}
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
    console.log('[PostPage] ContentBlocks:', blocks)
    const doc = getTiptapDoc(blocks)
    console.log('[PostPage] TiptapDoc:', doc)
    return doc
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
  const [searchParams] = useSearchParams() // Add this to detect URL changes
  const updatedParam = searchParams.get('updated') // Detect the updated parameter

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

  // Function to manually refresh post data
  const refreshPostData = useCallback(() => {
    console.log('[PostPage] Manual refresh triggered');
    setIsLoading(true);
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
    });
  }, [id, userInfo, fetchComments]);

  // Expose refresh function to window for debugging (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).refreshPost = refreshPostData;
    }
  }, [refreshPostData]);

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

  // Subscribe to global post updates for real-time synchronization
  useGlobalStateEvent('POST_UPDATED', useCallback(({ postId, postData }) => {
    if (postId === id && postInfo) {
      console.log('[PostPage] Received global post update:', { postId, hasData: !!postData })
      // Update local post info with fresh data from global state
      setPostInfo(prevInfo => prevInfo ? { ...prevInfo, ...postData } : null)
    }
  }, [id, postInfo]))

  // Main effect to load post data with enhanced cache invalidation
  useEffect(() => {
    console.log('[PostPage] Loading post data:', {
      id,
      userInfo: userInfo?.username,
      updatedParam,
      refreshedParam: searchParams.get('refreshed'),
      timestamp: new Date().toISOString()
    });
    
    // Force fresh data by adding cache-busting parameter
    const fetchUrl = `${API_ENDPOINTS.posts.detail(id || '')}?_t=${Date.now()}`;
    
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
      fetchUrl
    })
  }, [id, userInfo, fetchComments, updatedParam, searchParams.get('refreshed')]) // Enhanced dependencies for cache invalidation

  // Enhanced delete function with global state coordination
  const deletePost = useCallback((postId: string) => {
    const confirmAction = () => {
      setConfirmModalIsOpen(false)
      executePostDeletionApi(postId, setSuccessMessage, setErrorMessage)
    }
    setConfirmModalIsOpen(true)
    setConfirmModalOnConfirm(() => confirmAction)
  }, [])

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
            <div className="p-8 rounded-xl bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/30 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <H2 className="text-2xl font-bold text-foreground mb-0">Discussion ({comments.length})</H2>
              </div>

              <CommentComposer
                username={username}
                newComment={newComment}
                commentWarnings={commentWarnings}
                handleCommentSubmit={handleCommentSubmit as any}
                handleCommentChange={handleCommentChange}
                isDarkMode={isDarkMode}
              />

              <div className="space-y-6 mt-8">
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
