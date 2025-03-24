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

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mern-backend-neon.vercel.app";

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

  // Fonction pour vérifier l'authentification de l'utilisateur
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/verify-session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const userData = await res.json()
        setUserInfo(userData)
        return true
      } else {
        setUserInfo(null)
        return false
      }
    } catch (error) {
      console.error("Session verification failed:", error)
      setUserInfo(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de connexion
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const userData = await res.json()
        setUserInfo({
          id: userData._id,
          username: userData.username,
          role: userData.role,
        })
        return true
      } else {
        const errorData = await res.json()
        console.error("Login failed:", errorData)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        setUserInfo(null)
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
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
export const UserContext = (): UserContextType => {
  return useContext(UserContextScheme)
}

