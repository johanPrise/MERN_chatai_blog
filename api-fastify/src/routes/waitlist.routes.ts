import { FastifyInstance } from 'fastify';
import * as WaitlistController from '../controllers/waitlist.controller.js';
import { joinWaitlistSchema } from '../schemas/waitlist.schema.js';
import { createRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';
import { JoinWaitlistInput } from '../types/waitlist.types.js';

// Limite anti-spam : 5 inscriptions par minute et par IP
const waitlistRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 5,
});

/**
 * Routes pour la liste d'attente
 * @param fastify Instance Fastify
 */
export async function waitlistRoutes(fastify: FastifyInstance): Promise<void> {
  // Route publique pour rejoindre la liste d'attente
  fastify.post<{ Body: JoinWaitlistInput }>(
    '/',
    {
      schema: joinWaitlistSchema,
      preHandler: [waitlistRateLimit],
    },
    WaitlistController.joinWaitlist
  );
}
