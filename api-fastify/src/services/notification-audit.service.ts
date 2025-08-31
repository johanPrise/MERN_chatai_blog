import { logger } from './logger.service.js';

export interface NotificationAuditEvent {
  action: 'get_notifications' | 'mark_as_read' | 'mark_all_as_read' | 'create_notification';
  userId?: string;
  notificationId?: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service d'audit pour les notifications
 */
class NotificationAuditService {
  /**
   * Enregistre un événement d'audit
   */
  logEvent(event: NotificationAuditEvent): void {
    const message = `Audit notification - ${event.success ? 'Succès' : 'Échec'} - Action: ${event.action}${event.notificationId ? ` - NotificationId: ${event.notificationId}` : ''}${event.error ? ` - Erreur: ${event.error}` : ''}`;

    const logContext = {
      userId: event.userId,
      endpoint: `notification_${event.action}`,
      ip: event.ip,
    };

    if (event.success) {
      logger.info(message, logContext);
    } else {
      logger.warn(message, logContext);
    }
  }

  /**
   * Enregistre un accès aux notifications
   */
  logNotificationAccess(
    userId: string,
    ip: string,
    userAgent: string | undefined,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      action: 'get_notifications',
      userId,
      ip,
      userAgent,
      timestamp: new Date(),
      success,
      error,
      metadata,
    });
  }

  /**
   * Enregistre un marquage de notification comme lue
   */
  logMarkAsRead(
    userId: string,
    notificationId: string,
    ip: string,
    success: boolean,
    error?: string
  ): void {
    this.logEvent({
      action: 'mark_as_read',
      userId,
      notificationId,
      ip,
      timestamp: new Date(),
      success,
      error,
    });
  }

  /**
   * Enregistre un marquage de toutes les notifications comme lues
   */
  logMarkAllAsRead(
    userId: string,
    ip: string,
    success: boolean,
    modifiedCount?: number,
    error?: string
  ): void {
    this.logEvent({
      action: 'mark_all_as_read',
      userId,
      ip,
      timestamp: new Date(),
      success,
      error,
      metadata: { modifiedCount },
    });
  }

  /**
   * Enregistre la création d'une notification
   */
  logNotificationCreation(
    notificationId: string,
    type: string,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.logEvent({
      action: 'create_notification',
      notificationId,
      ip: 'system',
      timestamp: new Date(),
      success,
      error,
      metadata: { type, ...metadata },
    });
  }

  /**
   * Détecte les activités suspectes
   */
  detectSuspiciousActivity(
    userId: string,
    action: string,
    ip: string,
  ): boolean {
    // Cette méthode pourrait être étendue pour détecter des patterns suspects
    // comme trop de requêtes dans un court laps de temps, etc.

    logger.info(`Vérification d'activité suspecte - Action: ${action}`, {
      userId,
      endpoint: `notification_${action}`,
      ip,
    });

    // Pour l'instant, on retourne false (pas d'activité suspecte détectée)
    // Dans une implémentation complète, on pourrait utiliser Redis pour
    // tracker les activités récentes et détecter des anomalies
    return false;
  }
}

export const notificationAudit = new NotificationAuditService();
