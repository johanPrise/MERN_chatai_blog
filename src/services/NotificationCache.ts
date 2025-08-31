/**
 * Service de cache local pour les notifications
 * Requirement 2.4, 4.5: Cache local avec TTL et synchronisation
 */

import { AdminNotification } from '../types/AdminNotification'

interface CacheEntry {
  data: AdminNotification[]
  timestamp: number
  ttl: number
}

interface PendingAction {
  id: string
  type: 'mark_read' | 'mark_all_read' | 'create' | 'delete'
  data: any
  timestamp: number
}

export class NotificationCache {
  private cache = new Map<string, CacheEntry>()
  private pendingActions: PendingAction[] = []
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Met en cache les notifications
   */
  set(key: string, notifications: AdminNotification[], ttl?: number): void {
    this.cache.set(key, {
      data: [...notifications],
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  /**
   * Récupère les notifications du cache
   */
  get(key: string): AdminNotification[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return [...entry.data]
  }

  /**
   * Met à jour une notification dans le cache
   */
  updateNotification(key: string, notificationId: string, updates: Partial<AdminNotification>): void {
    const entry = this.cache.get(key)
    if (!entry) return

    const index = entry.data.findIndex(n => n.id === notificationId)
    if (index > -1) {
      entry.data[index] = { ...entry.data[index], ...updates }
    }
  }

  /**
   * Ajoute une action en attente pour synchronisation
   */
  addPendingAction(action: Omit<PendingAction, 'timestamp'>): void {
    this.pendingActions.push({
      ...action,
      timestamp: Date.now()
    })
  }

  /**
   * Récupère les actions en attente
   */
  getPendingActions(): PendingAction[] {
    return [...this.pendingActions]
  }

  /**
   * Supprime une action en attente
   */
  removePendingAction(actionId: string): void {
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId)
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingActions = []
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const notificationCache = new NotificationCache()