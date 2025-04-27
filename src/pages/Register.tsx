"use client"

import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../css/App.css"
import { AlertCircle, CheckCircle, Loader2, UserPlus } from "lucide-react"
import { ValidationErrors } from "../types/ValidationErrors"

// API configuration
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register/`
}


function Register() {
  // Form state
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Navigation
  const navigate = useNavigate()

  // Clear error when input changes
  useEffect(() => {
    if (username && errors.username) {
      setErrors(prev => ({ ...prev, username: undefined }))
    }
    if (password && errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
    if (email && errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }, [username, password, email, errors.username, errors.password, errors.email])

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    // Validate email
    if (!email.trim()) {
      newErrors.email = "L'email est requis"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'email n'est pas valide"
      isValid = false
    }

    // Validate username
    if (!username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis"
      isValid = false
    } else if (username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères"
      isValid = false
    }

    // Validate password
    if (!password) {
      newErrors.password = "Le mot de passe est requis"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  /**
   * Handle registration form submission
   * @param {React.FormEvent<HTMLFormElement>} ev - Form event
   */
  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()

    // Reset messages
    setSuccessMessage(null)
    setErrors({})

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Échec de l'inscription: ${response.status}`)
      }

      setSuccessMessage("Inscription réussie! Redirection vers la page de connexion...")

      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate("/login_page")
      }, 2000)
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({
        general: error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de l'inscription"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render error message
  const renderErrorMessage = () => {
    if (!errors.general) return null;

    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 text-sm font-medium">{errors.general}</p>
          <button
            onClick={() => setErrors(prev => ({ ...prev, general: undefined }))}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Fermer
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
        <p className="text-green-800 text-sm">{successMessage}</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo or icon */}
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-lime-600" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Créer un compte
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Error and success messages */}
        {renderErrorMessage()}
        {renderSuccessMessage()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  errors.email ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-lime-600'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
              Nom d'utilisateur
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  errors.username ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-lime-600'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={isSubmitting}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Mot de passe
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  errors.password ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-lime-600'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-lime-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-lime-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Inscription en cours...
                </span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </div>
        </form>

        {/* Login link */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Déjà inscrit?{" "}
          <Link className="font-semibold leading-6 text-lime-600 hover:text-lime-500" to="/login_page">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

