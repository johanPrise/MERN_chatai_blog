"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { CategoryProps } from "../types/CategoryProps"
import { Trash2, AlertCircle, Search, X, ArrowLeft, Loader2 } from "lucide-react"
import { FetchStatus } from "../types/FetchStatus"
import { API_ENDPOINTS } from "../config/api.config"

// Component states

const DeleteCategories: React.FC = () => {

  // State for categories and selection
  const [categories, setCategories] = useState<CategoryProps[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")

  // State for UI
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deleteResults, setDeleteResults] = useState<{
    success: string[];
    failed: string[];
  }>({ success: [], failed: [] })

  // Check if user has author or admin privileges
  useEffect(() => {
    const checkAuthorAdminStatus = async () => {
      setFetchStatus("loading")
      try {
        const response = await fetch(API_ENDPOINTS.users.profile, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to verify permissions")
        }

        const data = await response.json()
        setIsAuthorOrAdmin(data.isAuthorOrAdmin)
        setFetchStatus("success")
      } catch (error) {
        console.error("Error checking author/admin status:", error)
        setIsAuthorOrAdmin(false)
        setErrorMessage("Failed to verify your permissions")
        setFetchStatus("error")
      }
    }

    checkAuthorAdminStatus()
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setFetchStatus("loading")
      try {
        const response = await fetch(API_ENDPOINTS.categories.list)

        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }

        const data = await response.json()
        // Correction : s'assurer que c'est bien un tableau
        setCategories(Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : [])
        setFetchStatus("success")
      } catch (error) {
        console.error("Error fetching categories:", error)
        setErrorMessage("Failed to load categories")
        setFetchStatus("error")
      }
    }

    fetchCategories()
  }, [])

  // Filter categories based on search query
  const filteredCategories = Array.isArray(categories) ? categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  // Handle checkbox selection
  const handleCheckboxChange = (categoryId: string) => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId)
      } else {
        return [...prevSelected, categoryId]
      }
    })
  }

  // Select or deselect all visible categories
  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      // Deselect all if all are selected
      setSelectedCategories([])
    } else {
      // Select all filtered categories
      setSelectedCategories(filteredCategories.map(category => category._id))
    }
  }

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery("")
  }

  // Show confirmation dialog
  const handleShowConfirmation = () => {
    setShowConfirmation(true)
  }

  // Cancel deletion
  const handleCancelDelete = () => {
    setShowConfirmation(false)
  }

  // Delete selected categories
  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteResults({ success: [], failed: [] })

    try {
      const results = await Promise.all(
        selectedCategories.map(async (categoryId) => {
          try {
            const response = await fetch(`${API_ENDPOINTS.categories.list}/${categoryId}`, {
              method: "DELETE",
              credentials: "include",
            })

            const data = await response.json()

            if (!response.ok) {
              console.error("Error deleting category:", data.message)
              return { id: categoryId, success: false, message: data.message }
            }

            return { id: categoryId, success: true }
          } catch (error) {
            console.error("Error deleting category:", error)
            return { id: categoryId, success: false, message: "Network error" }
          }
        })
      )

      // Process results
      const successIds = results.filter(r => r.success).map(r => r.id)
      const failedIds = results.filter(r => !r.success).map(r => r.id)

      setDeleteResults({
        success: successIds,
        failed: failedIds
      })

      // Remove successfully deleted categories from the list
      if (successIds.length > 0) {
        setCategories(prevCategories =>
          prevCategories.filter(category => !successIds.includes(category._id))
        )

        // Clear selection for deleted categories
        setSelectedCategories(prevSelected =>
          prevSelected.filter(id => !successIds.includes(id))
        )
      }

      // Hide confirmation if all were successful
      if (failedIds.length === 0) {
        setShowConfirmation(false)
      }
    } catch (error) {
      console.error("Error during category deletion:", error)
      setErrorMessage("Failed to delete categories")
    } finally {
      setIsDeleting(false)
    }
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

  // Loading state
  if (fetchStatus === "loading" && categories.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-lime-600" />
          <p className="mt-4 text-gray-500">Loading categories...</p>
        </div>
      </div>
    )
  }

  // Main view
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center text-sm text-gray-600 hover:text-lime-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl mb-6">Delete Categories</h1>

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

        <div className="bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          {/* Search input */}
          <div className="mb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Categories list */}
          {filteredCategories.length > 0 ? (
            <div>
              {/* Select all option */}
              <div className="mb-2 flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                  />
                  <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
                    {selectedCategories.length === filteredCategories.length && filteredCategories.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </label>
                </div>
                <span className="text-xs text-gray-500">
                  {selectedCategories.length} of {filteredCategories.length} selected
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-md p-1 mb-4">
                {filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={category._id}
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCheckboxChange(category._id)}
                      className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
                    />
                    <label
                      htmlFor={category._id}
                      className="ml-2 flex-1 text-sm text-gray-900 cursor-pointer"
                    >
                      {category.name}
                      {category.description && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {category.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery
                  ? "No categories found matching your search."
                  : "No categories available."}
              </p>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="mt-2 text-sm text-lime-600 hover:text-lime-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Delete button */}
          <button
            className="block w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleShowConfirmation}
            disabled={isDeleting || selectedCategories.length === 0}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected Categories
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>

            <p className="text-gray-700 mb-4">
              Are you sure you want to delete {selectedCategories.length} selected {selectedCategories.length === 1 ? 'category' : 'categories'}?
              This action cannot be undone.
            </p>

            {/* Show results if any */}
            {(deleteResults.success.length > 0 || deleteResults.failed.length > 0) && (
              <div className="mb-4 text-sm">
                {deleteResults.success.length > 0 && (
                  <p className="text-green-600 mb-1">
                    Successfully deleted: {deleteResults.success.length} {deleteResults.success.length === 1 ? 'category' : 'categories'}
                  </p>
                )}

                {deleteResults.failed.length > 0 && (
                  <p className="text-red-600">
                    Failed to delete: {deleteResults.failed.length} {deleteResults.failed.length === 1 ? 'category' : 'categories'}
                    <br />
                    <span className="text-xs text-gray-500">
                      (Categories may be in use by posts)
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteCategories

