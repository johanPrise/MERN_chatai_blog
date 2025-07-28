"use client"

import React from "react"
import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import errorHandler from "../../services/errorHandler"

type Theme = "light" | "dark"
type ColorTheme = "green" | "blue" | "purple" | "amber"

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  toggleTheme: () => void
  setColorTheme: (theme: ColorTheme) => void
  applyTheme: () => void
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
  },
  applyTheme: () => {
    console.warn("ThemeProvider not found")
  }
})

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use a safer initialization approach that works with SSR
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get initial theme from localStorage on first render
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null
        if (savedTheme) return savedTheme
        
        // Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        return prefersDark ? "dark" : "light"
      } catch {
        return "light"
      }
    }
    return "light"
  })
  
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    // Try to get initial color theme from localStorage on first render
    if (typeof window !== 'undefined') {
      try {
        const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme | null
        return savedColorTheme || "green"
      } catch {
        return "green"
      }
    }
    return "green"
  })
  
  const [isInitialized, setIsInitialized] = useState(false)

  // Function to apply theme to document
  const applyTheme = () => {
    try {
      // Ensure we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return
      }

      // Apply dark/light theme using both class and data-attribute for maximum compatibility
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
        document.documentElement.setAttribute("data-theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        document.documentElement.setAttribute("data-theme", "light")
      }

      // Apply color theme
      document.documentElement.setAttribute("data-color-theme", colorTheme)

      // Update body class for additional styling hooks
      const existingClasses = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('theme-') && !cls.startsWith('color-'))
        .join(' ')
      
      document.body.className = `${existingClasses} theme-${theme} color-${colorTheme}`.trim()

      // Add transition class for smooth theme changes
      document.body.classList.add('theme-transition')
      
      // Remove transition class after animation completes
      const transitionTimeout = setTimeout(() => {
        if (document.body) {
          document.body.classList.remove('theme-transition')
        }
      }, 300)

      // Save preferences to localStorage
      try {
        localStorage.setItem("theme", theme)
        localStorage.setItem("colorTheme", colorTheme)
      } catch (storageError) {
        console.warn("Failed to save theme to localStorage:", storageError)
        // Use global error handler for theme persistence errors
        errorHandler.handleThemeError(`save_theme_${theme}_${colorTheme}`, {
          context: { component: 'ThemeProvider', action: 'save_theme_preferences' },
          showToUser: false,
          logToConsole: true
        })
      }

      // Dispatch custom event for other components to listen to theme changes
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme, colorTheme } 
      }))

      console.log("Theme applied successfully:", { theme, colorTheme })

      // Cleanup function for the timeout
      return () => {
        clearTimeout(transitionTimeout)
      }
    } catch (error) {
      console.error("Error applying theme:", error)
      // Use global error handler for theme application errors
      errorHandler.handleThemeError(`apply_theme_${theme}_${colorTheme}`, {
        context: { component: 'ThemeProvider', action: 'apply_theme' },
        showToUser: true, // Show this error to user as it affects UI
        logToConsole: true
      })
    }
  }

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

        console.log("Initializing theme:", { initialTheme, initialColorTheme, savedTheme, savedColorTheme })

        setTheme(initialTheme)
        setColorTheme(initialColorTheme)
      } catch (error) {
        // Fallback in case of localStorage errors
        console.error("Error accessing localStorage:", error)
        // Use global error handler for theme initialization errors
        errorHandler.handleThemeError('initialize_theme', {
          context: { component: 'ThemeProvider', action: 'initialize_theme' },
          showToUser: false, // Don't show initialization errors to user
          logToConsole: true
        })
        setTheme("light")
        setColorTheme("green")
      }
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Update document and save theme when it changes
  useEffect(() => {
    if (isInitialized) {
      applyTheme()
    }
  }, [theme, colorTheme, isInitialized])

  // Listen for system theme changes
  useEffect(() => {
    if (isInitialized) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        // Only update if no theme is saved in localStorage
        const savedTheme = localStorage.getItem("theme")
        if (!savedTheme) {
          setTheme(e.matches ? "dark" : "light")
        }
      }

      mediaQuery.addEventListener('change', handleSystemThemeChange)
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      }
    }
  }, [isInitialized])

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
        setColorTheme: handleSetColorTheme,
        applyTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

