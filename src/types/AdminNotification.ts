/**
 * Types pour le système de notifications administrateur
 * Basé sur les requirements 2.1, 2.2, 4.1
 */

/**
 * Types de notifications disponibles dans le système
 */
export type NotificationType = 
  | 'user_registered'
  | 'post_published'
  | 'system_error'
  | 'user_activity'
  | 'content_moderation'

/**
 * Niveaux de priorité des notifications
 */
export type NotificationPriority = 'low' | 'medium' | 'high'

/**
 * Métadonnées optionnelles pour les notifications
 * Contient des informations contextuelles selon le type de notification
 */
export interface NotificationMetadata {
  userId?: string
  postId?: string
  username?: string
  postTitle?: string
  errorCode?: string
  [key: string]: any // Permet d'ajouter d'autres métadonnées spécifiques
}

/**
 * Interface principale pour une notification administrateur
 * Requirement 2.1: Notifications avec informations réelles et pertinentes
 * Requirement 4.1: Notifications basées sur des événements réels du système
 */
export interface AdminNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: NotificationPriority
  actionUrl?: string // URL optionnelle pour rediriger vers la section concernée
  metadata?: NotificationMetadata
}

/**
 * Props pour le composant NotificationPanel
 * Requirement 2.2: Gestion des interactions utilisateur avec les notifications
 */
export interface NotificationPanelProps {
  notifications: AdminNotification[]
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: AdminNotification) => void
  isLoading?: boolean
  error?: string | any
  onRetry?: () => void
  connectionStatus?: 'online' | 'offline' | 'checking'
}

/**
 * Props pour un élément de notification individuel
 */
export interface NotificationItemProps {
  notification: AdminNotification
  onMarkAsRead: (id: string) => void
  onNotificationClick: (notification: AdminNotification) => void
}

/**
 * Props pour le bouton de notifications dans le header
 */
export interface NotificationButtonProps {
  unreadCount: number
  isOpen: boolean
  onClick: () => void
}

/**
 * Interface pour les réponses API des notifications
 */
export interface NotificationApiResponse {
  notifications: AdminNotification[]
  total: number
  unreadCount: number
}

/**
 * Interface pour les requêtes de création de notification
 */
export interface CreateNotificationRequest {
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  actionUrl?: string
  metadata?: NotificationMetadata
}

/**
 * Interface pour les requêtes de mise à jour de notification
 */
export interface UpdateNotificationRequest {
  read?: boolean
}

/**
 * Types pour les événements de notification en temps réel
 */
export interface NotificationEvent {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted'
  notification: AdminNotification
}

/**
 * Interface pour les paramètres de filtrage des notifications
 */
export interface NotificationFilters {
  type?: NotificationType
  read?: boolean
  priority?: NotificationPriority
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

/**
 * Interface pour les statistiques de notifications
 */
export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
}