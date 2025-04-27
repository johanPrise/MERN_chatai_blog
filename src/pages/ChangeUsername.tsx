"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Navigate, Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import { FormStatus } from "../types/FormStatus"

// API URLs
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  updateProfile: `${API_BASE_URL}/users/profile`,
  getProfile: `${API_BASE_URL}/users/profile`
}


const EditUsername: React.FC = () => {
  // State management
  const [newUsername, setNewUsername] = useState("")
  const [currentUsername, setCurrentUsername] = useState("")
  const [redirect, setRedirect] = useState(false)
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Get user context
  const { userInfo, setUserInfo } = UserContext()

  // Get navigation
  const navigate = useNavigate()

  // Set current username from context
  useEffect(() => {
    if (userInfo?.username) {
      setCurrentUsername(userInfo.username)
    } else {
      // If no user info, redirect to login
      navigate("/login_page", { replace: true })
    }
  }, [userInfo, navigate])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value)
    // Reset error message when user starts typing
    if (errorMessage) {
      setErrorMessage(null)
    }
  }, [errorMessage])

  // Validate username
  const validateUsername = useCallback((username: string): boolean => {
    // Username should be at least 3 characters and alphanumeric with underscores
    if (username.length < 3) {
      setErrorMessage("Username must be at least 3 characters long")
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrorMessage("Username can only contain letters, numbers, and underscores")
      return false
    }

    return true
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Trim whitespace
    const trimmedUsername = newUsername.trim()

    // Don't submit if username is the same as current
    if (trimmedUsername === currentUsername) {
      setErrorMessage("New username is the same as your current username")
      return
    }

    // Validate username
    if (!validateUsername(trimmedUsername)) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      // Use the correct API endpoint for updating profile
      const response = await fetch(API_ENDPOINTS.updateProfile, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: trimmedUsername }), // Use the correct field name
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setSuccessMessage("Username updated successfully!")

        // Update user context with new username
        if (userInfo) {
          setUserInfo({
            ...userInfo,
            username: trimmedUsername
          })
        }

        // Redirect after a short delay
        setTimeout(() => {
          setRedirect(true)
        }, 2000)
      } else {
        setStatus("error")
        setErrorMessage(data.message || "Failed to update username. Please try again.")
      }
    } catch (error) {
      console.error("Error updating username:", error)
      setStatus("error")
      setErrorMessage("An error occurred while connecting to the server. Please try again.")
    }
  }, [newUsername, currentUsername, validateUsername, userInfo, setUserInfo])

  // Handle cancel button
  const handleCancel = useCallback(() => {
    setRedirect(true)
  }, [])

  // Redirect to home page since there's no dedicated profile page in the routes
  if (redirect) {
    return <Navigate to="/" />
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-lime-700 sm:text-3xl">Edit Username</h1>

        {/* Breadcrumb */}
        <nav className="flex justify-center my-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-lime-700">Home</Link>
              <span className="mx-2">/</span>
            </li>
            <li className="text-lime-700 font-medium">Edit Username</li>
          </ol>
        </nav>

        {/* Current username display */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Current username: <span className="font-medium">{currentUsername}</span>
          </p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 border border-green-200" role="alert">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-0 mt-6 space-y-4 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-1">
              New Username
            </label>
            <input
              type="text"
              id="newUsername"
              placeholder="Enter new username"
              value={newUsername}
              onChange={handleInputChange}
              required
              disabled={status === "submitting"}
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:border-lime-500 focus:ring-lime-500"
              aria-describedby="username-requirements"
            />
            <p id="username-requirements" className="mt-1 text-xs text-gray-500">
              Username must be at least 3 characters and can only contain letters, numbers, and underscores.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg bg-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "submitting" || !newUsername.trim()}
              className="flex-1 rounded-lg bg-lime-700 px-5 py-3 text-sm font-medium text-white hover:bg-lime-800 disabled:bg-lime-300 disabled:cursor-not-allowed transition"
            >
              {status === "submitting" ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : "Update Username"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditUsername

