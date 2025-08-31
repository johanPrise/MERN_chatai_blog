import { 
  generateUserRegistrationNotification,
  generatePostPublishedNotification,
  generateSystemErrorNotification
} from './notification.service.js';
import { logger } from './logger.service.js';

/**
 * Service pour gérer les hooks de notifications liés aux événements réels du système
 */

/**
 * Hook appelé lors de l'inscription d'un nouvel utilisateur
 */
export async function onUserRegistered(userId: string, username: string, email: string): Promise<void> {
  try {
    logger.info(`[NotificationHooks] User registered: ${username} (${userId})`);
    
    await generateUserRegistrationNotification(userId, username);
    
    logger.info(`[NotificationHooks] User registration notification created for ${username}`);
  } catch (error) {
    logger.error(`[NotificationHooks] Failed to create user registration notification for ${username}:`, error as Error);
    // Ne pas faire échouer l'inscription si la notification échoue
  }
}

/**
 * Hook appelé lors de la publication d'un nouveau post
 */
export async function onPostPublished(postId: string, postTitle: string, authorId: string, authorName: string): Promise<void> {
  try {
    logger.info(`[NotificationHooks] Post published: "${postTitle}" by ${authorName} (${postId})`);
    
    await generatePostPublishedNotification(postId, postTitle, authorName);
    
    logger.info(`[NotificationHooks] Post publication notification created for "${postTitle}"`);
  } catch (error) {
    logger.error(`[NotificationHooks] Failed to create post publication notification for "${postTitle}":`, error as Error);
    // Ne pas faire échouer la publication si la notification échoue
  }
}

/**
 * Hook appelé lors d'une erreur système
 */
export async function onSystemError(errorCode: string, errorMessage: string, context?: any): Promise<void> {
  try {
    logger.info(`[NotificationHooks] System error occurred: ${errorCode} - ${errorMessage}`);
    
    await generateSystemErrorNotification(errorCode, errorMessage);
    
    logger.info(`[NotificationHooks] System error notification created for ${errorCode}`);
  } catch (error) {
    logger.error(`[NotificationHooks] Failed to create system error notification for ${errorCode}:`, error as Error);
    // Ne pas faire échouer le processus si la notification échoue
  }
}

/**
 * Hook appelé lors d'activité utilisateur suspecte
 */
export async function onSuspiciousActivity(userId: string, username: string, activityType: string, details: string): Promise<void> {
  try {
    logger.info(`[NotificationHooks] Suspicious activity detected: ${activityType} by ${username} (${userId})`);
    
    // Créer une notification d'activité suspecte
    const { createNotification } = await import('./notification.service.js');
    await createNotification({
      type: 'user_activity',
      title: 'Activité suspecte détectée',
      message: `Activité suspecte de ${username}: ${details}`,
      priority: 'high',
      actionUrl: `/admin/users/${userId}`,
      metadata: {
        userId,
        username,
      },
    });
    
    logger.info(`[NotificationHooks] Suspicious activity notification created for ${username}`);
  } catch (error) {
    logger.error(`[NotificationHooks] Failed to create suspicious activity notification for ${username}:`, error as Error);
  }
}

/**
 * Hook appelé lors de modération de contenu
 */
export async function onContentModeration(postId: string, postTitle: string, authorName: string, moderationType: string, reason: string): Promise<void> {
  try {
    logger.info(`[NotificationHooks] Content moderation: ${moderationType} for post "${postTitle}" by ${authorName}`);
    
    // Créer une notification de modération de contenu
    const { createNotification } = await import('./notification.service.js');
    await createNotification({
      type: 'content_moderation',
      title: 'Modération de contenu requise',
      message: `Post "${postTitle}" de ${authorName} nécessite une modération: ${reason}`,
      priority: 'medium',
      actionUrl: `/admin/posts/${postId}`,
      metadata: {
        postId,
        postTitle,
        username: authorName,
      },
    });
    
    logger.info(`[NotificationHooks] Content moderation notification created for "${postTitle}"`);
  } catch (error) {
    logger.error(`[NotificationHooks] Failed to create content moderation notification for "${postTitle}":`, error as Error);
  }
}

/**
 * Wrapper pour capturer et notifier les erreurs système automatiquement
 */
export function withErrorNotification<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorContext: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Créer une notification d'erreur système
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = `${errorContext}_ERROR`;
      
      // Appeler le hook d'erreur système de manière asynchrone pour ne pas bloquer
      onSystemError(errorCode, errorMessage, { context: errorContext, args }).catch(notifError => {
        logger.error(`[NotificationHooks] Failed to create error notification:`, notifError);
      });
      
      // Re-lancer l'erreur originale
      throw error;
    }
  };
}