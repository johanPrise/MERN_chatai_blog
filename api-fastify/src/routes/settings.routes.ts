import { FastifyInstance } from 'fastify';

export default async function settingsRoutes(server: FastifyInstance) {
  // Routes paramètres à implémenter
  server.get('/test', async () => {
    return { message: 'Settings routes working' };
  });
}