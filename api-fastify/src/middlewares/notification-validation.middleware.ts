import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';

/**
 * Valide l'ID de notification dans les paramètres
 */
export const validateNotificationId = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;

  // Vérifier que l'ID est présent
  if (!id) {
    return reply.status(400).send({
      message: 'ID de notification requis',
    });
  }

  // Vérifier que l'ID est une chaîne non vide
  if (typeof id !== 'string' || id.trim().length === 0) {
    return reply.status(400).send({
      message: 'ID de notification invalide',
    });
  }

  // Vérifier que l'ID est un ObjectId MongoDB valide
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return reply.status(400).send({
      message: 'Format d\'ID de notification invalide',
    });
  }
};

/**
 * Valide les paramètres de requête pour la récupération des notifications
 */
export const validateNotificationQuery = async (
  request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  const { page, limit, unreadOnly } = request.query;

  // Valider le numéro de page
  if (page !== undefined) {
    if (!Number.isInteger(page) || page < 1) {
      return reply.status(400).send({
        message: 'Le numéro de page doit être un entier positif',
      });
    }

    if (page > 10000) {
      return reply.status(400).send({
        message: 'Le numéro de page ne peut pas dépasser 10000',
      });
    }
  }

  // Valider la limite
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1) {
      return reply.status(400).send({
        message: 'La limite doit être un entier positif',
      });
    }

    if (limit > 100) {
      return reply.status(400).send({
        message: 'La limite ne peut pas dépasser 100 notifications par page',
      });
    }
  }

  // Valider unreadOnly
  if (unreadOnly !== undefined && typeof unreadOnly !== 'boolean') {
    return reply.status(400).send({
      message: 'Le paramètre unreadOnly doit être un booléen',
    });
  }
};

/**
 * Sanitise les paramètres d'entrée pour éviter les injections
 */
export const sanitizeInput = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Sanitiser les paramètres de requête
  if (request.query) {
    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value === 'string') {
        // Supprimer les caractères potentiellement dangereux
        (request.query as any)[key] = value.replace(/[<>\"'&]/g, '');
      }
    }
  }

  // Sanitiser les paramètres d'URL
  if (request.params) {
    for (const [key, value] of Object.entries(request.params)) {
      if (typeof value === 'string') {
        (request.params as any)[key] = value.replace(/[<>\"'&]/g, '');
      }
    }
  }
};