/**
 * Types pour le service de gestion des notifications
 * Requirement 2.2: Service pour gérer les notifications réelles
 */

import { AdminNotification, NotificationFilters, NotificationStats, CreateNotificationRequest } from './AdminNotification'

/**
 * Interface pour le service de notifications
 */
export interface INotificationService {
  // Méthodes de récupération
  fetchNotifications(filters?: NotificationFilters): Promise<AdminNotification[]>
  getNotificationById(id: string): Promise<AdminNotification | null>
  getNotificationStats(): Promise<NotificationStats>
  
  // Méthodes de modification
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(): Promise<void>
  createNotification(request: CreateNotificationRequest): Promise<AdminNotification>
  deleteNotification(id: string): Promise<void>
  
  // Méthodes de subscription
  subscribe(listener: NotificationListener): () => void
  unsubscribe(listener: NotificationListener): void
  
  // Méthodes utilitaires
  getUnreadCount(): Promise<number>
  clearOldNotifications(olderThanDays: number): Promise<void>
}

/**
 * Type pour les listeners de notifications
 */
export type NotificationListener = (notifications: AdminNotification[]) => void

/**
 * Configuration pour le service de notifications
 */
export interface NotificationServiceConfig {
  apiBaseUrl: string
  pollingInterval?: number // en millisecondes
  maxNotifications?: number
  autoMarkAsReadDelay?: number // en millisecondes
  enableRealTimeUpdates?: boolean
}

/**
 * États possibles du service de notifications
 */
export type NotificationServiceState = 
  | 'idle'
  | 'loading'
  | 'error'
  | 'connected'
  | 'disconnected'

/**
 * Interface pour les erreurs du service de notifications
 */
export interface NotificationServiceError {
  code: string
  message: string
  details?: any
}

/**
 * Interface pour les événements du service
 */
export interface NotificationServiceEvent {
  type: 'state_changed' | 'notification_received' | 'error_occurred'
  data: any
  timestamp: Date
}

/**
 * Types pour les générateurs de notifications spécifiques
 */
export interface UserRegistrationData {
  userId: string
  username: string
  email: string
  registrationDate: Date
}

export interface PostPublishedData {
  postId: string
  title: string
  authorId: string
  authorName: string
  publishedDate: Date
  category?: string
}

export interface SystemErrorData {
  errorCode: string
  errorMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string
  timestamp: Date
  stackTrace?: string
}

export interface UserActivityData {
  userId: string
  username: string
  activity: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ContentModerationData {
  contentId: string
  contentType: 'post' | 'comment' | 'user_profile'
  reportReason: string
  reportedBy: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
}

/**
 * Interface pour les générateurs de notifications
 */
export interface NotificationGenerators {
  generateUserRegistrationNotification(data: UserRegistrationData): AdminNotification
  generatePostPublishedNotification(data: PostPublishedData): AdminNotification
  generateSystemErrorNotification(data: SystemErrorData): AdminNotification
  generateUserActivityNotification(data: UserActivityData): AdminNotification
  generateContentModerationNotification(data: ContentModerationData): AdminNotification
}