import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import path from 'path';
import { connectDB } from './config/database.js';
import { registerRoutes } from './routes/index.js';
import { initEmailTransporter } from './services/email.service.js';
import { logger } from './services/logger.service.js';
import { errorLoggerMiddleware } from './middlewares/error-logger.middleware.js';
import { cache } from './services/cache.service.js';

/**
 * Construit et configure le serveur Fastify
 */
export async function buildServer(): Promise<FastifyInstance> {
  // Créer l'instance Fastify
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB pour les images base64
  });

  // Configurer CORS
  await server.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        'https://iwomi-blog.netlify.app',
        'http://localhost:5173',
        'http://localhost:4200',
        'http://localhost:3000',
        'https://mern-chatai-blog.vercel.app',
        'https://mern-chatai-blog-git-main.vercel.app',
        'https://mern-chatai-blog-*.vercel.app',
      ];

      // Autoriser les requêtes sans origine (comme les applications mobiles)
      if (!origin) {
        return cb(null, true);
      }

      // Vérifier si l'origine est dans la liste des origines autorisées
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Gérer les correspondances exactes
        if (allowedOrigin === origin) return true;

        // Gérer les correspondances avec joker
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
          return pattern.test(origin);
        }

        return false;
      });

      if (isAllowed) {
        // Retourner l'origine exacte au lieu de true pour les requêtes avec credentials
        return cb(null, origin);
      }

      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Configurer les cookies
  await server.register(cookie);

  // Configurer JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    },
    cookie: {
      cookieName: 'token',
      signed: false
    },
    messages: {
      badRequestErrorMessage: 'Format de token invalide',
      noAuthorizationInHeaderMessage: 'Token d\'authentification manquant',
      authorizationTokenExpiredMessage: 'Token expiré',
      authorizationTokenInvalid: 'Token invalide',
      authorizationTokenUntrusted: 'Token non fiable'
    }
  });

  // Configurer le multipart pour les uploads de fichiers
  await server.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Configurer le plugin static pour servir les fichiers uploadés
  await server.register(import('@fastify/static'), {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/', // URL prefix pour accéder aux fichiers
  });

  // Connecter à la base de données
  await connectDB();

  // Initialiser Redis
  await cache.connect();

  // Initialiser le transporteur d'emails
  initEmailTransporter();

  // Middleware de logging des erreurs
  server.addHook('onRequest', errorLoggerMiddleware);

  // Enregistrer les routes
  registerRoutes(server);

  // Route de base pour vérifier que le serveur fonctionne
  server.get('/', async () => {
    return { message: 'API is running' };
  });

  // Route par défaut pour les requêtes non gérées
  server.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ message: 'Endpoint non trouvé' });
  });

  // Gestionnaire d'erreur global
  server.setErrorHandler((error, request, reply) => {
    logger.error(
      `Unhandled error: ${error.message}`,
      error,
      {
        userId: (request as any).user?.id,
        endpoint: `${request.method} ${request.url}`,
        ip: request.ip
      }
    );
    
    server.log.error(error);
    reply.status(500).send({
      message: 'Une erreur est survenue sur le serveur',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  });

  return server;
}
