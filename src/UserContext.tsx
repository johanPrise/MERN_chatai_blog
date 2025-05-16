"use client"

import React from "react"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react"
import { API_ENDPOINTS } from "./config/api.config"

// Déclaration de module pour étendre le type ImportMeta de Vite
declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>
  }
}

export type UserInfo = {
  id: string
  username: string
  role?: string
} | null

interface UserContextType {
  userInfo: UserInfo
  setUserInfo: Dispatch<SetStateAction<UserInfo>>
  checkAuth: () => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

// Création du contexte avec une valeur par défaut typée explicitement
const UserContextScheme = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {}, // Fonction vide mais typée correctement
  checkAuth: async () => false,
  login: async () => false,
  logout: async () => {},
  isLoading: true,
} as UserContextType) // Assertion de type pour satisfaire TypeScript

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * Fonction pour vérifier l'authentification de l'utilisateur
   * @returns Promise<boolean> - true si l'utilisateur est authentifié, false sinon
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log("Checking authentication status...")

      // Log cookies for debugging (will only show in server logs)
      console.log("Document cookies:", document.cookie)

      const res = await fetch(API_ENDPOINTS.users.profile, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const responseData = await res.json()

        // Afficher la réponse complète pour le débogage
        console.log("Auth check response data:", responseData)

        let userData;

        // Vérifier si la réponse contient un objet 'user'
        if (responseData && responseData.user && responseData.user._id) {
          userData = responseData.user;
        }
        // Sinon, vérifier si la réponse contient directement les données utilisateur
        else if (responseData && responseData._id) {
          userData = responseData;
        }
        else {
          console.error("Auth check error: Invalid user data received from server", responseData)
          setUserInfo(null)
          return false
        }

        // Mettre à jour les informations utilisateur
        setUserInfo({
          id: userData._id,
          username: userData.username,
          role: userData.role,
        })

        return true
      } else {
        // Si le statut est 401 ou 403, l'utilisateur n'est pas authentifié
        if (res.status === 401 || res.status === 403) {
          setUserInfo(null)
          return false
        }

        // Pour les autres erreurs, on log le problème
        let errorMessage = "Authentication check failed"

        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si la réponse n'est pas du JSON valide, on utilise le message par défaut
        }

        console.error(`Auth check failed (${res.status}): ${errorMessage}`)
        setUserInfo(null)
        return false
      }
    } catch (error) {
      console.error("Session verification failed:", error instanceof Error ? error.message : String(error))
      setUserInfo(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fonction de connexion utilisateur
   * @param email - Adresse email
   * @param password - Mot de passe
   * @returns Promise<boolean> - true si la connexion a réussi, false sinon
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      console.error("Login error: Email and password are required")
      return false
    }

    try {
      setIsLoading(true)
      // Afficher les données envoyées pour le débogage
      console.log("Tentative de connexion avec:", { email, password });

      const res = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const responseData = await res.json()

        // Afficher la réponse complète pour le débogage
        console.log("Login response data:", responseData)

        // Log all cookies after login
        console.log("Cookies after login:", document.cookie)

        // Check if token was received in the response
        if (responseData.token) {
          console.log("Token received in response body")
          // We don't need to store the token in localStorage since we're using cookies
          // But we could store it for backup if needed
        } else {
          console.log("No token in response body, checking for cookie")
        }

        // Vérifier si la réponse contient un objet utilisateur
        if (!responseData || !responseData.user || !responseData.user._id) {
          console.error("Login error: Invalid user data received from server")
          return false
        }

        const userData = responseData.user

        setUserInfo({
          id: userData._id,
          username: userData.username,
          role: userData.role,
        })

        return true
      } else {
        let errorMessage = "Login failed"

        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
          // Afficher les détails de l'erreur pour le débogage
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          // Si la réponse n'est pas du JSON valide, on utilise le message par défaut
          console.error("Erreur lors de la lecture de la réponse JSON:", e);
        }

        // Afficher le statut et le message d'erreur
        console.error(`Login failed (${res.status}): ${errorMessage}`);
        return false
      }
    } catch (error) {
      console.error("Login error:", error instanceof Error ? error.message : String(error))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fonction de déconnexion utilisateur
   * @returns Promise<void>
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const res = await fetch(API_ENDPOINTS.auth.logout, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        // Déconnexion réussie, on efface les infos utilisateur
        setUserInfo(null)

        // Effacer les données locales si nécessaire
        // localStorage.removeItem('some-user-data')
      } else {
        let errorMessage = "Logout failed"

        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si la réponse n'est pas du JSON valide, on utilise le message par défaut
        }

        console.error(`Logout failed (${res.status}): ${errorMessage}`)

        // Même en cas d'échec de l'API, on déconnecte l'utilisateur localement
        setUserInfo(null)
      }
    } catch (error) {
      console.error("Logout error:", error instanceof Error ? error.message : String(error))

      // Même en cas d'erreur, on déconnecte l'utilisateur localement
      setUserInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Vérifier l'authentification au chargement initial
    checkAuth()

    // Configurer une vérification périodique de la session
    const interval = setInterval(() => {
      // Vérifier seulement si l'utilisateur est connecté
      if (userInfo) {
        checkAuth()
      }
    }, 5 * 60 * 1000) // Vérifier toutes les 5 minutes au lieu de 3 secondes

    return () => clearInterval(interval)
  }, [userInfo?.id]) // Dépendance sur userInfo.id pour éviter des boucles infinies

  return (
    <UserContextScheme.Provider value={{
      userInfo,
      setUserInfo,
      checkAuth,
      login,
      logout,
      isLoading
    }}>
      {children}
    </UserContextScheme.Provider>
  )
}

// Export du contexte avec typage explicite
/**
 * Hook pour accéder au contexte utilisateur
 * @returns Le contexte utilisateur typé
 * @throws {Error} Si utilisé en dehors d'un UserContextProvider
 */
export const UserContext = (): UserContextType => {
  const context = useContext(UserContextScheme)

  // Vérification que le hook est utilisé dans un Provider
  if (context === undefined) {
    throw new Error('UserContext doit être utilisé à l\'intérieur d\'un UserContextProvider')
  }

  return context
}

