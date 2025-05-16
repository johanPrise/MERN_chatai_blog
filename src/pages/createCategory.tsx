"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import "../css/App.css"
import { UserContext } from "../UserContext"
import { AlertCircle, CheckCircle, ArrowLeft, Trash2 } from "lucide-react"
import { CategoryFormData } from "../types/CategoryFormData"
import { API_ENDPOINTS } from "../config/api.config"

// Quill editor configuration
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link"],
    ["clean"],
  ],
}

const QUILL_FORMATS = [
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
]

const CreateCategory: React.FC = () => {
  // State management
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: ""
  })
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Hooks
  const navigate = useNavigate()
  const { userInfo } = UserContext()

  // Check if user is author or admin
  const checkAuthorAdminStatus = useCallback(async () => {
    setIsChecking(true)

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
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Check permissions on component mount
  useEffect(() => {
    checkAuthorAdminStatus()
  }, [checkAuthorAdminStatus])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Reset status when user starts typing
    if (status !== "idle") {
      setStatus("idle")
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }

  // Handle rich text editor changes
  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }))

    // Reset status when user starts typing
    if (status !== "idle") {
      setStatus("idle")
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }

  // Create new category
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    if (!formData.name.trim()) {
      setStatus("error")
      setErrorMessage("Category name is required")
      return
    }

    setIsLoading(true)
    setStatus("idle")
    setErrorMessage(null)

    try {
      const response = await fetch(API_ENDPOINTS.categories.list, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create category")
      }

      // Success
      setStatus("success")
      setSuccessMessage("Category created successfully!")

      // Reset form
      setFormData({
        name: "",
        description: ""
      })

      // Redirect after delay
      setTimeout(() => {
        navigate("/")
      }, 2000)
    } catch (error) {
      console.error("Error creating category:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while creating the category")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-600"></div>
        </div>
      </div>
    )
  }

  // Unauthorized access
  if (!userInfo || !isAuthorOrAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">Accès Non Autorisé</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            Cette page est réservée aux auteurs et administrateurs. Veuillez vous connecter avec un compte approprié.
          </p>
          <div className="flex justify-center mt-6">
            <Link
              to="/"
              className="rounded-md bg-lime-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-lime-700 flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">Créer une nouvelle catégorie</h1>

        {/* Breadcrumb */}
        <nav className="flex justify-center my-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-lime-700">Accueil</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="text-lime-700 font-medium">Créer une catégorie</li>
          </ol>
        </nav>

        {/* Status messages */}
        {status === "success" && successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 border border-green-200 flex items-start" role="alert">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-start" role="alert">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-0 mt-6 space-y-4 bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8 dark:bg-gray-800"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la catégorie
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Entrez le nom de la catégorie"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:border-lime-500 focus:ring-lime-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="quill-container">
              <ReactQuill
                value={formData.description}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                onChange={handleEditorChange}
                placeholder="Entrez une description pour la catégorie..."
                theme="snow"
                className="rounded-lg dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              La description apparaîtra sur la page de la catégorie et aidera les utilisateurs à comprendre son contenu.
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <Link
              to="/"
              className="flex-1 rounded-lg bg-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300 transition flex justify-center items-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-lime-600 px-5 py-3 text-sm font-medium text-white hover:bg-lime-700 disabled:bg-lime-300 disabled:cursor-not-allowed transition flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Création...
                </>
              ) : "Créer la catégorie"}
            </button>
          </div>
        </form>

        {/* Link to delete categories */}
        <div className="flex justify-center mt-8">
          <Link
            to="/deleteCategory"
            className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            Gérer les catégories
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CreateCategory

