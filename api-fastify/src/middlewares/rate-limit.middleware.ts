import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../services/cache.service.js';

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes par fenêtre
  keyGenerator?: (request: FastifyRequest) => string; // Générateur de clé personnalisé
  skipSuccessfulRequests?: boolean; // Ignorer les requêtes réussies
  skipFailedRequests?: boolean; // Ignorer les requêtes échouées
}

/**
 * Middleware de rate limiting générique
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (request: FastifyRequest) => request.ip,
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const key = `rate_limit:${keyGenerator(request)}`;
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const windowKey = `${key}:${windowStart}`;

      // Récupérer le nombre de requêtes dans la fenêtre actuelle
      const currentRequests = await cache.get<number>(windowKey) || 0;

      // Vérifier si la limite est dépassée
      if (currentRequests >= maxRequests) {
        const resetTime = windowStart + windowMs;
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

        reply.header('X-RateLimit-Limit', maxRequests);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('X-RateLimit-Reset', resetTime);
        reply.header('Retry-After', retryAfter);

        return reply.status(429).send({
          message: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter,
        });
      }

      // Incrémenter le compteur
      const newCount = currentRequests + 1;
      const ttl = Math.ceil((windowStart + windowMs - Date.now()) / 1000);
      await cache.set(windowKey, newCount, ttl);

      // Ajouter les headers de rate limiting
      reply.header('X-RateLimit-Limit', maxRequests);
      reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - newCount));
      reply.header('X-RateLimit-Reset', windowStart + windowMs);

      // Note: Skip logic simplified - counting all requests for consistency
    } catch (error) {
      // En cas d'erreur avec Redis, on laisse passer la requête
      request.log.error('Erreur dans le rate limiting:', error);
    }
  };
}

/**
 * Rate limiting spécifique pour les notifications admin
 * 100 requêtes par minute par utilisateur
 */
export const notificationRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (request: FastifyRequest) => {
    // Utiliser l'ID utilisateur si disponible, sinon l'IP
    // Type-safe access to request.user._id
    const userId = request.user?._id;
    return userId ? String(userId) : request.ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Ne pas compter les erreurs serveur
});

/**
 * Rate limiting plus strict pour les actions de modification
 * 30 requêtes par minute par utilisateur
 */
export const notificationModifyRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyGenerator: (request: FastifyRequest) => {
    // Type-safe access to request.user._id
    const userId = request.user?._id;
    return userId ? String(userId) : request.ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});