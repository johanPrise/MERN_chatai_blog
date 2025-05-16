"use client"

import React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"

type Theme = "light" | "dark"
type ColorTheme = "green" | "blue" | "purple" | "amber"

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  toggleTheme: () => void
  setColorTheme: (theme: ColorTheme) => void
}

// Create context with a meaningful default value
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  colorTheme: "green",
  toggleTheme: () => {
    console.warn("ThemeProvider not found")
  },
  setColorTheme: () => {
    console.warn("ThemeProvider not found")
  }
})

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use a safer initialization approach that works with SSR
  const [theme, setTheme] = useState<Theme>("light")
  const [colorTheme, setColorTheme] = useState<ColorTheme>("green")
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme after component mounts (safe for SSR)
  useEffect(() => {
    // Only run once on mount
    if (!isInitialized) {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null
        const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme | null
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
        const initialColorTheme = savedColorTheme || "green"

        setTheme(initialTheme)
        setColorTheme(initialColorTheme)
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
      // Appliquer le thème clair/sombre
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      // Appliquer le thème de couleur
      document.documentElement.setAttribute("data-color-theme", colorTheme)

      // Enregistrer les préférences
      try {
        localStorage.setItem("theme", theme)
        localStorage.setItem("colorTheme", colorTheme)
      } catch (error) {
        console.error("Error saving theme to localStorage:", error)
      }

      // Afficher des informations de débogage
      console.log("Theme updated:", { theme, colorTheme })
    }
  }, [theme, colorTheme, isInitialized])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  const handleSetColorTheme = (newColorTheme: ColorTheme) => {
    setColorTheme(newColorTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorTheme,
        toggleTheme,
        setColorTheme: handleSetColorTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext)
}

