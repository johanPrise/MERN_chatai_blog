"use client"

import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { AlertCircle, CheckCircle, Loader2, KeyRound } from "lucide-react"
import { ValidationErrors } from "../types/ValidationErrors"
import { ApiResponse } from "../types/ApiResponse"
import { API_ENDPOINTS } from "../config/api.config"

const ResetPassword: React.FC = () => {
  // Form state
  const { resetToken } = useParams<{ resetToken: string }>()
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(3)

  // Navigation
  const navigate = useNavigate()

  // Handle countdown for redirect after success
  useEffect(() => {
    if (successMessage && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (successMessage && countdown === 0) {
      navigate("/login_page")
    }
  }, [successMessage, countdown, navigate])

  // Clear error when input changes
  useEffect(() => {
    if (password && errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
    if (confirmPassword && errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }, [password, confirmPassword, errors.password, errors.confirmPassword])

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    // Validate password
    if (!password) {
      newErrors.password = "Le mot de passe est requis"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
      isValid = false
    }

    // Validate password confirmation
    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise"
      isValid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
      isValid = false
    }

    // Validate token
    if (!resetToken) {
      newErrors.general = "Token de réinitialisation invalide ou manquant"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  /**
   * Handle reset password form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset messages
    setSuccessMessage(null)
    setErrors({})

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (!resetToken) {
        throw new Error("Token de réinitialisation invalide ou manquant")
      }

      const response = await fetch(API_ENDPOINTS.auth.resetPassword(resetToken), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data: ApiResponse = await response.json()

      if (response.ok) {
        setSuccessMessage(data.message || "Mot de passe réinitialisé avec succès. Redirection vers la page de connexion...")
        // Countdown is handled by useEffect
      } else {
        setErrors({
          general: data.message || "Échec de la réinitialisation du mot de passe"
        })
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      setErrors({
        general: error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de la réinitialisation du mot de passe"
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
        <div>
          <p className="text-green-800 text-sm">{successMessage}</p>
          <p className="text-xs text-green-600 mt-1">
            Redirection dans {countdown} seconde{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Logo or icon */}
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-lime-600" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Réinitialisation du mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Veuillez entrer votre nouveau mot de passe
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Error and success messages */}
        {renderErrorMessage()}
        {renderSuccessMessage()}

        <form className="space-y-6" onSubmit={handleResetPassword}>
          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Nouveau mot de passe
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
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
              Confirmer le mot de passe
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                  errors.confirmPassword ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-lime-600'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
                  Réinitialisation en cours...
                </span>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </div>
        </form>

        {/* Login link */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link className="font-semibold leading-6 text-lime-600 hover:text-lime-500" to="/login_page">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword

