"use client"

// src/pages/EditPost.tsx
import React from "react"
import { useState, useEffect, type FormEvent } from "react"
import Editor from "../components/Editor.tsx"
import { useParams, Navigate, Link } from "react-router-dom"

import { AlertCircle, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import "../css/App.css"
import "react-quill/dist/quill.snow.css"

// API configuration
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  posts: `${API_BASE_URL}/posts`
}

// Form field validation
const validateForm = (
  title: string,
  summary: string,
  content: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!title.trim()) errors.push("Title is required")
  if (!summary.trim()) errors.push("Summary is required")
  if (!content.trim()) errors.push("Content is required")

  return {
    isValid: errors.length === 0,
    errors
  }
}

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  // Form state
  const [title, setTitle] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [content, setContent] = useState<string>("")

  // UI state
  const [redirect, setRedirect] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch(`${API_ENDPOINTS.posts}/${id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.status}`)
        }

        const postInfo = await response.json()
        setTitle(postInfo.title || "")
        setSummary(postInfo.summary || "")
        setContent(postInfo.content || "")
      } catch (error) {
        console.error("Error fetching post data:", error)
        setErrorMessage("Failed to load post data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchPostData()
    }
  }, [id])

  // Handle form submission
  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()

    // Validate form
    const validation = validateForm(title, summary, content)

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    // Clear previous errors
    setValidationErrors([])
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_ENDPOINTS.posts}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, summary, content }),
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

            {/* Content editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <div className="min-h-[300px]">
                <Editor
                  onChange={setContent}
                  value={content}
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

