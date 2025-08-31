import { useEffect } from 'react'
import { useGlobalErrorHandler } from './useGlobalErrorHandler'

/**
 * Hook to listen for theme-related events and handle errors
 * Provides centralized theme error monitoring
 */
export const useThemeListener = () => {
  const { handleThemeError } = useGlobalErrorHandler()

  useEffect(() => {
    // Listen for theme change events
    const handleThemeChange = (event: CustomEvent) => {
      try {
        const { theme, colorTheme } = event.detail
        console.log('Theme changed successfully:', { theme, colorTheme })
      } catch (error) {
        handleThemeError('theme_change_listener', {
          context: { component: 'useThemeListener', action: 'handle_theme_change' },
          showToUser: false,
          logToConsole: true
        })
      }
    }

    // Listen for theme errors
    const handleThemeErrorEvent = (event: CustomEvent) => {
      const { error, context } = event.detail
      handleThemeError(`theme_error_${context?.action || 'unknown'}`, {
        context: { component: 'useThemeListener', action: 'handle_theme_error', ...context },
        showToUser: true,
        logToConsole: true
      })
    }

    // Add event listeners
    window.addEventListener('themeChanged', handleThemeChange as EventListener)
    window.addEventListener('themeError', handleThemeErrorEvent as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener)
      window.removeEventListener('themeError', handleThemeErrorEvent as EventListener)
    }
  }, [handleThemeError])
}

/**
 * Utility function to dispatch theme errors
 */
export const dispatchThemeError = (error: Error, context?: any) => {
  window.dispatchEvent(new CustomEvent('themeError', {
    detail: { error, context }
  }))
}