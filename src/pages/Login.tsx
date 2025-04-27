"use client"

import React from "react"
import { useState, type FormEvent, useEffect } from "react"
import "../css/App.css"
import { Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import { AlertCircle, Loader2, CheckCircle, LogIn } from "lucide-react"
import { ValidationErrors } from "../types/ValidationErrors"


/**
 * Login component that handles user authentication
 */
function Login(): JSX.Element {
  // Form state
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Navigation and context
  const navigate = useNavigate()
  const { login: contextLogin } = UserContext()

  // Clear error when input changes
  useEffect(() => {
    if (username && errors.username) {
      setErrors(prev => ({ ...prev, username: undefined }))
    }
    if (password && errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }, [username, password, errors.username, errors.password])

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    if (!username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis"
      isValid = false
    }

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
   * Handle login form submission
   * @param {FormEvent} ev - Form event
   */
  const handleSubmit = async (ev: FormEvent) => {
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
      // Use the login function from UserContext
      const success = await contextLogin(username, password)

      if (success) {
        setSuccessMessage("Connexion réussie! Redirection...")

        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate("/", { replace: true })
        }, 1000)
      } else {
        setErrors({ general: "Nom d'utilisateur ou mot de passe incorrect" })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({
        general: error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de la connexion"
      })
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo or icon */}
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-lime-600" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Connectez-vous à votre compte
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Error message */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Mot de passe
              </label>
              <div className="text-sm">
                <Link to="/forgot_password" className="font-semibold text-lime-600 hover:text-lime-500">
                  Mot de passe oublié?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
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
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>
        </form>

        {/* Registration link */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Pas encore inscrit?{" "}
          <Link className="font-semibold leading-6 text-lime-600 hover:text-lime-500" to="/register_page">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

