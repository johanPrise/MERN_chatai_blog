import { FastifyInstance } from 'fastify';
import * as AIController from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

/**
 * Routes pour l'IA
 * @param fastify Instance Fastify
 */
export async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour envoyer un message à l'IA (authentifié)
  fastify.post(
    '/message',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['input', 'sessionId'],
          properties: {
            input: { type: 'string' },
            sessionId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      // @ts-ignore - Ignorer les erreurs de typage pour cette route
      return AIController.sendMessage(request, reply);
    }
  );

  // Route de test pour vérifier que le service AI est fonctionnel
  fastify.get('/test', async () => {
    return {
      message: 'Service d\'IA fonctionnel',
      endpoints: {
        message: '/api/ai/message'
      },
      usage: 'Envoyez une requête POST à /api/ai/message avec un corps JSON contenant "input" et "sessionId"'
    };
  });
}
