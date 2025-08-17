"use client"

// src/pages/EditPost.tsx
import React from "react"
import { useState, useEffect, type FormEvent } from "react"
import TiptapBlockEditor from "../features/posts/components/BlockEditor/TiptapBlockEditor"
import type { ContentBlock } from "../features/posts/types/post.types"
import { useParams, Navigate, Link } from "react-router-dom"
import { UserContext } from "../UserContext"

import { AlertCircle, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import "../css/App.css"
import { API_ENDPOINTS } from "../config/api.config"

// Form field validation
const validateForm = (
  title: string,
  summary: string,
  contentBlocks: ContentBlock[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!title.trim()) errors.push("Title is required")
  if (!summary.trim()) errors.push("Summary is required")
  if (!contentBlocks || contentBlocks.length === 0) errors.push("Content is required")

  return {
    isValid: errors.length === 0,
    errors
  }
}

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  // Utiliser le contexte utilisateur
  const { userInfo } = UserContext()

  // Form state
  const [title, setTitle] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  // Legacy markdown content kept for backward compat logging only
  const [content, setContent] = useState<string>("")
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [coverUrl, setCoverUrl] = useState<string>("")
  const [coverUrlInput, setCoverUrlInput] = useState<string>("")
  const [useUrl, setUseUrl] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // UI state
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Check if user has author or admin privileges
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState<boolean>(false)
  const [isAuthor, setIsAuthor] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Vérifier si l'utilisateur est auteur/éditeur/admin
        const authorResponse = await fetch(API_ENDPOINTS.auth.checkAuthor, {
          credentials: "include",
        })

        if (!authorResponse.ok) {
          throw new Error("Failed to verify author permissions")
        }

        const authorData = await authorResponse.json()
        console.log("Author check response:", authorData)
        setIsAuthorOrAdmin(authorData.isAuthorOrAdmin)

        // Vérifier si l'utilisateur est admin
        const adminResponse = await fetch(API_ENDPOINTS.auth.checkAdmin, {
          credentials: "include",
        })

        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          console.log("Admin check response:", adminData)
          setIsAdmin(adminData.isAdmin)
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
        setIsAuthorOrAdmin(false)
        setIsAdmin(false)
      }
    }

    checkPermissions()
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.categories.list)

        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }

        const data = await response.json()
        console.log("Categories data:", data)

        // Vérifier si data est un tableau ou s'il contient un tableau de catégories
        if (Array.isArray(data)) {
          setCategories(data)
        } else if (data && Array.isArray(data.categories)) {
          setCategories(data.categories)
        } else {
          console.error("Unexpected categories data format:", data)
          setCategories([])
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      if (!id) {
        setErrorMessage("Post ID is missing")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(API_ENDPOINTS.posts.detail(id), {
          credentials: "include" // Ajouter credentials pour l'authentification
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.status}`)
        }

        const data = await response.json()
        console.log("Post data:", data)
        console.log("API Response status:", response.status)
        console.log("API URL called:", API_ENDPOINTS.posts.detail(id))

        // Vérifier si la réponse contient un objet 'post' ou si c'est directement les données du post
        const postInfo = data.post || data

        // Vérifier si l'utilisateur est l'auteur du post
        if (postInfo && postInfo.author && postInfo.author._id && userInfo) {
          setIsAuthor(userInfo.id === postInfo.author._id)
        }

        setTitle(postInfo.title || "")
        setSummary(postInfo.summary || postInfo.excerpt || "")
        setContent(postInfo.content || "")
        setContentBlocks(postInfo.contentBlocks || [])
        setCoverUrl(postInfo.cover || "")
        setPreviewImage(postInfo.cover || null)

        // Debug logging
        console.log("Setting content for editing:", {
          contentLength: postInfo.content?.length || 0,
          hasBlocks: Array.isArray(postInfo.contentBlocks) && postInfo.contentBlocks.length > 0,
        })

        // Si le post a une catégorie, la sélectionner
        if (postInfo.category && postInfo.category._id) {
          setSelectedCategory(postInfo.category._id)
        } else if (postInfo.categories && postInfo.categories.length > 0 && postInfo.categories[0]._id) {
          setSelectedCategory(postInfo.categories[0]._id)
        }
      } catch (error) {
        console.error("Error fetching post data:", error)
        console.error("API URL:", API_ENDPOINTS.posts.detail(id))
        setErrorMessage(`Failed to load post data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    // Ne charger les données que si on a un ID
    if (id) {
      fetchPostData()
    }
  }, [id, userInfo])

  // Gestion de l'upload d'image
  const handleImageUpload = async (ev: FormEvent) => {
    const target = ev.target as HTMLInputElement
    const file = target.files ? target.files[0] : null
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file (png, jpeg, jpg, svg, webp, etc.)")
      return
    }
    // Vérification spécifique pour les SVG : viewBox doit contenir 4 nombres
    if (file.type === 'image/svg+xml') {
      const text = await file.text();
      const viewBoxMatch = text.match(/viewBox\s*=\s*"([^"]*)"/i);
      if (!viewBoxMatch) {
        alert("SVG invalide : attribut viewBox manquant.");
        return;
      }
      const viewBoxValues = viewBoxMatch[1].trim().split(/\s+/);
      if (viewBoxValues.length !== 4 || !viewBoxValues.every(v => /^-?\d*\.?\d+$/.test(v))) {
        alert("SVG invalide : l'attribut viewBox doit contenir 4 nombres (ex: '0 0 100 100').");
        return;
      }
    }
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)
    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = typeof reader.result === "string"
          ? reader.result
          : ""
        try {
          console.log("Uploading to:", API_ENDPOINTS.uploads.base64)
          console.log("Request body:", { filename: file.name, dataLength: base64String.length })
          const response = await fetch(API_ENDPOINTS.uploads.base64, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, data: base64String }),
            credentials: "include",
          })
          
          console.log("Upload response status:", response.status)
          const data = await response.json()
          console.log("Upload response data:", data)
          
          if (!response.ok) throw new Error(data.message || "Upload failed")
          
          const newImageUrl = data.url || data.filename
          setCoverUrl(newImageUrl)
          setPreviewImage(newImageUrl)
          alert("Image uploaded successfully")
        } catch (error) {
          console.error("Error uploading image:", error)
          alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        alert("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Failed to process image")
      setIsUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()

    // Vérifier si l'utilisateur a les permissions nécessaires
    if (!isAuthorOrAdmin || (!isAuthor && !isAdmin)) {
      setErrorMessage("You don't have permission to edit this post")
      return
    }

    // Validate form
    const validation = validateForm(title, summary, contentBlocks)

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    // Check if ID is available
    if (!id) {
      setErrorMessage("Post ID is missing")
      return
    }

    // Clear previous errors
    setValidationErrors([])
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    // Utiliser l'URL si le toggle est activé, sinon l'upload
    const finalCoverUrl = useUrl ? coverUrlInput : coverUrl

    try {
      // Ensure content is in markdown format
      // The Editor component now handles the conversion from HTML to Markdown

      console.log("Sending update request with data:", {
        title,
        summary,
        content: '',
        contentBlocks,
        cover: finalCoverUrl,
        category: selectedCategory
      })

      const response = await fetch(API_ENDPOINTS.posts.update(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          summary,
          content: '',
          contentBlocks,
          cover: finalCoverUrl,
          category: selectedCategory
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update post")
      }

      // Show success message
      setSuccessMessage("Post updated successfully!")

      // Redirect after a short delay
      setTimeout(() => {
        setRedirect(true)
      }, 1500)
    } catch (error) {
      console.error("Error updating post:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if not logged in
  if (!userInfo) {
    return <Navigate to="/login" />
  }

  // Redirect after successful update
  if (redirect) {
    return <Navigate to={`/Post/${id}`} />
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to={`/Post/${id}`}
            className="flex items-center text-sm text-gray-600 hover:text-lime-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Post
          </Link>
        </div>

        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl mb-6">Update your post</h1>

        {/* Error message */}
        {errorMessage && (
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
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-lime-600" />
            <p className="mt-4 text-gray-500">Loading post data...</p>
          </div>
        ) : (
          /* Edit form */
          <form onSubmit={handleSubmit} className="mb-0 mt-6 bg-white space-y-6 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm font-medium mb-1">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Cover image upload ou URL */}
            <div>
              <label htmlFor="cover" className="mb-2 block text-sm font-medium text-gray-900">Cover Image</label>
              <div className="flex items-center gap-4 mb-2">
                <button type="button" className={`px-3 py-1 rounded ${!useUrl ? 'bg-lime-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseUrl(false)}>Upload</button>
                <button type="button" className={`px-3 py-1 rounded ${useUrl ? 'bg-lime-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseUrl(true)}>Lien URL</button>
              </div>
              {!useUrl ? (
                <input
                  id="cover"
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100"
                />
              ) : (
                <input
                  id="cover-url"
                  type="url"
                  placeholder="https://..."
                  value={coverUrlInput}
                  onChange={e => setCoverUrlInput(e.target.value)}
                  className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
                />
              )}
              {isUploading && !useUrl && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-lime-600 h-2.5 rounded-full w-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Uploading image...</p>
                </div>
              )}
              {((previewImage && !useUrl) || (useUrl && coverUrlInput)) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 mb-1">Image preview:</p>
                  <img
                    src={useUrl ? coverUrlInput : previewImage || undefined}
                    alt="Preview"
                    className="mt-2 max-w-full h-auto max-h-40 rounded-md"
                  />
                </div>
              )}
            </div>
            {/* Title field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter your Title"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Summary field */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Summary
              </label>
              <input
                id="summary"
                type="text"
                placeholder="Enter your Summary"
                value={summary}
                onChange={(ev) => setSummary(ev.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Category selector */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <div className="min-h-[300px]">
                <TiptapBlockEditor
                  value={contentBlocks}
                  onChange={setContentBlocks}
                  placeholder="Write your post with formatting, images, and links..."
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full rounded-lg bg-lime-600 px-5 py-3 text-sm font-medium text-white hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </span>
              ) : (
                "Update Post"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditPost

