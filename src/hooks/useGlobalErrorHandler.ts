import { useCallback } from 'react'
import { useErrorHandler } from './useErrorHandler'
import { useErrorContext } from '../contexts/ErrorContext'
import { ApiError, ErrorHandlerOptions, ErrorType } from '../types/ErrorTypes'

/**
 * Enhanced error handler hook that integrates with global error context
 * Provides centralized error handling with automatic user notification
 */
export const useGlobalErrorHandler = () => {
  const { showError } = useErrorContext()
  const {
    handleApiError,
    handleImageError,
    handleNavigationError,
    handleInteractionError,
    handleContentFilterError,
    handleThemeError,
    handleGenericError
  } = useErrorHandler()

  const handleApiErrorGlobal = useCallback((error: ApiError, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = handleApiError(error, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleApiError, showError])

  const handleImageErrorGlobal = useCallback((imageUrl: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = handleImageError(imageUrl, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleImageError, showError])

  const handleNavigationErrorGlobal = useCallback((route: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = handleNavigationError(route, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleNavigationError, showError])

  const handleInteractionErrorGlobal = useCallback((
    type: 'like' | 'dislike',
    target: 'post' | 'comment',
    targetId: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const userFriendlyError = handleInteractionError(type, target, targetId, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleInteractionError, showError])

  const handleContentFilterErrorGlobal = useCallback((content: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = handleContentFilterError(content, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleContentFilterError, showError])

  const handleThemeErrorGlobal = useCallback((themeAction: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = handleThemeError(themeAction, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleThemeError, showError])

  const handleGenericErrorGlobal = useCallback((
    error: Error | ApiError,
    errorType: ErrorType,
    options: ErrorHandlerOptions = {}
  ) => {
    const userFriendlyError = handleGenericError(error, errorType, { ...options, showToUser: false })
    if (options.showToUser !== false) {
      showError(userFriendlyError)
    }
    return userFriendlyError
  }, [handleGenericError, showError])

  return {
    handleApiError: handleApiErrorGlobal,
    handleImageError: handleImageErrorGlobal,
    handleNavigationError: handleNavigationErrorGlobal,
    handleInteractionError: handleInteractionErrorGlobal,
    handleContentFilterError: handleContentFilterErrorGlobal,
    handleThemeError: handleThemeErrorGlobal,
    handleGenericError: handleGenericErrorGlobal
  }
}