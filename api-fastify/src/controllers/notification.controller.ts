import { FastifyRequest, FastifyReply } from 'fastify';
import { GetNotificationsQuery, MarkAsReadParams } from '../types/notification.types.js';
import * as NotificationService from '../services/notification.service.js';
import { manualCleanup, getCleanupStatus } from '../services/notification-cleanup.service.js';
import { logger } from '../services/logger.service.js';
import { notificationAudit } from '../services/notification-audit.service.js';

/**
 * Contrôleur pour récupérer les notifications admin
 */
export const getNotifications = async (
  request: FastifyRequest<{
    Querystring: GetNotificationsQuery;
  }>,
  reply: FastifyReply
) => {
  try {
    const page = request.query.page || 1;
    const limit = Math.min(request.query.limit || 50, 100); // Limiter à 100 max
    const unreadOnly = request.query.unreadOnly || false;
    const userId = request.user._id;

    const result = await NotificationService.getNotifications(page, limit, unreadOnly);

    // Audit de l'accès réussi
    notificationAudit.logNotificationAccess(
      userId,
      request.ip,
      request.headers['user-agent'],
      true,
      undefined,
      { page, limit, unreadOnly, resultCount: result.notifications.length }
    );

    return reply.status(200).send(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Audit de l'échec
    notificationAudit.logNotificationAccess(
      request.user?._id || 'unknown',
      request.ip,
      request.headers['user-agent'],
      false,
      errorMessage
    );

    logger.error('Erreur lors de la récupération des notifications', error, {
      userId: request.user?._id,
      ip: request.ip,
    });
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération des notifications',
    });
  }
};

/**
 * Contrôleur pour marquer une notification comme lue
 */
export const markNotificationAsRead = async (
  request: FastifyRequest<{
    Params: MarkAsReadParams;
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    try {
      const notification = await NotificationService.markNotificationAsRead(id);

      // Audit du succès
      notificationAudit.logMarkAsRead(userId, id, request.ip, true);

      return reply.status(200).send({
        message: 'Notification marquée comme lue avec succès',
        notification,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (error instanceof Error && error.message === 'Notification non trouvée') {
        // Audit de l'échec - notification non trouvée
        notificationAudit.logMarkAsRead(userId, id, request.ip, false, errorMessage);
        
        return reply.status(404).send({
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Audit de l'échec
    notificationAudit.logMarkAsRead(
      request.user?._id || 'unknown',
      request.params.id,
      request.ip,
      false,
      errorMessage
    );

    logger.error('Erreur lors du marquage de la notification', error, {
      notificationId: request.params.id,
      userId: request.user?._id,
      ip: request.ip,
    });
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du marquage de la notification',
    });
  }
};

/**
 * Contrôleur pour marquer toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = request.user._id;

    const result = await NotificationService.markAllNotificationsAsRead();

    // Audit du succès
    notificationAudit.logMarkAllAsRead(userId, request.ip, true, result.modifiedCount);

    return reply.status(200).send({
      message: `${result.modifiedCount} notifications marquées comme lues avec succès`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Audit de l'échec
    notificationAudit.logMarkAllAsRead(
      request.user?._id || 'unknown',
      request.ip,
      false,
      undefined,
      errorMessage
    );

    logger.error('Erreur lors du marquage de toutes les notifications', error, {
      userId: request.user?._id,
      ip: request.ip,
    });
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du marquage de toutes les notifications',
    });
  }
};

/**
 * Contrôleur pour déclencher un nettoyage manuel des anciennes notifications
 */
export const cleanupOldNotifications = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = request.user._id;

    const result = await manualCleanup();

    logger.info('Nettoyage manuel des notifications déclenché', {
      userId,
      deletedCount: result.deletedCount,
      ip: request.ip,
    });

    return reply.status(200).send({
      message: `${result.deletedCount} anciennes notifications supprimées avec succès`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error('Erreur lors du nettoyage manuel des notifications', error instanceof Error ? error : new Error(String(error)), {
      userId: request.user?._id,
      ip: request.ip,
    });
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du nettoyage des notifications',
    });
  }
};

/**
 * Contrôleur pour obtenir le statut du service de nettoyage
 */
export const getCleanupServiceStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const status = getCleanupStatus();

    return reply.status(200).send({
      message: 'Statut du service de nettoyage récupéré avec succès',
      status,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du statut de nettoyage', error instanceof Error ? error : new Error(String(error)), {
      userId: request.user?._id,
      ip: request.ip,
    });
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération du statut',
    });
  }
};