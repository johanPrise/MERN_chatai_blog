import { FastifyInstance } from 'fastify';
import * as HealthController from '../controllers/health.controller.js';

/**
 * Routes pour la santé de l'API
 * @param fastify Instance Fastify
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour vérifier la santé de l'API
  fastify.get('/', HealthController.checkHealth);
}
