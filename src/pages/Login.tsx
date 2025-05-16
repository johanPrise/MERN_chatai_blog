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
  const [email, setEmail] = useState<string>("")
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
    if (email && errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
    if (password && errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }, [email, password, errors.email, errors.password])

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    if (!email.trim()) {
      newErrors.email = "L'adresse email est requise"
      isValid = false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Veuillez entrer une adresse email valide"
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
   * Handle login submission with test credentials
   */
  const handleTestLogin = async () => {
    setEmail("admin@example.com")
    setPassword("admin123")

    setIsSubmitting(true)

    try {
      // Test direct API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123"
        }),
      });

      console.log("Test login response status:", response.status);

      try {
        const data = await response.json();
        console.log("Test login response data:", data);

        // Afficher la structure complète de la réponse
        console.log("Response structure:", JSON.stringify(data, null, 2));

        if (response.ok) {
          if (data && data.user && data.user._id) {
            setSuccessMessage(`Test de connexion réussi! Utilisateur: ${data.user.username}`);
          } else {
            setSuccessMessage("Test de connexion réussi, mais format de réponse inattendu");
          }
        } else {
          setErrors({ general: data.message || "Échec du test de connexion" });
        }
      } catch (jsonError) {
        console.error("Erreur lors de la lecture de la réponse JSON:", jsonError);
        setErrors({ general: "Erreur lors de la lecture de la réponse du serveur" });
      }
    } catch (error) {
      console.error("Test login error:", error);
      setErrors({
        general: error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors du test de connexion"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const success = await contextLogin(email, password)

      if (success) {
        setSuccessMessage("Connexion réussie! Redirection...")

        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate("/", { replace: true })
        }, 1000)
      } else {
        setErrors({ general: "Email ou mot de passe incorrect" })
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
            <LogIn className="h-6 w-6 text-lime-600" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Connectez-vous à votre compte
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Error and success messages */}
        {renderErrorMessage()}
        {renderSuccessMessage()}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email field */}
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

          {/* Test login button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              Tester avec admin@example.com
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

