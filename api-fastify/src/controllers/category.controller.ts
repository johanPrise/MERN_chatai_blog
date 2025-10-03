import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../types/category.types.js';
import * as CategoryService from '../services/category.service.js';

/**
 * Contrôleur pour récupérer toutes les catégories
 */
export const getCategories = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Utiliser le service pour récupérer toutes les catégories
    const categories = await CategoryService.getAllCategories();

    // Retourner la réponse
    return reply.status(200).send({
      categories,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération des catégories',
    });
  }
};

/**
 * Contrôleur pour récupérer une catégorie par ID ou slug
 */
export const getCategory = async (
  request: FastifyRequest<{ Params: { idOrSlug: string } }>,
  reply: FastifyReply
) => {
  try {
    const { idOrSlug } = request.params;

    try {
      // Utiliser le service pour récupérer la catégorie
      const category = await CategoryService.getCategoryByIdOrSlug(idOrSlug);

      // Retourner la réponse
      return reply.status(200).send({
        category,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Catégorie non trouvée') {
        return reply.status(404).send({
          message: 'Catégorie non trouvée',
        });
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération de la catégorie',
    });
  }
};

/**
 * Contrôleur pour créer une nouvelle catégorie
 */
export const createCategory = async (
  request: FastifyRequest<{ Body: CreateCategoryInput }>,
  reply: FastifyReply
) => {
  try {
    const categoryData = request.body;

    try {
      // Utiliser le service pour créer la catégorie
      const result = await CategoryService.createCategory(categoryData);

      // Retourner la réponse
      return reply.status(201).send({
        message: 'Catégorie créée avec succès',
        category: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Une catégorie avec ce nom existe déjà') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'ID de catégorie parent invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Catégorie parent non trouvée') {
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
      message: 'Une erreur est survenue lors de la création de la catégorie',
    });
  }
};

/**
 * Contrôleur pour mettre à jour une catégorie
 */
export const updateCategory = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryInput }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID catégorie invalide',
      });
    }

    try {
      // Utiliser le service pour mettre à jour la catégorie
      const result = await CategoryService.updateCategory(id, updateData);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Catégorie mise à jour avec succès',
        category: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID catégorie invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Catégorie non trouvée') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Une catégorie avec ce nom existe déjà') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'ID de catégorie parent invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Une catégorie ne peut pas être son propre parent') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Catégorie parent non trouvée') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Référence circulaire détectée dans la hiérarchie des catégories') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Erreur lors de la mise à jour de la catégorie') {
          return reply.status(500).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour de la catégorie',
    });
  }
};

/**
 * Contrôleur pour supprimer une catégorie
 */
export const deleteCategory = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID catégorie invalide',
      });
    }

    try {
      // Utiliser le service pour supprimer la catégorie
      await CategoryService.deleteCategory(id);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Catégorie supprimée avec succès',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID catégorie invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Catégorie non trouvée') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Impossible de supprimer une catégorie qui a des sous-catégories') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Impossible de supprimer une catégorie utilisée par des articles') {
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
      message: 'Une erreur est survenue lors de la suppression de la catégorie',
    });
  }
};
