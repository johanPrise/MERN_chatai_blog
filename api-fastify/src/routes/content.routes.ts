import { FastifyInstance } from 'fastify';
import * as ContentController from '../controllers/content.controller.js';
import { authenticate, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getContentsSchema,
  getContentSchema,
  createContentSchema,
  updateContentSchema,
  deleteContentSchema,
} from '../schemas/content.schema.js';

/**
 * Routes pour le contenu
 * @param fastify Instance Fastify
 */
export async function contentRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour récupérer tout le contenu
  fastify.get<{
    Querystring: {
      type?: import('../types/content.types.js').ContentType;
      isActive?: boolean;
    }
  }>(
    '/',
    {
      schema: getContentsSchema,
    },
    ContentController.getContents
  );

  // Route pour récupérer un contenu par slug
  fastify.get<{
    Params: { slug: string }
  }>(
    '/:slug',
    {
      schema: getContentSchema,
    },
    ContentController.getContent
  );

  // Route pour créer un nouveau contenu (admin uniquement)
  fastify.post<{
    Body: import('../types/content.types.js').CreateContentInput
  }>(
    '/',
    {
      schema: createContentSchema,
      preHandler: [authenticate, isAdmin],
    },
    ContentController.createContent
  );

  // Route pour mettre à jour un contenu (admin uniquement)
  fastify.put<{
    Params: { id: string };
    Body: import('../types/content.types.js').UpdateContentInput
  }>(
    '/:id',
    {
      schema: updateContentSchema,
      preHandler: [authenticate, isAdmin],
    },
    ContentController.updateContent
  );

  // Route pour supprimer un contenu (admin uniquement)
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: deleteContentSchema,
      preHandler: [authenticate, isAdmin],
    },
    ContentController.deleteContent
  );
}
