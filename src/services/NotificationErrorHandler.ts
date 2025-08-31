/**
 * Service de gestion d'erreurs pour les notifications
 * Requirement 2.2, 2.4: Gestion d'erreurs avec messages utilisateur et retry
 */

export interface NotificationError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
  retryAfter?: number
  details?: any
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export interface ErrorHandlerConfig {
  showUserMessages: boolean
  logErrors: boolean
  retryConfig: RetryConfig
}

export class NotificationErrorHandler {
  private config: ErrorHandlerConfig
  private retryAttempts: Map<string, number> = new Map()

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      showUserMessages: true,
      logErrors: true,
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2
      },
      ...config
    }
  }

  /**
   * Traite une erreur et retourne une erreur normalisée
   */
  handleError(error: any, context: string): NotificationError {
    const normalizedError = this.normalizeError(error, context)
    
    if (this.config.logErrors) {
      console.error(`[NotificationError] ${context}:`, normalizedError)
    }

    return normalizedError
  }

  /**
   * Normalise différents types d'erreurs
   */
  private normalizeError(error: any, context: string): NotificationError {
    // Erreur réseau
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion réseau',
        userMessage: 'Problème de connexion. Vérifiez votre connexion internet.',
        retryable: true
      }
    }

    // Timeout
    if (error.name === 'AbortError') {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Timeout de la requête',
        userMessage: 'La requête a pris trop de temps. Réessayez.',
        retryable: true
      }
    }

    // Erreur API
    if (error.status) {
      return this.handleHttpError(error)
    }

    // Erreur générique
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
      userMessage: 'Une erreur inattendue s\'est produite. Réessayez.',
      retryable: true,
      details: error
    }
  }

  /**
   * Gère les erreurs HTTP spécifiques
   */
  private handleHttpError(error: any): NotificationError {
    const status = error.status
    const errorData = error.errorData

    switch (status) {
      case 400:
        return {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          userMessage: 'Les données envoyées sont invalides.',
          retryable: false,
          details: errorData
        }

      case 401:
        return {
          code: 'AUTHENTICATION_ERROR',
          message: 'Non authentifié',
          userMessage: 'Vous devez vous reconnecter.',
          retryable: false
        }

      case 403:
        return {
          code: 'AUTHORIZATION_ERROR',
          message: 'Non autorisé',
          userMessage: 'Vous n\'avez pas les permissions nécessaires.',
          retryable: false
        }

      case 404:
        return {
          code: 'NOT_FOUND_ERROR',
          message: 'Ressource non trouvée',
          userMessage: 'La notification demandée n\'existe plus.',
          retryable: false
        }

      case 429:
        return {
          code: 'RATE_LIMIT_ERROR',
          message: 'Trop de requêtes',
          userMessage: 'Trop de requêtes. Attendez un moment.',
          retryable: true,
          retryAfter: error.getRetryAfter?.() || 60000
        }

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: 'Erreur serveur',
          userMessage: 'Problème temporaire du serveur. Réessayez.',
          retryable: true
        }

      default:
        return {
          code: 'HTTP_ERROR',
          message: `Erreur HTTP ${status}`,
          userMessage: 'Une erreur s\'est produite. Réessayez.',
          retryable: status >= 500,
          details: errorData
        }
    }
  }

  /**
   * Détermine si une opération peut être retentée
   */
  canRetry(operationId: string, error: NotificationError): boolean {
    if (!error.retryable) {
      return false
    }

    const attempts = this.retryAttempts.get(operationId) || 0
    return attempts < this.config.retryConfig.maxAttempts
  }

  /**
   * Calcule le délai avant le prochain retry
   */
  getRetryDelay(operationId: string, error: NotificationError): number {
    if (error.retryAfter) {
      return error.retryAfter
    }

    const attempts = this.retryAttempts.get(operationId) || 0
    const delay = Math.min(
      this.config.retryConfig.baseDelay * Math.pow(this.config.retryConfig.backoffFactor, attempts),
      this.config.retryConfig.maxDelay
    )

    return delay + Math.random() * 1000 // Jitter
  }

  /**
   * Enregistre une tentative de retry
   */
  recordRetryAttempt(operationId: string): void {
    const attempts = this.retryAttempts.get(operationId) || 0
    this.retryAttempts.set(operationId, attempts + 1)
  }

  /**
   * Réinitialise les tentatives pour une opération
   */
  resetRetryAttempts(operationId: string): void {
    this.retryAttempts.delete(operationId)
  }

  /**
   * Exécute une opération avec retry automatique
   */
  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: NotificationError) => void
  ): Promise<T> {
    this.resetRetryAttempts(operationId)

    while (true) {
      try {
        const result = await operation()
        this.resetRetryAttempts(operationId)
        return result
      } catch (error) {
        const normalizedError = this.handleError(error, operationId)
        
        if (!this.canRetry(operationId, normalizedError)) {
          throw normalizedError
        }

        const delay = this.getRetryDelay(operationId, normalizedError)
        this.recordRetryAttempt(operationId)
        
        const attempt = this.retryAttempts.get(operationId) || 0
        onRetry?.(attempt, normalizedError)

        await this.delay(delay)
      }
    }
  }

  /**
   * Utilitaire pour créer un délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Nettoie les tentatives anciennes
   */
  cleanup(): void {
    this.retryAttempts.clear()
  }
}

/**
 * Instance singleton du gestionnaire d'erreurs
 */
export const notificationErrorHandler = new NotificationErrorHandler()