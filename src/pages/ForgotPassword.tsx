"use client"

import React from "react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, ArrowLeft, Loader2, CheckCircle, Mail } from "lucide-react"

// API configuration
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`
}

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const ForgotPassword: React.FC = () => {
  // Form state
  const [email, setEmail] = useState<string>("")

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Handle form submission
  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()

    // Validate email
    if (!email.trim()) {
      setValidationError("L'adresse email est requise")
      return
    }

    if (!isValidEmail(email)) {
      setValidationError("Veuillez entrer une adresse email valide")
      return
    }

    // Clear previous messages
    setValidationError(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(API_ENDPOINTS.forgotPassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Un email avec les instructions pour réinitialiser votre mot de passe a été envoyé. Veuillez vérifier votre boîte de réception.")
        setEmail("") // Clear the form
      } else {
        setErrorMessage(data.message || "Une erreur s'est produite. Veuillez réessayer.")
      }
    } catch (error) {
      console.error("Error during password reset request:", error)
      setErrorMessage("Impossible de se connecter au serveur. Veuillez vérifier votre connexion et réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/login_page"
            className="flex items-center text-sm text-gray-600 hover:text-lime-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la connexion
          </Link>
        </div>

        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-lime-600" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Récupération de mot de passe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
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
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-xs text-green-600 hover:text-green-800 mt-1"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Adresse email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                required
                className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                  validationError ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-lime-600'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value)
                  if (validationError) setValidationError(null)
                }}
                disabled={isSubmitting}
              />
              {validationError && (
                <p className="mt-1 text-sm text-red-600">{validationError}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-lime-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-lime-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Envoi en cours...
                </span>
              ) : (
                "Récupérer mon mot de passe"
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/login_page" className="font-semibold leading-6 text-lime-600 hover:text-lime-500">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword

