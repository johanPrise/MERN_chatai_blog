import { FastifyInstance } from 'fastify';
import * as PostController from '../controllers/post.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getPostsSchema,
  getPostSchema,
  createPostSchema,
  updatePostSchema,
  deletePostSchema,
  likePostSchema,
  unlikePostSchema,
} from '../schemas/post.schema.js';

/**
 * Routes pour les articles
 * @param fastify Instance Fastify
 */
export async function postRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour récupérer tous les articles (avec pagination et filtres)
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      tag?: string;
      author?: string;
      status?: import('../types/post.types.js').PostStatus;
    }
  }>(
    '/',
    {
      schema: getPostsSchema,
    },
    PostController.getPosts
  );

  // Route pour récupérer un article par ID ou slug
  fastify.get<{
    Params: { idOrSlug: string }
  }>(
    '/:idOrSlug',
    {
      schema: getPostSchema,
    },
    PostController.getPost
  );

  // Route pour créer un nouvel article (authentifié)
  fastify.post<{
    Body: import('../types/post.types.js').CreatePostInput
  }>(
    '/',
    {
      schema: createPostSchema,
      preHandler: [authenticate],
    },
    PostController.createPost
  );

  // Route pour mettre à jour un article (authentifié)
  fastify.put<{
    Params: { id: string };
    Body: import('../types/post.types.js').UpdatePostInput
  }>(
    '/:id',
    {
      schema: updatePostSchema,
      preHandler: [authenticate],
    },
    PostController.updatePost
  );

  // Route pour supprimer un article (authentifié)
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: deletePostSchema,
      preHandler: [authenticate],
    },
    PostController.deletePost
  );

  // Route pour liker un article (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/like',
    {
      schema: likePostSchema,
      preHandler: [authenticate],
    },
    PostController.likePost
  );

  // Route pour unliker un article (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/unlike',
    {
      schema: unlikePostSchema,
      preHandler: [authenticate],
    },
    PostController.unlikePost
  );

  // Route pour disliker un article (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/dislike',
    {
      schema: likePostSchema, // Réutiliser le même schéma que like
      preHandler: [authenticate],
    },
    PostController.dislikePost
  );
}
