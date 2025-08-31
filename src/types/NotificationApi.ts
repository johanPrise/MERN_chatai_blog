/**
 * Types pour les API endpoints des notifications
 * Requirement 4.4, 4.5: Endpoints API avec validation et sécurité
 */

import { AdminNotification, NotificationFilters, CreateNotificationRequest, UpdateNotificationRequest } from './AdminNotification'

/**
 * Réponses API pour les notifications
 */
export interface GetNotificationsResponse {
  success: boolean
  data: {
    notifications: AdminNotification[]
    total: number
    unreadCount: number
    hasMore: boolean
  }
  message?: string
}

export interface GetNotificationResponse {
  success: boolean
  data: AdminNotification
  message?: string
}

export interface CreateNotificationResponse {
  success: boolean
  data: AdminNotification
  message?: string
}

export interface UpdateNotificationResponse {
  success: boolean
  data: AdminNotification
  message?: string
}

export interface DeleteNotificationResponse {
  success: boolean
  message?: string
}

export interface NotificationStatsResponse {
  success: boolean
  data: {
    total: number
    unread: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    recentActivity: {
      today: number
      thisWeek: number
      thisMonth: number
    }
  }
  message?: string
}

/**
 * Requêtes API pour les notifications
 */
export interface GetNotificationsRequest {
  filters?: NotificationFilters
  page?: number
  limit?: number
  sortBy?: 'timestamp' | 'priority' | 'type'
  sortOrder?: 'asc' | 'desc'
}

export interface MarkAsReadRequest {
  notificationId: string
}

export interface MarkAllAsReadRequest {
  filters?: Pick<NotificationFilters, 'type' | 'priority'>
}

export interface BulkUpdateNotificationsRequest {
  notificationIds: string[]
  updates: UpdateNotificationRequest
}

/**
 * Types pour les erreurs API
 */
export interface NotificationApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

/**
 * Types pour la validation des requêtes
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationErrorResponse {
  success: false
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    validationErrors: ValidationError[]
  }
  timestamp: string
}

/**
 * Types pour l'authentification et l'autorisation
 */
export interface AuthenticationError {
  success: false
  error: {
    code: 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR'
    message: string
  }
  timestamp: string
}

/**
 * Types pour le rate limiting
 */
export interface RateLimitError {
  success: false
  error: {
    code: 'RATE_LIMIT_EXCEEDED'
    message: string
    retryAfter: number // en secondes
  }
  timestamp: string
}

/**
 * Union type pour toutes les réponses d'erreur possibles
 */
export type NotificationApiErrorResponse = 
  | NotificationApiError
  | ValidationErrorResponse
  | AuthenticationError
  | RateLimitError

/**
 * Types pour les endpoints WebSocket (temps réel)
 */
export interface NotificationWebSocketMessage {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted' | 'bulk_update'
  data: AdminNotification | AdminNotification[]
  timestamp: string
}

export interface NotificationWebSocketError {
  type: 'error'
  error: {
    code: string
    message: string
  }
  timestamp: string
}

/**
 * Configuration pour les appels API
 */
export interface NotificationApiConfig {
  baseUrl: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  headers?: Record<string, string>
}

/**
 * Interface pour le client API des notifications
 */
export interface INotificationApiClient {
  getNotifications(request: GetNotificationsRequest): Promise<GetNotificationsResponse>
  getNotification(id: string): Promise<GetNotificationResponse>
  createNotification(request: CreateNotificationRequest): Promise<CreateNotificationResponse>
  updateNotification(id: string, request: UpdateNotificationRequest): Promise<UpdateNotificationResponse>
  deleteNotification(id: string): Promise<DeleteNotificationResponse>
  markAsRead(request: MarkAsReadRequest): Promise<UpdateNotificationResponse>
  markAllAsRead(request?: MarkAllAsReadRequest): Promise<{ success: boolean; updatedCount: number }>
  bulkUpdate(request: BulkUpdateNotificationsRequest): Promise<{ success: boolean; updatedCount: number }>
  getStats(): Promise<NotificationStatsResponse>
}