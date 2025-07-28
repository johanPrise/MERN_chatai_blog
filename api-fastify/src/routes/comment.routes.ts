import { FastifyInstance } from 'fastify';
import * as CommentController from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getCommentsSchema,
  getCommentSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  likeCommentSchema,
  unlikeCommentSchema,
} from '../schemas/comment.schema.js';
import { CreateCommentInput, UpdateCommentInput } from '../types/comment.types.js';

/**
 * Routes pour les commentaires
 * @param fastify Instance Fastify
 */
export async function commentRoutes(fastify: FastifyInstance): Promise<void> {
  // Route pour récupérer les commentaires d'un article
  fastify.get<{
    Params: {
      post: string;
    },
    Querystring: {
      parent?: string;
      page?: number;
      limit?: number;
    }
  }>(
    '/post/:post',
    {
      schema: getCommentsSchema,
    },
    CommentController.getComments
  );

  // Route pour récupérer un commentaire par ID
  fastify.get<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: getCommentSchema,
    },
    CommentController.getComment
  );

  // Route pour créer un nouveau commentaire (authentifié)
  fastify.post<{
    Body: CreateCommentInput
  }>(
    '/',
    {
      schema: createCommentSchema,
      preHandler: [authenticate],
    },
    CommentController.createComment
  );

  // Route pour mettre à jour un commentaire (authentifié)
  fastify.put<{
    Params: { id: string };
    Body: UpdateCommentInput
  }>(
    '/:id',
    {
      schema: updateCommentSchema,
      preHandler: [authenticate],
    },
    CommentController.updateComment
  );

  // Route pour supprimer un commentaire (authentifié)
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: deleteCommentSchema,
      preHandler: [authenticate],
    },
    CommentController.deleteComment
  );

  // Route pour liker un commentaire (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/like',
    {
      schema: likeCommentSchema,
      preHandler: [authenticate],
    },
    CommentController.likeComment
  );

  // Route pour unliker un commentaire (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/unlike',
    {
      schema: unlikeCommentSchema,
      preHandler: [authenticate],
    },
    CommentController.unlikeComment
  );

  // Route pour disliker un commentaire (authentifié)
  fastify.post<{
    Params: { id: string }
  }>(
    '/:id/dislike',
    {
      schema: likeCommentSchema, // Réutiliser le même schéma que like
      preHandler: [authenticate],
    },
    CommentController.dislikeComment
  );
}
