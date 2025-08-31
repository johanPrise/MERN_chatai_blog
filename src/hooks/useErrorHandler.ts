import { useCallback, useState } from 'react'
import errorHandler from '../services/errorHandler'
import { ApiError, ErrorHandlerOptions, ErrorType, UserFriendlyError } from '../types/ErrorTypes'

interface UseErrorHandlerReturn {
  error: UserFriendlyError | null
  clearError: () => void
  handleApiError: (error: ApiError, options?: ErrorHandlerOptions) => UserFriendlyError
  handleImageError: (imageUrl: string, options?: ErrorHandlerOptions) => UserFriendlyError
  handleNavigationError: (route: string, options?: ErrorHandlerOptions) => UserFriendlyError
  handleInteractionError: (
    type: 'like' | 'dislike',
    target: 'post' | 'comment',
    targetId: string,
    options?: ErrorHandlerOptions
  ) => UserFriendlyError
  handleContentFilterError: (content: string, options?: ErrorHandlerOptions) => UserFriendlyError
  handleThemeError: (themeAction: string, options?: ErrorHandlerOptions) => UserFriendlyError
  handleGenericError: (error: Error | ApiError, errorType: ErrorType, options?: ErrorHandlerOptions) => UserFriendlyError
}

/**
 * Hook for centralized error handling in functional components
 * Provides easy access to error handling methods with state management
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<UserFriendlyError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleApiError = useCallback((apiError: ApiError, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = errorHandler.handleApiError(apiError, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleImageError = useCallback((imageUrl: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = errorHandler.handleImageError(imageUrl, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleNavigationError = useCallback((route: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = errorHandler.handleNavigationError(route, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleInteractionError = useCallback((
    type: 'like' | 'dislike',
    target: 'post' | 'comment',
    targetId: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const userFriendlyError = errorHandler.handleInteractionError(type, target, targetId, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleContentFilterError = useCallback((content: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = errorHandler.handleContentFilterError(content, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleThemeError = useCallback((themeAction: string, options: ErrorHandlerOptions = {}) => {
    const userFriendlyError = errorHandler.handleThemeError(themeAction, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  const handleGenericError = useCallback((
    err: Error | ApiError,
    errorType: ErrorType,
    options: ErrorHandlerOptions = {}
  ) => {
    const userFriendlyError = errorHandler.handleError(err, errorType, options)
    if (options.showToUser !== false) {
      setError(userFriendlyError)
    }
    return userFriendlyError
  }, [])

  return {
    error,
    clearError,
    handleApiError,
    handleImageError,
    handleNavigationError,
    handleInteractionError,
    handleContentFilterError,
    handleThemeError,
    handleGenericError
  }
}