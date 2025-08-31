import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';

/**
 * Contrôleur pour vérifier la santé de l'API
 */
export const checkHealth = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Vérifier la connexion à la base de données
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Retourner la réponse
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    return reply.status(500).send({
      status: 'error',
      message: 'Une erreur est survenue lors de la vérification de la santé de l\'API',
    });
  }
};
