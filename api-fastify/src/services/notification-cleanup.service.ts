import { cleanupOldNotifications } from './notification.service.js';
import { logger } from './logger.service.js';

/**
 * Service pour le nettoyage automatique des anciennes notifications
 */

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Démarre le nettoyage automatique des anciennes notifications
 * @param intervalHours - Intervalle en heures entre chaque nettoyage (défaut: 24h)
 */
export function startNotificationCleanup(intervalHours: number = 24): void {
  // Arrêter le nettoyage existant s'il y en a un
  stopNotificationCleanup();

  const intervalMs = intervalHours * 60 * 60 * 1000; // Convertir en millisecondes

  logger.info(`[NotificationCleanup] Starting automatic cleanup every ${intervalHours} hours`);

  // Exécuter le nettoyage immédiatement
  performCleanup();

  // Programmer le nettoyage périodique
  cleanupInterval = setInterval(() => {
    performCleanup();
  }, intervalMs);
}

/**
 * Arrête le nettoyage automatique des notifications
 */
export function stopNotificationCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('[NotificationCleanup] Automatic cleanup stopped');
  }
}

/**
 * Exécute le nettoyage des anciennes notifications
 */
async function performCleanup(): Promise<void> {
  try {
    logger.info('[NotificationCleanup] Starting cleanup of old notifications');
    
    const result = await cleanupOldNotifications();
    
    logger.info(`[NotificationCleanup] Cleanup completed: ${result.deletedCount} notifications deleted`);
  } catch (error) {
    logger.error('[NotificationCleanup] Failed to cleanup old notifications:', error as Error);
  }
}

/**
 * Exécute un nettoyage manuel des anciennes notifications
 */
export async function manualCleanup(): Promise<{ deletedCount: number }> {
  logger.info('[NotificationCleanup] Manual cleanup requested');
  
  try {
    const result = await cleanupOldNotifications();
    
    logger.info(`[NotificationCleanup] Manual cleanup completed: ${result.deletedCount} notifications deleted`);
    
    return result;
  } catch (error) {
    logger.error('[NotificationCleanup] Manual cleanup failed:', error as Error);
    throw error;
  }
}

/**
 * Obtient le statut du service de nettoyage
 */
export function getCleanupStatus(): { isRunning: boolean; intervalHours?: number } {
  return {
    isRunning: cleanupInterval !== null,
    intervalHours: cleanupInterval ? 24 : undefined, // Valeur par défaut
  };
}