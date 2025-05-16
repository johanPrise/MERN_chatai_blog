import { FastifyInstance } from 'fastify';
import * as UserController from '../controllers/user.controller.js';
import { authenticate, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema,
  changeUserRoleSchema,
  updateProfileSchema,
} from '../schemas/user.schema.js';

/**
 * Routes utilisateur
 * @param fastify Instance Fastify
 */
export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour récupérer le profil de l'utilisateur connecté
  fastify.get(
    '/profile',
    {
      preHandler: [authenticate],
    },
    UserController.getUserProfile
  );

  // Route pour mettre à jour le profil de l'utilisateur connecté
  fastify.put<{
    Body: import('../types/user.types.js').UpdateUserInput
  }>(
    '/profile',
    {
      schema: updateProfileSchema,
      preHandler: [authenticate],
    },
    UserController.updateUserProfile
  );

  // Route pour récupérer tous les utilisateurs (admin uniquement)
  fastify.get<{
    Querystring: { page?: number; limit?: number; search?: string }
  }>(
    '/',
    {
      schema: getUsersSchema,
      preHandler: [authenticate, isAdmin],
    },
    UserController.getUsers
  );

  // Route pour récupérer un utilisateur par ID
  fastify.get<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: getUserByIdSchema,
      preHandler: [authenticate],
    },
    UserController.getUserById
  );

  // Route pour mettre à jour un utilisateur
  fastify.put<{
    Params: { id: string };
    Body: import('../types/user.types.js').UpdateUserInput
  }>(
    '/:id',
    {
      schema: updateUserSchema,
      preHandler: [authenticate],
    },
    UserController.updateUser
  );

  // Route pour supprimer un utilisateur
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: deleteUserSchema,
      preHandler: [authenticate],
    },
    UserController.deleteUser
  );

  // Route pour changer le rôle d'un utilisateur (admin uniquement)
  fastify.patch<{
    Params: { id: string };
    Body: { role: string }
  }>(
    '/:id/role',
    {
      schema: changeUserRoleSchema,
      preHandler: [authenticate, isAdmin],
    },
    UserController.changeUserRole
  );

  // Route pour supprimer le compte de l'utilisateur connecté
  fastify.delete(
    '/delete-account',
    {
      preHandler: [authenticate],
    },
    UserController.deleteOwnAccount
  );
}
