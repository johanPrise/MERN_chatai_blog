"use client"

import React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

// Create context with a meaningful default value
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {
    console.warn("ThemeProvider not found")
  }
})

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use a safer initialization approach that works with SSR
  const [theme, setTheme] = useState<Theme>("light")
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize theme after component mounts (safe for SSR)
  useEffect(() => {
    // Only run once on mount
    if (!isInitialized) {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
        setTheme(initialTheme)
      } catch (error) {
        // Fallback in case of localStorage errors
        console.error("Error accessing localStorage:", error)
      }
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Update document and save theme when it changes
  useEffect(() => {
    if (isInitialized) {
      document.documentElement.setAttribute("data-theme", theme)
      try {
        localStorage.setItem("theme", theme)
      } catch (error) {
        console.error("Error saving theme to localStorage:", error)
      }
    }
  }, [theme, isInitialized])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext)
}

