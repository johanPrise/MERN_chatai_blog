import { FastifyRequest, FastifyReply } from 'fastify';
import { onSystemError } from '../services/notification-hooks.service.js';

/**
 * Middleware pour capturer les erreurs et créer des notifications système
 */
export const errorNotificationMiddleware = async (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Créer une notification d'erreur système pour les erreurs critiques
  if (reply.statusCode >= 500) {
    try {
      const errorCode = `HTTP_${reply.statusCode}`;
      const errorMessage = `Erreur ${reply.statusCode} sur ${request.method} ${request.url}: ${error.message}`;
      
      // Créer la notification de manière asynchrone pour ne pas bloquer la réponse
      onSystemError(errorCode, errorMessage, {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        userId: (request as any).user?._id,
      }).catch(notifError => {
        request.log.error('Failed to create error notification:', notifError);
      });
    } catch (notifError) {
      request.log.error('Failed to create error notification:', notifError);
    }
  }

  // Continuer avec la gestion d'erreur normale
  throw error;
};

/**
 * Plugin Fastify pour enregistrer le middleware d'erreur
 */
export const errorNotificationPlugin = async (fastify: any) => {
  fastify.setErrorHandler(errorNotificationMiddleware);
};