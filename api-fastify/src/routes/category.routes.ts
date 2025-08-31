import { FastifyInstance } from 'fastify';
import * as CategoryController from '../controllers/category.controller.js';
import { authenticate, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getCategoriesSchema,
  getCategorySchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '../schemas/category.schema.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../types/category.types.js';

/**
 * Routes pour les catégories
 * @param fastify Instance Fastify
 */
export async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour récupérer toutes les catégories
  fastify.get(
    '/',
    {
      schema: getCategoriesSchema,
    },
    CategoryController.getCategories
  );

  // Route pour récupérer une catégorie par ID ou slug
  fastify.get<{
    Params: { idOrSlug: string }
  }>(
    '/:idOrSlug',
    {
      schema: getCategorySchema,
    },
    CategoryController.getCategory
  );

  // Route pour créer une nouvelle catégorie (admin uniquement)
  fastify.post<{
    Body: CreateCategoryInput
  }>(
    '/',
    {
      schema: createCategorySchema,
      preHandler: [authenticate, isAdmin],
    },
    CategoryController.createCategory
  );

  // Route pour mettre à jour une catégorie (admin uniquement)
  fastify.put<{
    Params: { id: string };
    Body: UpdateCategoryInput
  }>(
    '/:id',
    {
      schema: updateCategorySchema,
      preHandler: [authenticate, isAdmin],
    },
    CategoryController.updateCategory
  );

  // Route pour supprimer une catégorie (admin uniquement)
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: deleteCategorySchema,
      preHandler: [authenticate, isAdmin],
    },
    CategoryController.deleteCategory
  );
}
