import { FastifyInstance } from 'fastify';
import * as UploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const uploadResponseSchema = {
  200: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      url: { type: 'string' },
      urls: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          optimized: { type: 'string' },
          thumbnail: { type: 'string' }
        }
      }
    }
  }
};

const fileUploadSchema = {
  response: uploadResponseSchema
};

const base64UploadSchema = {
  body: {
    type: 'object',
    required: ['filename', 'data'],
    properties: {
      filename: { type: 'string' },
      data: { type: 'string' }
    }
  },
  response: uploadResponseSchema
};

/**
 * Routes pour les uploads
 * @param fastify Instance Fastify
 */
export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/file', { preHandler: [authenticate], schema: fileUploadSchema }, UploadController.uploadFile);
  
  fastify.post<{ Body: { filename: string; data: string } }>(
    '/base64',
    { preHandler: [authenticate], schema: base64UploadSchema },
    UploadController.uploadBase64Image
  );

  fastify.get('/test', async () => ({
    message: 'Service d\'upload fonctionnel',
    uploadEndpoints: {
      file: '/api/uploads/file',
      base64: '/api/uploads/base64'
    },
    note: 'Les fichiers uploadés sont accessibles via /uploads/{filename}'
  }));
}
