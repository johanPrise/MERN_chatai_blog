/**
 * Service de notifications amélioré avec gestion d'erreurs et cache
 * Requirement 2.4, 4.5: Cache local, synchronisation et gestion d'erreurs
 */

import { NotificationService } from './NotificationService'
import { notificationErrorHandler, NotificationError } from './NotificationErrorHandler'
import { notificationCache } from './NotificationCache'
import { connectionMonitor, ConnectionStatus } from './ConnectionMonitor'
import { AdminNotification } from '../types/AdminNotification'

export class EnhancedNotificationService extends NotificationService {
  private connectionStatus: ConnectionStatus = 'online'
  private syncInProgress = false

  constructor(config: any, apiClient: any) {
    super(config, apiClient)
    this.initializeEnhancements()
  }

  private initializeEnhancements(): void {
    // Surveiller la connectivité
    connectionMonitor.subscribe((status) => {
      this.connectionStatus = status
      if (status === 'online' && !this.syncInProgress) {
        this.syncPendingActions()
      }
    })

    // Nettoyer le cache périodiquement
    setInterval(() => {
      notificationCache.cleanup()
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Récupère les notifications avec cache et fallback
   */
  async fetchNotifications(filters?: any): Promise<AdminNotification[]> {
    const cacheKey = `notifications_${JSON.stringify(filters || {})}`
    
    // Essayer le cache d'abord
    const cached = notificationCache.get(cacheKey)
    if (cached && this.connectionStatus === 'offline') {
      return cached
    }

    try {
      const result = await notificationErrorHandler.executeWithRetry(
        'fetch_notifications',
        () => super.fetchNotifications(filters)
      )
      
      // Mettre en cache le résultat
      notificationCache.set(cacheKey, result)
      return result
    } catch (error) {
      // Fallback sur le cache en cas d'erreur
      if (cached) {
        return cached
      }
      throw error
    }
  }

  /**
   * Marque une notification comme lue avec mise à jour optimiste
   */
  async markAsRead(notificationId: string): Promise<void> {
    const cacheKey = 'notifications_default'
    
    // Mise à jour optimiste du cache
    notificationCache.updateNotification(cacheKey, notificationId, { read: true })
    
    if (this.connectionStatus === 'offline') {
      // Ajouter à la queue de synchronisation
      notificationCache.addPendingAction({
        id: `mark_read_${notificationId}_${Date.now()}`,
        type: 'mark_read',
        data: { notificationId }
      })
      return
    }

    try {
      await notificationErrorHandler.executeWithRetry(
        `mark_read_${notificationId}`,
        () => super.markAsRead(notificationId)
      )
    } catch (error) {
      // Rollback en cas d'erreur
      notificationCache.updateNotification(cacheKey, notificationId, { read: false })
      
      // Ajouter à la queue si c'est une erreur réseau
      if (error instanceof Error && error.message.includes('réseau')) {
        notificationCache.addPendingAction({
          id: `mark_read_${notificationId}_${Date.now()}`,
          type: 'mark_read',
          data: { notificationId }
        })
      } else {
        throw error
      }
    }
  }

  /**
   * Synchronise les actions en attente
   */
  private async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || this.connectionStatus !== 'online') {
      return
    }

    this.syncInProgress = true
    const pendingActions = notificationCache.getPendingActions()

    for (const action of pendingActions) {
      try {
        switch (action.type) {
          case 'mark_read':
            await super.markAsRead(action.data.notificationId)
            break
          case 'mark_all_read':
            await super.markAllAsRead()
            break
        }
        
        notificationCache.removePendingAction(action.id)
      } catch (error) {
        console.error('Failed to sync action:', action, error)
        // Garder l'action pour un prochain essai
      }
    }

    this.syncInProgress = false
  }

  /**
   * Récupère le statut de connexion
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Force la synchronisation
   */
  async forcSync(): Promise<void> {
    await this.syncPendingActions()
  }

  /**
   * Vide le cache et les actions en attente
   */
  clearCache(): void {
    notificationCache.clear()
  }
}

export { notificationErrorHandler, connectionMonitor }