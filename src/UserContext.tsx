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

// Déclaration de module pour étendre le type ImportMeta de Vite
declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>
  }
}

// URL de base de l'API - using Vite's environment variable pattern
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://mern-backend-neon.vercel.app";

export type UserInfo = {
  id: string
  username: string
  role?: string
} | null

interface UserContextType {
  userInfo: UserInfo
  setUserInfo: Dispatch<SetStateAction<UserInfo>>
  checkAuth: () => Promise<boolean>
  login: (username: string, password: string) => Promise<boolean>
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
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const userData = await res.json()

        if (!userData || !userData._id) {
          console.error("Auth check error: Invalid user data received from server")
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
   * @param username - Nom d'utilisateur
   * @param password - Mot de passe
   * @returns Promise<boolean> - true si la connexion a réussi, false sinon
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    if (!username || !password) {
      console.error("Login error: Username and password are required")
      return false
    }

    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const userData = await res.json()

        if (!userData || !userData._id) {
          console.error("Login error: Invalid user data received from server")
          return false
        }

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
        } catch (e) {
          // Si la réponse n'est pas du JSON valide, on utilise le message par défaut
        }

        console.error(`Login failed (${res.status}): ${errorMessage}`)
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
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
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

