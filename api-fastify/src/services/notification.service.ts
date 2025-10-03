import { Notification, INotification } from '../models/notification.model.js';
import { AdminNotification, GetNotificationsResponse, CreateNotificationInput } from '../types/notification.types.js';
import { logger } from './logger.service.js';
import { isValidObjectId } from 'mongoose';

/**
 * Convertit un document MongoDB en objet AdminNotification
 */
function mapNotificationToResponse(notification: INotification): AdminNotification {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    timestamp: notification.timestamp,
    read: notification.read,
    priority: notification.priority,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
  };
}

/**
 * Récupère les notifications avec pagination
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<GetNotificationsResponse> {
  try {
    // Construire le filtre
    const filter: any = {};
    if (unreadOnly) {
      filter.read = false;
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Récupérer les notifications avec pagination
    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ read: false }),
    ]);

    // Calculer les informations de pagination
    const totalPages = Math.ceil(totalNotifications / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      notifications: notifications.map(mapNotificationToResponse),
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications,
        hasNextPage,
        hasPrevPage,
      },
      unreadCount,
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des notifications', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Impossible de récupérer les notifications');
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string): Promise<AdminNotification> {
  try {
    // Valider l'ID MongoDB
if (!isValidObjectId(notificationId)) {
      throw new Error('ID de notification invalide');
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    logger.info(`Notification ${notificationId} marquée comme lue`);
    return mapNotificationToResponse(notification);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Notification non trouvée' || error.message === 'ID de notification invalide')) {
      throw error;
    }
    logger.error(`Erreur lors du marquage de la notification ${notificationId} comme lue`, error instanceof Error ? error : new Error(String(error)));
    throw new Error('Impossible de marquer la notification comme lue');
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(): Promise<{ modifiedCount: number }> {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { read: true }
    );

    logger.info(`${result.modifiedCount} notifications marquées comme lues`);
    return { modifiedCount: result.modifiedCount };
  } catch (error) {
    logger.error('Erreur lors du marquage de toutes les notifications comme lues', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Impossible de marquer toutes les notifications comme lues');
  }
}

/**
 * Crée une nouvelle notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<AdminNotification> {
  try {
    // Validation et sanitisation des données d'entrée
    const sanitizedInput = {
      type: input.type,
      title: input.title.trim().substring(0, 200), // Limiter la longueur
      message: input.message.trim().substring(0, 1000), // Limiter la longueur
      priority: input.priority || 'medium',
      actionUrl: input.actionUrl?.trim().substring(0, 500), // Limiter la longueur
      metadata: input.metadata,
    };

    // Valider le type
    const validTypes = ['user_registered', 'post_published', 'system_error', 'user_activity', 'content_moderation'];
    if (!validTypes.includes(sanitizedInput.type)) {
      throw new Error('Type de notification invalide');
    }

    // Valider la priorité
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(sanitizedInput.priority)) {
      throw new Error('Priorité de notification invalide');
    }

    // Valider que le titre et le message ne sont pas vides
    if (!sanitizedInput.title || !sanitizedInput.message) {
      throw new Error('Le titre et le message sont requis');
    }

    const notification = new Notification({
      type: sanitizedInput.type,
      title: sanitizedInput.title,
      message: sanitizedInput.message,
      priority: sanitizedInput.priority,
      actionUrl: sanitizedInput.actionUrl,
      metadata: sanitizedInput.metadata,
      timestamp: new Date(),
      read: false,
    });

    const savedNotification = await notification.save();
    logger.info(`Nouvelle notification créée: ${savedNotification._id}`);

    return mapNotificationToResponse(savedNotification);
  } catch (error) {
    if (error instanceof Error && (
      error.message === 'Type de notification invalide' ||
      error.message === 'Priorité de notification invalide' ||
      error.message === 'Le titre et le message sont requis'
    )) {
      throw error;
    }
    logger.error('Erreur lors de la création de la notification', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Impossible de créer la notification');
  }
}

/**
 * Supprime les anciennes notifications (plus de 30 jours)
 */
export async function cleanupOldNotifications(): Promise<{ deletedCount: number }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });

    logger.info(`${result.deletedCount} anciennes notifications supprimées`);
    return { deletedCount: result.deletedCount };
  } catch (error) {
    logger.error('Erreur lors du nettoyage des anciennes notifications', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Impossible de nettoyer les anciennes notifications');
  }
}

/**
 * Génère une notification pour un nouvel utilisateur inscrit
 */
export async function generateUserRegistrationNotification(
  userId: string,
  username: string
): Promise<AdminNotification> {
  return createNotification({
    type: 'user_registered',
    title: 'Nouvel utilisateur inscrit',
    message: `L'utilisateur ${username} vient de s'inscrire sur la plateforme.`,
    priority: 'medium',
    actionUrl: `/admin/users/${userId}`,
    metadata: {
      userId,
      username,
    },
  });
}

/**
 * Génère une notification pour un nouveau post publié
 */
export async function generatePostPublishedNotification(
  postId: string,
  postTitle: string,
  authorName: string
): Promise<AdminNotification> {
  return createNotification({
    type: 'post_published',
    title: 'Nouveau post publié',
    message: `${authorName} a publié un nouveau post: "${postTitle}".`,
    priority: 'low',
    actionUrl: `/admin/posts/${postId}`,
    metadata: {
      postId,
      postTitle,
      username: authorName,
    },
  });
}

/**
 * Génère une notification pour une erreur système
 */
export async function generateSystemErrorNotification(
  errorCode: string,
  errorMessage: string
): Promise<AdminNotification> {
  return createNotification({
    type: 'system_error',
    title: 'Erreur système détectée',
    message: `Une erreur système s'est produite: ${errorMessage}`,
    priority: 'high',
    metadata: {
      errorCode,
    },
  });
}