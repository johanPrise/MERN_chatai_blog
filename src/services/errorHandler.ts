import { ApiError, ErrorContext, ErrorHandlerOptions, ErrorReport, ErrorType, UserFriendlyError } from '../types/ErrorTypes'

// Centralized error messages
export const ERROR_MESSAGES = {
  // Interaction errors (Requirements 1.1-1.6)
  LIKE_FAILED: "Impossible d'aimer ce contenu. Veuillez réessayer.",
  DISLIKE_FAILED: "Impossible de ne pas aimer ce contenu. Veuillez réessayer.",
  LIKE_POST_FAILED: "Erreur lors de l'ajout du like au post.",
  DISLIKE_POST_FAILED: "Erreur lors de l'ajout du dislike au post.",
  LIKE_COMMENT_FAILED: "Erreur lors de l'ajout du like au commentaire.",
  DISLIKE_COMMENT_FAILED: "Erreur lors de l'ajout du dislike au commentaire.",
  
  // Navigation errors (Requirements 2.1-2.4)
  NAVIGATION_FAILED: "Page introuvable. Redirection vers l'accueil.",
  POST_CREATION_FAILED: "Erreur lors de la création du post. Veuillez réessayer.",
  INVALID_POST_ID: "L'identifiant du post est invalide.",
  REDIRECT_FAILED: "Erreur de redirection. Retour à la page précédente.",
  
  // Image errors (Requirements 4.1-4.5)
  IMAGE_LOAD_FAILED: "Impossible de charger l'image.",
  IMAGE_UPLOAD_FAILED: "Erreur lors du téléchargement de l'image.",
  IMAGE_VALIDATION_FAILED: "Format d'image non supporté.",
  IMAGE_SIZE_EXCEEDED: "L'image est trop volumineuse.",
  
  // Content filter errors (Requirements 9.1-9.5)
  CONTENT_FILTER_APPLIED: "Votre contenu a été modifié pour respecter les règles de la communauté.",
  CONTENT_FILTER_ERROR: "Erreur lors du filtrage du contenu.",
  PROFANITY_DETECTED: "Contenu inapproprié détecté et filtré.",
  
  // Editor errors (Requirements 6.1-6.6)
  EDITOR_SAVE_FAILED: "Erreur lors de la sauvegarde. Vos modifications ont été préservées.",
  EDITOR_LOAD_FAILED: "Erreur lors du chargement du contenu.",
  FORMATTING_ERROR: "Erreur de formatage détectée.",
  
  // Generic errors
  NETWORK_ERROR: "Problème de connexion réseau. Vérifiez votre connexion internet.",
  SERVER_ERROR: "Erreur serveur temporaire. Veuillez réessayer dans quelques instants.",
  AUTHENTICATION_ERROR: "Session expirée. Veuillez vous reconnecter.",
  AUTHORIZATION_ERROR: "Vous n'avez pas les permissions nécessaires pour cette action.",
  VALIDATION_ERROR: "Les données saisies ne sont pas valides.",
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite.",
  
  // Theme errors (Requirements 8.1-8.5)
  THEME_CHANGE_FAILED: "Impossible de changer le thème. Utilisation du thème par défaut.",
  THEME_PERSISTENCE_FAILED: "Impossible de sauvegarder les préférences de thème."
} as const

class ErrorHandler {
  private static instance: ErrorHandler
  private errorReports: ErrorReport[] = []
  private maxReports = 100

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle API errors with specific error mapping
   */
  handleApiError(error: ApiError, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const context: ErrorContext = {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ...options.context
    }

    let userFriendlyError: UserFriendlyError

    // Map API errors to user-friendly messages
    if (error.status === 401) {
      userFriendlyError = {
        message: ERROR_MESSAGES.AUTHENTICATION_ERROR,
        type: 'error',
        code: 'AUTH_ERROR',
        action: {
          label: 'Se reconnecter',
          handler: () => window.location.href = '/login'
        }
      }
    } else if (error.status === 403) {
      userFriendlyError = {
        message: ERROR_MESSAGES.AUTHORIZATION_ERROR,
        type: 'error',
        code: 'PERMISSION_ERROR'
      }
    } else if (error.status === 404) {
      userFriendlyError = {
        message: ERROR_MESSAGES.NAVIGATION_FAILED,
        type: 'warning',
        code: 'NOT_FOUND',
        action: {
          label: 'Retour à l\'accueil',
          handler: () => window.location.href = '/'
        }
      }
    } else if (error.status && error.status >= 500) {
      userFriendlyError = {
        message: ERROR_MESSAGES.SERVER_ERROR,
        type: 'error',
        code: 'SERVER_ERROR',
        action: {
          label: 'Réessayer',
          handler: () => window.location.reload()
        }
      }
    } else if (error.message.includes('fetch')) {
      userFriendlyError = {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'error',
        code: 'NETWORK_ERROR',
        action: {
          label: 'Réessayer',
          handler: () => window.location.reload()
        }
      }
    } else {
      userFriendlyError = {
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        type: 'error',
        code: 'UNKNOWN_ERROR'
      }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Handle image loading errors
   */
  handleImageError(imageUrl: string, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const error = new Error(`Failed to load image: ${imageUrl}`)
    const context: ErrorContext = {
      action: 'image_load',
      timestamp: new Date(),
      ...options.context
    }

    const userFriendlyError: UserFriendlyError = {
      message: ERROR_MESSAGES.IMAGE_LOAD_FAILED,
      type: 'warning',
      code: 'IMAGE_ERROR',
      action: {
        label: 'Réessayer',
        handler: () => window.location.reload()
      }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Handle navigation errors
   */
  handleNavigationError(route: string, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const error = new Error(`Navigation failed to: ${route}`)
    const context: ErrorContext = {
      action: 'navigation',
      timestamp: new Date(),
      ...options.context
    }

    const userFriendlyError: UserFriendlyError = {
      message: ERROR_MESSAGES.NAVIGATION_FAILED,
      type: 'error',
      code: 'NAVIGATION_ERROR',
      action: {
        label: 'Retour à l\'accueil',
        handler: () => window.location.href = '/'
      }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Handle interaction errors (likes/dislikes)
   */
  handleInteractionError(
    type: 'like' | 'dislike', 
    target: 'post' | 'comment', 
    targetId: string,
    options: ErrorHandlerOptions = {}
  ): UserFriendlyError {
    const error = new Error(`${type} ${target} failed: ${targetId}`)
    const context: ErrorContext = {
      action: `${type}_${target}`,
      timestamp: new Date(),
      ...options.context
    }

    let message: string
    if (type === 'like' && target === 'post') {
      message = ERROR_MESSAGES.LIKE_POST_FAILED
    } else if (type === 'dislike' && target === 'post') {
      message = ERROR_MESSAGES.DISLIKE_POST_FAILED
    } else if (type === 'like' && target === 'comment') {
      message = ERROR_MESSAGES.LIKE_COMMENT_FAILED
    } else {
      message = ERROR_MESSAGES.DISLIKE_COMMENT_FAILED
    }

    const userFriendlyError: UserFriendlyError = {
      message,
      type: 'error',
      code: `${type.toUpperCase()}_${target.toUpperCase()}_ERROR`,
      action: {
        label: 'Réessayer',
        handler: () => window.location.reload()
      }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Handle content filter errors
   */
  handleContentFilterError(content: string, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const error = new Error('Content filter applied')
    const context: ErrorContext = {
      action: 'content_filter',
      timestamp: new Date(),
      ...options.context
    }

    const userFriendlyError: UserFriendlyError = {
      message: ERROR_MESSAGES.CONTENT_FILTER_APPLIED,
      type: 'info',
      code: 'CONTENT_FILTERED'
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Handle theme errors
   */
  handleThemeError(themeAction: string, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const error = new Error(`Theme error: ${themeAction}`)
    const context: ErrorContext = {
      action: 'theme_change',
      timestamp: new Date(),
      ...options.context
    }

    const userFriendlyError: UserFriendlyError = {
      message: ERROR_MESSAGES.THEME_CHANGE_FAILED,
      type: 'warning',
      code: 'THEME_ERROR',
      action: {
        label: 'Réinitialiser',
        handler: () => {
          localStorage.removeItem('theme')
          window.location.reload()
        }
      }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Generic error handler
   */
  handleError(error: Error | ApiError, errorType: ErrorType, options: ErrorHandlerOptions = {}): UserFriendlyError {
    const context: ErrorContext = {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ...options.context
    }

    let userFriendlyError: UserFriendlyError

    switch (errorType) {
      case 'NETWORK_ERROR':
        userFriendlyError = {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          type: 'error',
          code: 'NETWORK_ERROR',
          action: {
            label: 'Réessayer',
            handler: () => window.location.reload()
          }
        }
        break
      case 'VALIDATION_ERROR':
        userFriendlyError = {
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          type: 'warning',
          code: 'VALIDATION_ERROR'
        }
        break
      default:
        userFriendlyError = {
          message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
          type: 'error',
          code: errorType
        }
    }

    this.reportError({ error, context, userFriendlyError }, options)
    return userFriendlyError
  }

  /**
   * Report error with logging and optional user notification
   */
  private reportError(report: ErrorReport, options: ErrorHandlerOptions = {}) {
    // Add to internal reports
    this.errorReports.push(report)
    if (this.errorReports.length > this.maxReports) {
      this.errorReports.shift()
    }

    // Log to console if enabled (default: true)
    if (options.logToConsole !== false) {
      console.error('Error Report:', {
        message: report.userFriendlyError.message,
        error: report.error,
        context: report.context,
        timestamp: report.context.timestamp
      })
    }

    // Could be extended to send to external error reporting service
    if (options.reportToService) {
      this.sendToErrorService(report)
    }
  }

  /**
   * Get recent error reports for debugging
   */
  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errorReports.slice(-limit)
  }

  /**
   * Clear error reports
   */
  clearErrors(): void {
    this.errorReports = []
  }

  /**
   * Send error to external service (placeholder)
   */
  private sendToErrorService(report: ErrorReport): void {
    // Placeholder for external error reporting service
    // Could integrate with services like Sentry, LogRocket, etc.
    console.log('Would send to error service:', report)
  }
}

export default ErrorHandler.getInstance()