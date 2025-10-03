import { FastifyRequest, FastifyReply } from 'fastify';
import * as AIService from '../services/ai.service.js';
import { chatCache } from '../services/chat-cache.service.js';

/**
 * Interface pour la requête de message
 */
interface MessageRequest {
  input: string;
  sessionId: string;
}

/**
 * Contrôleur pour envoyer un message à l'IA
 */
export const sendMessage = async (
  request: FastifyRequest<{ Body: MessageRequest }>,
  reply: FastifyReply
) => {
  try {
    const { input, sessionId } = request.body;
    const userId = (request as any).user?.id;

    if (!input || !sessionId) {
      return reply.status(400).send({
        message: 'Le message et l\'identifiant de session sont requis',
      });
    }

    // Vérifier le rate limiting
    if (userId && !(await chatCache.checkRateLimit(userId))) {
      return reply.status(429).send({
        message: 'Trop de requêtes. Attendez une minute.',
        success: false
      });
    }

    // Vérifier le cache des réponses
    let response = await chatCache.getCachedResponse(input);
    
    if (!response) {
      // Pas en cache, demander à l'IA
      response = await AIService.sendMessage(input, sessionId);
      // Sauvegarder en cache
      await chatCache.setCachedResponse(input, response);
    }

    // Ajouter à l'historique de session
    await chatCache.addToSessionHistory(sessionId, {
      input,
      response,
      timestamp: new Date()
    });

    // Retourner la réponse
    return reply.status(200).send({
      response,
      success: true,
      sessionId
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'envoi du message',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};
