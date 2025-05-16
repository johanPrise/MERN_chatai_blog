import { FastifyRequest, FastifyReply } from 'fastify';
import * as AIService from '../services/ai.service.js';

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

    if (!input || !sessionId) {
      return reply.status(400).send({
        message: 'Le message et l\'identifiant de session sont requis',
      });
    }

    // Envoyer le message à l'IA
    const response = await AIService.sendMessage(input, sessionId);

    // Retourner la réponse
    return reply.status(200).send({
      response,
      success: true,
      sessionId
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'envoi du message',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};
