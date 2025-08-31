/**
 * Service de gestion des notifications administrateur
 * Requirement 2.2: Service pour gérer les notifications réelles
 * Requirement 2.4: Gestion des erreurs et fallbacks
 * Requirement 4.5: Persistance côté serveur
 */

import {
  AdminNotification,
  NotificationFilters,
  NotificationStats,
  CreateNotificationRequest,
  NotificationType,
  NotificationPriority
} from '../types/AdminNotification'

import {
  INotificationService,
  NotificationListener,
  NotificationServiceConfig,
  NotificationServiceState,
  NotificationServiceError,
  UserRegistrationData,
  PostPublishedData,
  SystemErrorData,
  UserActivityData,
  ContentModerationData,
  NotificationGenerators
} from '../types/NotificationService'

import {
  INotificationApiClient,
  GetNotificationsRequest,
  MarkAsReadRequest,
  MarkAllAsReadRequest
} from '../types/NotificationApi'

/**
 * Implémentation du service de notifications
 */
export class NotificationService implements INotificationService, NotificationGenerators {
  private notifications: AdminNotification[] = []
  private listeners: NotificationListener[] = []
  private state: NotificationServiceState = 'idle'
  private config: NotificationServiceConfig
  private apiClient: INotificationApiClient
  private pollingInterval?: NodeJS.Timeout
  private cache: Map<string, AdminNotification> = new Map()
  private lastError?: NotificationServiceError

  constructor(config: NotificationServiceConfig, apiClient: INotificationApiClient) {
    this.config = {
      pollingInterval: 30000, // 30 secondes par défaut
      maxNotifications: 100,
      autoMarkAsReadDelay: 5000, // 5 secondes
      enableRealTimeUpdates: true,
      ...config
    }
    this.apiClient = apiClient
  }

  /**
   * Récupère les notifications depuis l'API
   * Requirement 2.2: Récupération des notifications triées par date
   */
  async fetchNotifications(filters?: NotificationFilters): Promise<AdminNotification[]> {
    try {
      this.setState('loading')
      
      const request: GetNotificationsRequest = {
        filters,
        limit: this.config.maxNotifications,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }

      const response = await this.apiClient.getNotifications(request)
      
      if (response.success) {
        this.notifications = response.data.notifications
        this.updateCache(this.notifications)
        this.setState('connected')
        this.notifyListeners()
        return this.notifications
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (error) {
      this.handleError('FETCH_NOTIFICATIONS_ERROR', 'Erreur lors de la récupération des notifications', error)
      this.setState('error')
      // Retourner les notifications en cache en cas d'erreur
      return Array.from(this.cache.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    }
  }

  /**
   * Récupère une notification par son ID
   */
  async getNotificationById(id: string): Promise<AdminNotification | null> {
    try {
      // Vérifier d'abord le cache
      if (this.cache.has(id)) {
        return this.cache.get(id)!
      }

      const response = await this.apiClient.getNotification(id)
      
      if (response.success) {
        this.cache.set(id, response.data)
        return response.data
      }
      
      return null
    } catch (error) {
      this.handleError('GET_NOTIFICATION_ERROR', `Erreur lors de la récupération de la notification ${id}`, error)
      return this.cache.get(id) || null
    }
  }

  /**
   * Récupère les statistiques des notifications
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await this.apiClient.getStats()
      
      if (response.success) {
        return {
          total: response.data.total,
          unread: response.data.unread,
          byType: response.data.byType as Record<NotificationType, number>,
          byPriority: response.data.byPriority as Record<NotificationPriority, number>
        }
      }
      
      throw new Error('Failed to fetch notification stats')
    } catch (error) {
      this.handleError('GET_STATS_ERROR', 'Erreur lors de la récupération des statistiques', error)
      // Retourner des statistiques basées sur le cache
      return this.calculateStatsFromCache()
    }
  }

  /**
   * Marque une notification comme lue
   * Requirement 2.2: Marquage des notifications comme lues
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Mise à jour optimiste
      this.updateNotificationInCache(notificationId, { read: true })
      this.notifyListeners()

      const request: MarkAsReadRequest = { notificationId }
      const response = await this.apiClient.markAsRead(request)
      
      if (!response.success) {
        // Rollback en cas d'échec
        this.updateNotificationInCache(notificationId, { read: false })
        this.notifyListeners()
        throw new Error('Failed to mark notification as read')
      }
    } catch (error) {
      this.handleError('MARK_AS_READ_ERROR', `Erreur lors du marquage de la notification ${notificationId}`, error)
      throw error
    }
  }

  /**
   * Marque toutes les notifications comme lues
   * Requirement 2.4: Marquage en masse des notifications
   */
  async markAllAsRead(): Promise<void> {
    try {
      // Mise à jour optimiste
      const previousState = new Map(this.cache)
      this.notifications.forEach(notification => {
        if (!notification.read) {
          this.updateNotificationInCache(notification.id, { read: true })
        }
      })
      this.notifyListeners()

      const request: MarkAllAsReadRequest = {}
      const response = await this.apiClient.markAllAsRead(request)
      
      if (!response.success) {
        // Rollback en cas d'échec
        this.cache = previousState
        this.notifications = Array.from(this.cache.values())
        this.notifyListeners()
        throw new Error('Failed to mark all notifications as read')
      }
    } catch (error) {
      this.handleError('MARK_ALL_AS_READ_ERROR', 'Erreur lors du marquage de toutes les notifications', error)
      throw error
    }
  }

  /**
   * Crée une nouvelle notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<AdminNotification> {
    try {
      const response = await this.apiClient.createNotification(request)
      
      if (response.success) {
        this.cache.set(response.data.id, response.data)
        this.notifications.unshift(response.data)
        this.notifyListeners()
        return response.data
      }
      
      throw new Error('Failed to create notification')
    } catch (error) {
      this.handleError('CREATE_NOTIFICATION_ERROR', 'Erreur lors de la création de la notification', error)
      throw error
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const response = await this.apiClient.deleteNotification(id)
      
      if (response.success) {
        this.cache.delete(id)
        this.notifications = this.notifications.filter(n => n.id !== id)
        this.notifyListeners()
      } else {
        throw new Error('Failed to delete notification')
      }
    } catch (error) {
      this.handleError('DELETE_NOTIFICATION_ERROR', `Erreur lors de la suppression de la notification ${id}`, error)
      throw error
    }
  }

  /**
   * S'abonne aux changements de notifications
   * Requirement 2.2: Système de subscription pour les mises à jour
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener)
    
    // Envoyer immédiatement les notifications actuelles
    listener(this.notifications)
    
    // Retourner la fonction de désabonnement
    return () => {
      this.unsubscribe(listener)
    }
  }

  /**
   * Se désabonne des changements de notifications
   */
  unsubscribe(listener: NotificationListener): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    try {
      const stats = await this.getNotificationStats()
      return stats.unread
    } catch (error) {
      // Fallback sur le cache local
      return this.notifications.filter(n => !n.read).length
    }
  }

  /**
   * Nettoie les anciennes notifications
   */
  async clearOldNotifications(olderThanDays: number): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      
      const oldNotifications = this.notifications.filter(
        n => new Date(n.timestamp) < cutoffDate
      )
      
      for (const notification of oldNotifications) {
        await this.deleteNotification(notification.id)
      }
    } catch (error) {
      this.handleError('CLEAR_OLD_NOTIFICATIONS_ERROR', 'Erreur lors du nettoyage des anciennes notifications', error)
      throw error
    }
  }

  // Méthodes privées pour la gestion interne

  private setState(newState: NotificationServiceState): void {
    if (this.state !== newState) {
      this.state = newState
      // Ici on pourrait émettre un événement de changement d'état
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.notifications)
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }

  private updateCache(notifications: AdminNotification[]): void {
    this.cache.clear()
    notifications.forEach(notification => {
      this.cache.set(notification.id, notification)
    })
  }

  private updateNotificationInCache(id: string, updates: Partial<AdminNotification>): void {
    const notification = this.cache.get(id)
    if (notification) {
      const updated = { ...notification, ...updates }
      this.cache.set(id, updated)
      
      // Mettre à jour aussi dans le tableau des notifications
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications[index] = updated
      }
    }
  }

  private calculateStatsFromCache(): NotificationStats {
    const notifications = Array.from(this.cache.values())
    
    const byType: Record<NotificationType, number> = {
      user_registered: 0,
      post_published: 0,
      system_error: 0,
      user_activity: 0,
      content_moderation: 0
    }
    
    const byPriority: Record<NotificationPriority, number> = {
      low: 0,
      medium: 0,
      high: 0
    }
    
    let unread = 0
    
    notifications.forEach(notification => {
      byType[notification.type]++
      byPriority[notification.priority]++
      if (!notification.read) {
        unread++
      }
    })
    
    return {
      total: notifications.length,
      unread,
      byType,
      byPriority
    }
  }

  private handleError(code: string, message: string, originalError: any): void {
    this.lastError = {
      code,
      message,
      details: originalError
    }
    
    console.error(`NotificationService Error [${code}]:`, message, originalError)
  }
  //Méthodes de génération de notifications
  // Requirement 2.1, 4.1, 4.2, 4.3: Génération basée sur des événements réels

  /**
   * Génère une notification pour un nouvel utilisateur inscrit
   * Requirement 4.1: Notification lors de l'inscription d'un nouvel utilisateur
   */
  generateUserRegistrationNotification(data: UserRegistrationData): AdminNotification {
    const notification: AdminNotification = {
      id: this.generateId(),
      type: 'user_registered',
      title: 'Nouvel utilisateur inscrit',
      message: `${data.username} (${data.email}) s'est inscrit sur la plateforme`,
      timestamp: data.registrationDate,
      read: false,
      priority: 'medium',
      actionUrl: `/admin/users/${data.userId}`,
      metadata: {
        userId: data.userId,
        username: data.username
      }
    }

    this.validateAndSanitizeNotification(notification)
    return notification
  }

  /**
   * Génère une notification pour un nouveau post publié
   * Requirement 4.2: Notification pour les nouvelles publications
   */
  generatePostPublishedNotification(data: PostPublishedData): AdminNotification {
    const notification: AdminNotification = {
      id: this.generateId(),
      type: 'post_published',
      title: 'Nouveau post publié',
      message: `${data.authorName} a publié "${this.truncateText(data.title, 50)}"`,
      timestamp: data.publishedDate,
      read: false,
      priority: 'low',
      actionUrl: `/admin/posts/${data.postId}`,
      metadata: {
        postId: data.postId,
        postTitle: data.title,
        userId: data.authorId,
        username: data.authorName
      }
    }

    this.validateAndSanitizeNotification(notification)
    return notification
  }

  /**
   * Génère une notification pour une erreur système
   * Requirement 4.3: Notification d'erreur système
   */
  generateSystemErrorNotification(data: SystemErrorData): AdminNotification {
    const priorityMap: Record<string, NotificationPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'high'
    }

    const notification: AdminNotification = {
      id: this.generateId(),
      type: 'system_error',
      title: `Erreur système - ${data.component}`,
      message: `${data.errorMessage} (Code: ${data.errorCode})`,
      timestamp: data.timestamp,
      read: false,
      priority: priorityMap[data.severity] || 'medium',
      actionUrl: `/admin/system/errors/${data.errorCode}`,
      metadata: {
        errorCode: data.errorCode
      }
    }

    this.validateAndSanitizeNotification(notification)
    return notification
  }

  /**
   * Génère une notification pour une activité utilisateur
   */
  generateUserActivityNotification(data: UserActivityData): AdminNotification {
    const notification: AdminNotification = {
      id: this.generateId(),
      type: 'user_activity',
      title: 'Activité utilisateur',
      message: `${data.username}: ${data.activity}`,
      timestamp: data.timestamp,
      read: false,
      priority: 'low',
      actionUrl: `/admin/users/${data.userId}/activity`,
      metadata: {
        userId: data.userId,
        username: data.username,
        ...data.metadata
      }
    }

    this.validateAndSanitizeNotification(notification)
    return notification
  }

  /**
   * Génère une notification pour la modération de contenu
   */
  generateContentModerationNotification(data: ContentModerationData): AdminNotification {
    const priorityMap: Record<string, NotificationPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high'
    }

    const notification: AdminNotification = {
      id: this.generateId(),
      type: 'content_moderation',
      title: 'Contenu signalé',
      message: `${data.contentType} signalé pour: ${data.reportReason}`,
      timestamp: data.timestamp,
      read: false,
      priority: priorityMap[data.severity] || 'medium',
      actionUrl: `/admin/moderation/${data.contentType}/${data.contentId}`,
      metadata: {
        postId: data.contentType === 'post' ? data.contentId : undefined,
        userId: data.contentType === 'user_profile' ? data.contentId : undefined
      }
    }

    this.validateAndSanitizeNotification(notification)
    return notification
  }

  // Méthodes utilitaires privées

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Valide et sanitise une notification
   * Requirement 2.1: Validation et sanitisation des données
   */
  private validateAndSanitizeNotification(notification: AdminNotification): void {
    // Validation des champs requis
    if (!notification.id || !notification.type || !notification.title || !notification.message) {
      throw new Error('Notification invalide: champs requis manquants')
    }

    // Sanitisation du titre et du message
    notification.title = this.sanitizeText(notification.title)
    notification.message = this.sanitizeText(notification.message)

    // Validation de l'URL d'action
    if (notification.actionUrl && !this.isValidUrl(notification.actionUrl)) {
      delete notification.actionUrl
    }

    // Validation de la priorité
    const validPriorities: NotificationPriority[] = ['low', 'medium', 'high']
    if (!validPriorities.includes(notification.priority)) {
      notification.priority = 'medium'
    }

    // Validation du type
    const validTypes: NotificationType[] = [
      'user_registered', 'post_published', 'system_error', 'user_activity', 'content_moderation'
    ]
    if (!validTypes.includes(notification.type)) {
      throw new Error(`Type de notification invalide: ${notification.type}`)
    }
  }

  private sanitizeText(text: string): string {
    // Supprime les balises HTML et les caractères dangereux
    return text
      .replace(/<[^>]*>/g, '') // Supprime les balises HTML
      .replace(/[<>&"']/g, '') // Supprime les caractères dangereux
      .trim()
      .substring(0, 500) // Limite la longueur
  }

  private isValidUrl(url: string): boolean {
    // Validation basique d'URL relative ou absolue
    return /^(\/|https?:\/\/)/.test(url)
  }

  /**
   * Démarre le polling automatique des notifications
   */
  startPolling(): void {
    if (this.pollingInterval) {
      this.stopPolling()
    }

    if (this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.pollingInterval = setInterval(() => {
        this.fetchNotifications().catch(error => {
          console.error('Error during polling:', error)
        })
      }, this.config.pollingInterval)
    }
  }

  /**
   * Arrête le polling automatique
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
    }
  }

  /**
   * Nettoie les ressources du service
   */
  dispose(): void {
    this.stopPolling()
    this.listeners = []
    this.cache.clear()
    this.notifications = []
  }

  /**
   * Récupère l'état actuel du service
   */
  getState(): NotificationServiceState {
    return this.state
  }

  /**
   * Récupère la dernière erreur
   */
  getLastError(): NotificationServiceError | undefined {
    return this.lastError
  }
}

/**
 * Factory function pour créer une instance du service de notifications
 */
export function createNotificationService(
  config: NotificationServiceConfig,
  apiClient: INotificationApiClient
): NotificationService {
  return new NotificationService(config, apiClient)
}

/**
 * Instance singleton du service (optionnel)
 */
let notificationServiceInstance: NotificationService | null = null

export function getNotificationService(): NotificationService | null {
  return notificationServiceInstance
}

export function setNotificationService(service: NotificationService): void {
  notificationServiceInstance = service
}