import { FastifyInstance } from 'fastify';
import * as UploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

/**
 * Routes pour les uploads
 * @param fastify Instance Fastify
 */
export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour l'upload de fichier (authentifié)
  fastify.post(
    '/file',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // @ts-ignore - Ignorer les erreurs de typage pour cette route
      return UploadController.uploadFile(request, reply);
    }
  );

  // Route pour l'upload d'image en base64 (authentifié)
  fastify.post(
    '/base64',
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['filename', 'data'],
          properties: {
            filename: { type: 'string' },
            data: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      // @ts-ignore - Ignorer les erreurs de typage pour cette route
      return UploadController.uploadBase64Image(request, reply);
    }
  );

  // Route de test pour vérifier que les fichiers sont correctement servis
  // Cette route n'est pas nécessaire si le plugin @fastify/static est correctement configuré
  fastify.get('/test', async () => {
    return {
      message: 'Service d\'upload fonctionnel',
      uploadEndpoints: {
        file: '/api/uploads/file',
        base64: '/api/uploads/base64'
      },
      note: 'Les fichiers uploadés sont accessibles via /uploads/{filename}'
    };
  });
}
