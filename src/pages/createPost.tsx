"use client"

// src/pages/CreatePost.tsx
import React from "react"
import { useState, type FormEvent, useEffect } from "react"
import ReactQuill from "react-quill"
import { Navigate } from "react-router-dom"
import "react-quill/dist/quill.snow.css"
import "../css/App.css"
import { API_ENDPOINTS } from "../config/api.config"

// Editor configuration
const EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link", "image"],
    ["clean"],
  ],
}

const EDITOR_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
]

// Form field validation
const validateForm = (
  title: string,
  summary: string,
  content: string,
  category: string,
  coverUrl: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!title.trim()) errors.push("Title is required")
  if (!summary.trim()) errors.push("Summary is required")
  if (!content.trim()) errors.push("Content is required")
  if (!category) errors.push("Category is required")
  if (!coverUrl) errors.push("Cover image is required")

  return {
    isValid: errors.length === 0,
    errors
  }
}

const CreatePost: React.FC = () => {
  // Form state
  const [title, setTitle] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [featured, setFeatured] = useState<boolean>(false)
  const [coverUrl, setCoverUrl] = useState<string>("")
  const [coverUrlInput, setCoverUrlInput] = useState<string>("") // Nouveau champ pour l'URL
  const [useUrl, setUseUrl] = useState<boolean>(false) // Toggle entre upload et URL

  // UI state
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Data state
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])

  // Check if user has author or admin privileges
  useEffect(() => {
    const checkAuthorAdminStatus = async () => {
      try {
        // Utiliser la route dédiée pour vérifier les permissions d'auteur/éditeur/admin
        const response = await fetch(API_ENDPOINTS.auth.checkAuthor, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to verify permissions")
        }

        const data = await response.json()
        console.log("Author check response:", data)
        setIsAuthorOrAdmin(data.isAuthorOrAdmin)
      } catch (error) {
        console.error("Error checking author/admin status:", error)
        setIsAuthorOrAdmin(false)
        alert("Failed to verify your permissions")
      }
    }

    checkAuthorAdminStatus()
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
        console.log("Categories response:", data)

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
        alert("Failed to load categories")
      }
    }

    fetchCategories()
  }, [])

  // Handle image upload
  const handleImageUpload = async (ev: FormEvent) => {
    const target = ev.target as HTMLInputElement
    const file = target.files ? target.files[0] : null

    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)

    setIsUploading(true)

    try {
      // Read file as base64
      const reader = new FileReader()

      reader.onloadend = async () => {
        const base64String = typeof reader.result === "string"
          ? reader.result.replace(/^data:.+;base64,/, "")
          : ""

        try {
          const response = await fetch(API_ENDPOINTS.uploads.base64, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              data: base64String,
            }),
            credentials: "include",
          })

          if (!response.ok) {
            throw new Error("Upload failed")
          }

          const data = await response.json()
          setCoverUrl(data.url)
          alert("Image uploaded successfully")
        } catch (error) {
          console.error("Error uploading image:", error)
          alert("Failed to upload image")
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

    // Utiliser l'URL si le toggle est activé, sinon l'upload
    const finalCoverUrl = useUrl ? coverUrlInput : coverUrl

    // Validate form
    const validation = validateForm(title, summary, content, selectedCategory, finalCoverUrl)

    if (!validation.isValid) {
      alert(validation.errors.join('\n'))
      return
    }

    setIsSubmitting(true)

    try {
      // Préparer les données du post
      const postData = {
        title,
        summary,
        content,
        categories: selectedCategory ? [selectedCategory] : [], // Envoyer comme tableau pour correspondre à l'attente du backend
        category: selectedCategory, // Envoyer aussi comme champ unique pour compatibilité
        featured: featured ? "true" : "false",
        cover: finalCoverUrl,
      }

      // Debug: Afficher les données envoyées
      console.log("Sending post data:", postData)

      const response = await fetch(API_ENDPOINTS.posts.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Post creation failed")
      }

      const data = await response.json()
      console.log("Post created:", data)
      alert("Post created successfully!")

      // Reset form
      setTitle("")
      setSummary("")
      setContent("")
      setCoverUrl("")
      setSelectedCategory("")
      setFeatured(false)
      setPreviewImage(null)

      // Redirect to home page after successful creation
      setTimeout(() => setRedirect(true), 2000)
    } catch (error) {
      console.error("Error creating post:", error)
      alert(error instanceof Error ? error.message : "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect after successful post creation
  if (redirect) {
    return <Navigate to="/" />
  }

  // Access denied view
  if (!isAuthorOrAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Accès Non Autorisé</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            Cette page est réservée aux auteurs et administrateurs. Veuillez vous connecter avec un compte approprié.
          </p>
        </div>
      </div>
    )
  }

  // Main form view
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">Create a New Post</h1>

        <form onSubmit={handleSubmit} className="mb-0 mt-6 space-y-4 bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          {/* Title field */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-900">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter your Title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              required
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
            />
          </div>

          {/* Summary field */}
          <div>
            <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-900">Summary</label>
            <input
              id="summary"
              type="text"
              placeholder="Enter your Summary"
              value={summary}
              onChange={(ev) => setSummary(ev.target.value)}
              required
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
            />
          </div>

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

          {/* Content editor */}
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-900">Content</label>
            <ReactQuill
              id="content"
              value={content}
              modules={EDITOR_MODULES}
              formats={EDITOR_FORMATS}
              onChange={(newValue) => setContent(newValue)}
              className="w-full rounded-lg border-gray-200 shadow-sm min-h-[200px]"
            />
          </div>

          {/* Category selection */}
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-900">Category</label>
            <select
              id="category"
              title="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Featured post checkbox */}
          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">Featured Post</label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isUploading || isSubmitting}
            className="block w-full rounded-lg bg-lime-600 px-5 py-3 text-sm font-medium text-white hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating post..." : "Create your post"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
