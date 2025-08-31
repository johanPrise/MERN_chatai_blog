import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { postRoutes } from './post.routes.js';
import { commentRoutes } from './comment.routes.js';
import { categoryRoutes } from './category.routes.js';
import { contentRoutes } from './content.routes.js';
import { uploadRoutes } from './upload.routes.js';
import { aiRoutes } from './ai.routes.js';
import { healthRoutes } from './health.routes.js';
import { notificationRoutes } from './notification.routes.js';


/**
 * Enregistre toutes les routes de l'application
 * @param server Instance Fastify
 */
export function registerRoutes(server: FastifyInstance): void {
  // Préfixe API
  const API_PREFIX = '/api';

  // Enregistrer les routes d'authentification
  server.register(authRoutes, { prefix: `${API_PREFIX}/auth` });

  // Enregistrer les routes utilisateur
  server.register(userRoutes, { prefix: `${API_PREFIX}/users` });

  // Enregistrer les routes des articles
  server.register(postRoutes, { prefix: `${API_PREFIX}/posts` });

  // Enregistrer les routes des commentaires
  server.register(commentRoutes, { prefix: `${API_PREFIX}/comments` });

  // Enregistrer les routes des catégories
  server.register(categoryRoutes, { prefix: `${API_PREFIX}/categories` });

  // Enregistrer les routes des contenus
  server.register(contentRoutes, { prefix: `${API_PREFIX}/content` });

  // Enregistrer les routes d'upload
  server.register(uploadRoutes, { prefix: `${API_PREFIX}/uploads` });

  // Enregistrer les routes d'IA
  server.register(aiRoutes, { prefix: `${API_PREFIX}/ai` });

  // Enregistrer les routes de santé
  server.register(healthRoutes, { prefix: `${API_PREFIX}/health` });

  // Enregistrer les routes des notifications admin
  server.register(notificationRoutes, { prefix: `${API_PREFIX}/admin/notifications` });

}
