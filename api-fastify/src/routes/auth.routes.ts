import { FastifyInstance } from 'fastify';
import * as AuthController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from '../schemas/auth.schema.js';

/**
 * Routes d'authentification
 * @param fastify Instance Fastify
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Route d'inscription
  fastify.post('/register', { schema: registerSchema }, AuthController.register);

  // Route de connexion
  fastify.post('/login', { schema: loginSchema }, AuthController.login);

  // Route de déconnexion
  fastify.post('/logout', { preHandler: [authenticate] }, AuthController.logout);

  // Route de vérification d'email
  fastify.get('/verify-email/:token', { schema: verifyEmailSchema }, AuthController.verifyEmail);

  // Route de demande de réinitialisation de mot de passe
  fastify.post('/forgot-password', { schema: forgotPasswordSchema }, AuthController.forgotPassword);

  // Route de réinitialisation de mot de passe
  fastify.post('/reset-password', { schema: resetPasswordSchema }, AuthController.resetPassword);

  // Route de changement de mot de passe (protégée)
  fastify.post<{ Body: import('../types/auth.types.js').ChangePasswordInput }>(
    '/change-password',
    {
      schema: changePasswordSchema,
      preHandler: [authenticate],
    },
    AuthController.changePassword
  );

  // Route pour récupérer les informations de l'utilisateur connecté (protégée)
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    AuthController.getMe
  );

  // Route pour vérifier si l'utilisateur est un administrateur (protégée)
  fastify.get(
    '/check-admin',
    {
      preHandler: [authenticate],
    },
    AuthController.checkAdmin
  );

  // Route pour vérifier si l'utilisateur est un auteur, un éditeur ou un administrateur (protégée)
  fastify.get(
    '/check-author',
    {
      preHandler: [authenticate],
    },
    AuthController.checkAuthorEditorAdmin
  );
}
