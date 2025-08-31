/**
 * Client API pour les notifications administrateur
 * Requirement 4.4, 4.5: Endpoints API avec validation et sécurité
 */

import {
  INotificationApiClient,
  GetNotificationsRequest,
  GetNotificationsResponse,
  GetNotificationResponse,
  CreateNotificationRequest,
  CreateNotificationResponse,
  UpdateNotificationRequest,
  UpdateNotificationResponse,
  DeleteNotificationResponse,
  MarkAsReadRequest,
  MarkAllAsReadRequest,
  NotificationStatsResponse,
  BulkUpdateNotificationsRequest,
  NotificationApiConfig,
  NotificationApiErrorResponse
} from '../types/NotificationApi'

/**
 * Implémentation du client API pour les notifications
 */
export class NotificationApiClient implements INotificationApiClient {
  private config: NotificationApiConfig

  constructor(config: NotificationApiConfig) {
    this.config = {
      timeout: 10000, // 10 secondes par défaut
      retryAttempts: 3,
      retryDelay: 1000, // 1 seconde
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      ...config
    }
  }

  /**
   * Récupère la liste des notifications
   */
  async getNotifications(request: GetNotificationsRequest): Promise<GetNotificationsResponse> {
    const url = new URL('/api/admin/notifications', this.config.baseUrl)
    
    // Ajouter les paramètres de requête
    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            url.searchParams.append(key, value.toISOString())
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    if (request.page) url.searchParams.append('page', String(request.page))
    if (request.limit) url.searchParams.append('limit', String(request.limit))
    if (request.sortBy) url.searchParams.append('sortBy', request.sortBy)
    if (request.sortOrder) url.searchParams.append('sortOrder', request.sortOrder)

    return this.makeRequest<GetNotificationsResponse>('GET', url.toString())
  }

  /**
   * Récupère une notification spécifique
   */
  async getNotification(id: string): Promise<GetNotificationResponse> {
    const url = `/api/admin/notifications/${encodeURIComponent(id)}`
    return this.makeRequest<GetNotificationResponse>('GET', url)
  }

  /**
   * Crée une nouvelle notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    const url = '/api/admin/notifications'
    return this.makeRequest<CreateNotificationResponse>('POST', url, request)
  }

  /**
   * Met à jour une notification
   */
  async updateNotification(id: string, request: UpdateNotificationRequest): Promise<UpdateNotificationResponse> {
    const url = `/api/admin/notifications/${encodeURIComponent(id)}`
    return this.makeRequest<UpdateNotificationResponse>('PATCH', url, request)
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(id: string): Promise<DeleteNotificationResponse> {
    const url = `/api/admin/notifications/${encodeURIComponent(id)}`
    return this.makeRequest<DeleteNotificationResponse>('DELETE', url)
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(request: MarkAsReadRequest): Promise<UpdateNotificationResponse> {
    const url = `/api/admin/notifications/${encodeURIComponent(request.notificationId)}/read`
    return this.makeRequest<UpdateNotificationResponse>('PATCH', url)
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(request?: MarkAllAsReadRequest): Promise<{ success: boolean; updatedCount: number }> {
    const url = '/api/admin/notifications/read-all'
    return this.makeRequest<{ success: boolean; updatedCount: number }>('PATCH', url, request)
  }

  /**
   * Met à jour plusieurs notifications en une fois
   */
  async bulkUpdate(request: BulkUpdateNotificationsRequest): Promise<{ success: boolean; updatedCount: number }> {
    const url = '/api/admin/notifications/bulk-update'
    return this.makeRequest<{ success: boolean; updatedCount: number }>('PATCH', url, request)
  }

  /**
   * Récupère les statistiques des notifications
   */
  async getStats(): Promise<NotificationStatsResponse> {
    const url = '/api/admin/notifications/stats'
    return this.makeRequest<NotificationStatsResponse>('GET', url)
  }

  /**
   * Effectue une requête HTTP avec gestion des erreurs et retry
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    body?: any,
    attempt: number = 1
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(fullUrl, {
        method,
        headers: this.config.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        await this.handleHttpError(response)
      }

      const data = await response.json()
      return data as T

    } catch (error) {
      // Retry logic
      if (attempt < (this.config.retryAttempts || 3) && this.shouldRetry(error)) {
        await this.delay((this.config.retryDelay || 1000) * attempt)
        return this.makeRequest<T>(method, url, body, attempt + 1)
      }

      throw this.createApiError(error)
    }
  }

  /**
   * Gère les erreurs HTTP
   */
  private async handleHttpError(response: Response): Promise<never> {
    let errorData: NotificationApiErrorResponse

    try {
      errorData = await response.json()
    } catch {
      errorData = {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText || 'Erreur HTTP inconnue'
        },
        timestamp: new Date().toISOString()
      }
    }

    throw new ApiError(response.status, errorData)
  }

  /**
   * Détermine si une erreur justifie un retry
   */
  private shouldRetry(error: any): boolean {
    // Retry pour les erreurs réseau et les erreurs serveur temporaires
    if (error.name === 'AbortError') return false // Timeout, ne pas retry
    if (error instanceof ApiError) {
      const status = error.status
      return status >= 500 || status === 429 // Erreurs serveur ou rate limiting
    }
    return true // Erreurs réseau
  }

  /**
   * Crée une erreur API standardisée
   */
  private createApiError(originalError: any): Error {
    if (originalError instanceof ApiError) {
      return originalError
    }

    if (originalError.name === 'AbortError') {
      return new Error('Timeout: La requête a pris trop de temps')
    }

    return new Error(`Erreur réseau: ${originalError.message || 'Erreur inconnue'}`)
  }

  /**
   * Utilitaire pour créer un délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly errorData: NotificationApiErrorResponse

  constructor(status: number, errorData: NotificationApiErrorResponse) {
    super(errorData.error.message)
    this.name = 'ApiError'
    this.status = status
    this.errorData = errorData
  }

  /**
   * Vérifie si l'erreur est due à un problème d'authentification
   */
  isAuthenticationError(): boolean {
    return this.errorData.error.code === 'AUTHENTICATION_ERROR' || 
           this.errorData.error.code === 'AUTHORIZATION_ERROR'
  }

  /**
   * Vérifie si l'erreur est due au rate limiting
   */
  isRateLimitError(): boolean {
    return this.errorData.error.code === 'RATE_LIMIT_EXCEEDED'
  }

  /**
   * Vérifie si l'erreur est due à une validation
   */
  isValidationError(): boolean {
    return this.errorData.error.code === 'VALIDATION_ERROR'
  }

  /**
   * Récupère le délai de retry pour les erreurs de rate limiting
   */
  getRetryAfter(): number | null {
    if (this.isRateLimitError() && 'retryAfter' in this.errorData.error) {
      return (this.errorData.error as any).retryAfter
    }
    return null
  }
}

/**
 * Factory function pour créer un client API
 */
export function createNotificationApiClient(config: NotificationApiConfig): NotificationApiClient {
  return new NotificationApiClient(config)
}

/**
 * Configuration par défaut pour l'environnement de développement
 */
export const defaultApiConfig: NotificationApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json'
  }
}