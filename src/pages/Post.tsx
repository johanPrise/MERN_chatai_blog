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
import "../css/markdown.css"
// Import highlight.js for syntax highlighting
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// Helper to extract the category name safely
const getCategoryName = (post: Post | null): string => {
  if (!post) return "Uncategorized"

  // Utiliser category s'il existe, sinon prendre la première catégorie du tableau categories
  // @ts-ignore - Ignorer l'erreur TypeScript car categories n'est pas dans le type
  const categoryFromArray = post.categories && post.categories.length > 0 ? post.categories[0] : null
  const category = post.category || categoryFromArray

  // Debug: Log the category data
  console.log("Post category data:", category)
  console.log("Categories array:", (post as any).categories)

  if (!category || typeof category !== "object") return "Uncategorized"
  return category.name || "Uncategorized"
}

// Action states
interface ActionState {
  status: ActionStatus
  error: string | null
}

interface CommentActionStates {
  [commentId: string]: ActionState
}

// Import API configuration
import { API_BASE_URL, API_ENDPOINTS } from "../config/api.config"


const PostPage = () => {
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
      const response = await fetch(`${API_ENDPOINTS.comments.list}/post/${id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const fetchedCommentsRaw = await response.json()
      const fetchedComments: Comment[] = Array.isArray(fetchedCommentsRaw) ? fetchedCommentsRaw : []
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch comments")
    }
  }, [id])

  /**
   * Format content with enhanced styling and syntax highlighting
   * @param content - Content to format (can be Markdown or HTML)
   * @returns Formatted HTML string
   */
  const formatContent = (content: string): string => {
    // Vérifier si le contenu est déjà du HTML ou du Markdown
    const isHTML = content.trim().startsWith('<') && content.includes('</');

    let htmlContent = content;

    // Si ce n'est pas du HTML, on considère que c'est du Markdown
    // et on le convertit en HTML en utilisant une approche améliorée
    if (!isHTML) {
      // Préserver les blocs de code pour le traitement ultérieur
      const codeBlocks: Array<{language: string, code: string}> = [];

      // Extraire les blocs de code avec leur langage
      htmlContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
        const id = codeBlocks.length;
        codeBlocks.push({ language, code });
        return `CODEBLOCK${id}`;
      });

      // Conversion améliorée de Markdown en HTML
      htmlContent = htmlContent
        // Convertir les titres avec ancres pour la navigation
        .replace(/^# (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h1 id="${id}">${title}</h1>`;
        })
        .replace(/^## (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h2 id="${id}">${title}</h2>`;
        })
        .replace(/^### (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h3 id="${id}">${title}</h3>`;
        })
        .replace(/^#### (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h4 id="${id}">${title}</h4>`;
        })
        .replace(/^##### (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h5 id="${id}">${title}</h5>`;
        })
        .replace(/^###### (.*$)/gm, (match, title) => {
          const id = title.toLowerCase().replace(/[^\w]+/g, '-');
          return `<h6 id="${id}">${title}</h6>`;
        })

        // Convertir les paragraphes (lignes non vides qui ne sont pas des titres)
        .replace(/^(?!<h[1-6]>)(.*$)/gm, function(match) {
          return match.trim() ? '<p>' + match + '</p>' : match;
        })

        // Convertir les listes non ordonnées
        .replace(/^[\*\-] (.*$)/gm, '<li>$1</li>')

        // Convertir les listes ordonnées
        .replace(/^(\d+)\. (.*$)/gm, '<li value="$1">$2</li>')

        // Entourer les listes avec <ul> ou <ol>
        .replace(/(<li value="[0-9]+".*<\/li>)\n(?!<li value="[0-9]+")/g, '$1</ol>')
        .replace(/(?<!<\/ol>)\n(<li value="[0-9]+")/g, '<ol>$1')
        .replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ul>')
        .replace(/(?<!<\/ul>)\n(<li>)/g, '<ul>$1')

        // Convertir le texte en gras
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')

        // Convertir le texte en italique (en évitant les conflits avec le gras)
        .replace(/(?<!\*)\*(?!\*)([^\*]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, '<em>$1</em>')

        // Convertir le texte barré
        .replace(/~~(.*?)~~/g, '<del>$1</del>')

        // Convertir les liens
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

        // Convertir les images avec attributs alt et title
        .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, alt, src, title) => {
          return `<img alt="${alt || ''}" src="${src}" ${title ? `title="${title}"` : ''} loading="lazy" />`;
        })

        // Convertir les citations
        .replace(/^>\s*(.*$)/gm, '<blockquote>$1</blockquote>')

        // Convertir les séparateurs horizontaux
        .replace(/^---+$/gm, '<hr />')

        // Convertir les sauts de ligne
        .replace(/\n\n/g, '<br /><br />');

      // Réinsérer les blocs de code avec coloration syntaxique
      htmlContent = htmlContent.replace(/CODEBLOCK(\d+)/g, (match, id) => {
        try {
          const blockId = parseInt(id, 10);
          if (blockId >= 0 && blockId < codeBlocks.length) {
            const { language, code } = codeBlocks[blockId];
            let highlightedCode;

            try {
              // Vérifier si highlight.js est disponible
              if (typeof hljs !== 'undefined' && hljs !== null && typeof hljs.highlight === 'function') {
                // Essayer d'appliquer la coloration syntaxique
                highlightedCode = language && language.trim() !== ''
                  ? hljs.highlight(code.trim(), { language }).value
                  : hljs.highlightAuto(code.trim()).value;
              } else {
                throw new Error("highlight.js n'est pas disponible");
              }
            } catch (e) {
              console.error("Erreur lors de la coloration syntaxique:", e);
              // Échapper le HTML pour l'afficher tel quel
              highlightedCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            }

            return `<pre><code class="language-${language || 'plaintext'}">${highlightedCode}</code></pre>`;
          } else {
            console.error(`Bloc de code avec ID ${id} non trouvé`);
            return match; // Retourner le texte original si l'ID n'est pas valide
          }
        } catch (error) {
          console.error("Erreur lors du traitement du bloc de code:", error);
          return `<pre><code>Erreur lors du traitement du bloc de code</code></pre>`;
        }
      });

      // Convertir les blocs de code inline
      htmlContent = htmlContent.replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${code}</code>`;
      });

      // Méthode alternative pour les blocs de code si la première méthode échoue
      if (htmlContent.includes("CODEBLOCK")) {
        console.warn("Détection de blocs de code non traités, application de la méthode alternative");

        // Traiter directement les blocs de code sans extraction préalable
        htmlContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
          try {
            // Échapper le HTML pour l'afficher tel quel
            const escapedCode = code
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");

            return `<pre><code class="language-${language || 'plaintext'}">${escapedCode}</code></pre>`;
          } catch (error) {
            console.error("Erreur lors du traitement direct du bloc de code:", error);
            return `<pre><code>${code}</code></pre>`;
          }
        });
      }
    }

    // Maintenant, on traite le HTML pour améliorer le style
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")

    // Ajouter des attributs data-aos pour les animations au défilement
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading, index) => {
      heading.setAttribute("data-aos", "fade-up");
      heading.setAttribute("data-aos-delay", `${index * 50}`);
      heading.setAttribute("data-aos-duration", "800");
    });

    // Ajouter des attributs data-aos pour les images
    doc.querySelectorAll("img").forEach((img, index) => {
      img.setAttribute("data-aos", "zoom-in");
      img.setAttribute("data-aos-delay", `${index * 100}`);
      img.setAttribute("data-aos-duration", "1000");

      // Ajouter une classe pour le zoom au clic
      img.classList.add("zoomable");
      img.addEventListener("click", () => {
        img.classList.toggle("zoomed");
      });
    });

    // Ajouter des attributs data-aos pour les blocs de code
    doc.querySelectorAll("pre").forEach((pre, index) => {
      pre.setAttribute("data-aos", "fade-up");
      pre.setAttribute("data-aos-delay", `${index * 50}`);
    });

    // Ajouter des attributs data-aos pour les citations
    doc.querySelectorAll("blockquote").forEach((quote, index) => {
      quote.setAttribute("data-aos", "fade-right");
      quote.setAttribute("data-aos-delay", `${index * 50}`);
    });

    // Ajouter des numéros de ligne aux blocs de code
    doc.querySelectorAll("pre code").forEach((codeBlock) => {
      const code = codeBlock.textContent || "";
      const lines = code.split("\n");
      let numberedCode = "";

      lines.forEach((line, index) => {
        if (index === lines.length - 1 && !line.trim()) return;
        numberedCode += `<div class="code-line"><span class="line-number">${index + 1}</span>${line}</div>`;
      });

      codeBlock.innerHTML = numberedCode;
    });

    // Ajouter des liens aux titres pour permettre le partage direct
    doc.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]").forEach((heading) => {
      const id = heading.getAttribute("id");
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.className = "heading-link";
      link.innerHTML = "#";
      link.title = "Lien direct vers cette section";
      heading.appendChild(link);
    });

    // Ajouter des styles pour les tableaux si présents
    doc.querySelectorAll("table").forEach((table) => {
      table.classList.add("markdown-table");
    });

    return doc.body.innerHTML;
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
      const response = await fetch(`${API_ENDPOINTS.comments.like(commentId)}`, {
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
      const response = await fetch(`${API_ENDPOINTS.comments.unlike(commentId)}`, {
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

    updateCommentActionState(parentId, "loading")
    setIsSubmittingComment(true)

    try {
      const payload = sanitizeCommentPayload(replyContent, id || "", parentId)
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

      // Process the reply data
      if (responseData && responseData.comment) {
        // Make sure the comment has the required properties
        const newReply = {
          ...responseData.comment,
          likes: responseData.comment.likes || [],
          dislikes: responseData.comment.dislikes || []
        }

        // Find the parent comment and add this reply to it
        setComments(prevComments => {
          // Create a deep copy of the comments array
          const updatedComments = [...prevComments]

          // Find the parent comment
          const parentComment = updatedComments.find(comment => comment._id === parentId)

          if (parentComment) {
            // Initialize replies array if it doesn't exist
            if (!parentComment.replies) {
              parentComment.replies = []
            }

            // Add the new reply to the parent's replies
            parentComment.replies = [newReply, ...parentComment.replies]
          } else {
            // If parent comment not found, add as a new comment
            updatedComments.push(newReply)
          }

          return updatedComments
        })
      } else {
        // Fallback to fetching all comments if the response doesn't include the new reply
        console.log("Reply created but no comment data returned, fetching all comments")
        await fetchComments()
      }

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
      // Use sanitized payload - no complex objects, no event objects, no parent objects
      const payload = sanitizeCommentPayload(newComment, id || "", parentId)
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

      // Process the comment data
      if (responseData && responseData.comment) {
        // Make sure the comment has the required properties
        const newComment = {
          ...responseData.comment,
          likes: responseData.comment.likes || [],
          dislikes: responseData.comment.dislikes || []
        }

        // Add the new comment to the beginning of the array (most recent first)
        setComments(prevComments => [newComment, ...prevComments])
      } else {
        // Fallback to fetching all comments if the response doesn't include the new comment
        console.log("Comment created but no comment data returned, fetching all comments")
        await fetchComments()
      }

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
          setUserLiked(post.likes?.includes(userInfo.id))
          setUserDisliked(post.dislikes?.includes(userInfo.id))
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

  const handleLikePost = async () => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to like a post")
      return
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.posts.detail(id || '')}/like`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes.length)
        setDislikes(data.dislikes.length)
        setUserLiked(data.likes.includes(userInfo.id))
        setUserDisliked(data.dislikes.includes(userInfo.id))
        setSuccessMessage("Post liked successfully")

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (error) {
      console.error("Error liking post:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to like post")
    }
  }

  const handleDislikePost = async () => {
    if (!userInfo) {
      setErrorMessage("You must be logged in to dislike a post")
      return
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.posts.detail(id || '')}/dislike`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes.length)
        setDislikes(data.dislikes.length)
        setUserLiked(data.likes.includes(userInfo.id))
        setUserDisliked(data.dislikes.includes(userInfo.id))
        setSuccessMessage("Post disliked successfully")

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (error) {
      console.error("Error disliking post:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to dislike post")
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
    // Defensive: always use an array
    const comments = Array.isArray(commentsInput) ? commentsInput : []
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
                className={`flex items-center space-x-1 text-sm ${userInfo?.id && Array.isArray(comment.likes) && comment.likes.includes(userInfo.id) ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
              >
                <Heart className="h-4 w-4" />
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
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-3 border rounded-md text-sm resize-none min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
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
                  src={formatImagePath(postInfo.cover)}
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

