import { FastifyRequest, FastifyReply } from 'fastify';
import { UpdateUserInput, UserRole } from '../types/user.types.js';
import * as UserService from '../services/user.service.js';

/**
 * Contrôleur pour récupérer tous les utilisateurs (avec pagination)
 */
export const getUsers = async (
  request: FastifyRequest<{
    Querystring: { page?: number; limit?: number; search?: string }
  }>,
  reply: FastifyReply
) => {
  try {
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const search = request.query.search || '';

    const result = await UserService.getAllUsers(page, limit, search);

    // Retourner la réponse
    return reply.status(200).send(result);
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération des utilisateurs',
    });
  }
};

/**
 * Contrôleur pour récupérer un utilisateur par ID
 */
export const getUserById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    try {
      const user = await UserService.getUserById(id);

      // Retourner la réponse
      return reply.status(200).send({
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération de l\'utilisateur',
    });
  }
};

/**
 * Contrôleur pour mettre à jour un utilisateur
 */
export const updateUser = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserInput }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const currentUserId = request.user._id;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const currentUserRole = request.user.role;

    try {
      const updatedUser = await UserService.updateUser(id, updateData, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message.includes('autorisé')) {
          return reply.status(403).send({
            message: error.message,
          });
        } else if (error.message.includes('déjà utilisé')) {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur',
    });
  }
};

/**
 * Contrôleur pour supprimer un utilisateur
 */
export const deleteUser = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const currentUserId = request.user._id;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const currentUserRole = request.user.role;

    try {
      await UserService.deleteUser(id, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message.includes('autorisé')) {
          return reply.status(403).send({
            message: error.message,
          });
        } else if (error.message.includes('Impossible de supprimer')) {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la suppression de l\'utilisateur',
    });
  }
};

/**
 * Contrôleur pour changer le rôle d'un utilisateur
 */
export const changeUserRole = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { role: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { role } = request.body;

    try {
      const userWithNewRole = await UserService.changeUserRole(id, role as UserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Rôle de l\'utilisateur modifié avec succès',
        user: userWithNewRole,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message.includes('Impossible de rétrograder')) {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du changement de rôle de l\'utilisateur',
    });
  }
};

/**
 * Contrôleur pour récupérer le profil de l'utilisateur connecté
 */
export const getUserProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const userId = request.user._id;

    try {
      const user = await UserService.getUserProfile(userId);

      // Retourner la réponse
      return reply.status(200).send({
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération du profil utilisateur',
    });
  }
};

/**
 * Contrôleur pour mettre à jour le profil de l'utilisateur connecté
 */
export const updateUserProfile = async (
  request: FastifyRequest<{ Body: UpdateUserInput }>,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const userId = request.user._id;
    const updateData = request.body;

    try {
      const updatedUser = await UserService.updateUserProfile(userId, updateData);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Profil mis à jour avec succès',
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('invalide')) {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message.includes('non trouvé')) {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message.includes('déjà utilisé')) {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour du profil utilisateur',
    });
  }
};

/**
 * Contrôleur pour supprimer le compte de l'utilisateur connecté
 */
export const deleteOwnAccount = async (
  request: any,
  reply: any
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }
    const userId = request.user._id
    await UserService.deleteUser(userId, userId, request.user.role)
    return reply.status(200).send({ message: "Compte utilisateur supprimé avec succès" })
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({ message: "Une erreur est survenue lors de la suppression du compte utilisateur" })
  }
}
