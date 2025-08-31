import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGlobalErrorHandler } from './useGlobalErrorHandler'

interface UseNavigationReturn {
  navigateTo: (path: string, options?: { replace?: boolean; state?: any }) => void
  navigateBack: () => void
  navigateToPost: (postId: string) => void
  navigateToCategory: (categoryId: string) => void
  navigateToHome: () => void
  navigateToLogin: () => void
  navigateToRegister: () => void
  navigateToAdmin: () => void
  navigateToCreatePost: () => void
  navigateToEditPost: (postId: string) => void
  navigateToDrafts: () => void
  currentPath: string
}

/**
 * Hook for handling navigation with centralized error handling
 * Provides safe navigation methods with error recovery
 */
export const useNavigation = (): UseNavigationReturn => {
  const navigate = useNavigate()
  const location = useLocation()
  const { handleNavigationError } = useGlobalErrorHandler()

  const navigateTo = useCallback((path: string, options?: { replace?: boolean; state?: any }) => {
    try {
      // Validate path format
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid navigation path')
      }

      // Ensure path starts with /
      const normalizedPath = path.startsWith('/') ? path : `/${path}`

      navigate(normalizedPath, options)
    } catch (error) {
      handleNavigationError(path, {
        context: { 
          component: 'useNavigation', 
          action: 'navigate_to',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    }
  }, [navigate, handleNavigationError])

  const navigateBack = useCallback(() => {
    try {
      // Check if there's history to go back to
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        // Fallback to home if no history
        navigate('/')
      }
    } catch (error) {
      handleNavigationError('back', {
        context: { 
          component: 'useNavigation', 
          action: 'navigate_back',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
      
      // Fallback to home
      navigate('/')
    }
  }, [navigate, handleNavigationError])

  const navigateToPost = useCallback((postId: string) => {
    try {
      if (!postId || typeof postId !== 'string') {
        throw new Error('Invalid post ID')
      }
      navigate(`/Post/${postId}`)
    } catch (error) {
      handleNavigationError(`/Post/${postId}`, {
        context: { 
          component: 'useNavigation', 
          action: 'navigate_to_post',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    }
  }, [navigate, handleNavigationError])

  const navigateToCategory = useCallback((categoryId: string) => {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid category ID')
      }
      navigate(`/category/${categoryId}`)
    } catch (error) {
      handleNavigationError(`/category/${categoryId}`, {
        context: { 
          component: 'useNavigation', 
          action: 'navigate_to_category',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    }
  }, [navigate, handleNavigationError])

  const navigateToHome = useCallback(() => {
    navigateTo('/')
  }, [navigateTo])

  const navigateToLogin = useCallback(() => {
    navigateTo('/login_page')
  }, [navigateTo])

  const navigateToRegister = useCallback(() => {
    navigateTo('/register_page')
  }, [navigateTo])

  const navigateToAdmin = useCallback(() => {
    navigateTo('/admin')
  }, [navigateTo])

  const navigateToCreatePost = useCallback(() => {
    navigateTo('/posts/create')
  }, [navigateTo])

  const navigateToEditPost = useCallback((postId: string) => {
    try {
      if (!postId || typeof postId !== 'string') {
        throw new Error('Invalid post ID for editing')
      }
      navigate(`/posts/edit/${postId}`)
    } catch (error) {
      handleNavigationError(`/posts/edit/${postId}`, {
        context: { 
          component: 'useNavigation', 
          action: 'navigate_to_edit_post',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    }
  }, [navigate, handleNavigationError])

  const navigateToDrafts = useCallback(() => {
    navigateTo('/posts/drafts')
  }, [navigateTo])

  return {
    navigateTo,
    navigateBack,
    navigateToPost,
    navigateToCategory,
    navigateToHome,
    navigateToLogin,
    navigateToRegister,
    navigateToAdmin,
    navigateToCreatePost,
    navigateToEditPost,
    navigateToDrafts,
    currentPath: location.pathname
  }
}