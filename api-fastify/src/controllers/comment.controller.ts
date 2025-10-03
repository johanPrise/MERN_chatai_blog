import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreateCommentInput, UpdateCommentInput } from '../types/comment.types.js';
import * as CommentService from '../services/comment.service.js';
import { Comment } from '../models/comment.model.js';

/**
 * Contrôleur pour récupérer les commentaires d'un article
 */
export const getComments = async (
  request: FastifyRequest<{
    Params: {
      post: string;
    },
    Querystring: {
      parent?: string;
      page?: number;
      limit?: number;
    }
  }>,
  reply: FastifyReply
) => {
  try {
    const { post } = request.params;
    const { parent } = request.query;
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const currentUserId = request.user?._id?.toString();
    
    console.log('getComments - currentUserId:', currentUserId);
    console.log('getComments - post:', post);
    console.log('getComments - user object:', request.user);

    // Vérifier si l'ID de l'article est valide
    if (!isValidObjectId(post)) {
      return reply.status(400).send({
        message: 'ID article invalide',
      });
    }

    try {
      // Utiliser le service pour récupérer les commentaires
      const result = await CommentService.getPostComments(
        post,
        parent,
        page,
        limit,
        currentUserId
      );

      // Retourner la réponse
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID article invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Article non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'ID commentaire parent invalide') {
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
      message: 'Une erreur est survenue lors de la récupération des commentaires',
    });
  }
};

/**
 * Contrôleur pour récupérer un commentaire par ID
 */
export const getComment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const currentUserId = request.user?._id?.toString();

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour récupérer le commentaire
      const comment = await CommentService.getCommentById(id, currentUserId);

      // Retourner la réponse
      return reply.status(200).send({
        comment,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
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
      message: 'Une erreur est survenue lors de la récupération du commentaire',
    });
  }
};

/**
 * Contrôleur pour créer un nouveau commentaire
 */
export const createComment = async (
  request: FastifyRequest<{ Body: CreateCommentInput }>,
  reply: FastifyReply
) => {
  try {
    const commentData = request.body;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const authorId = request.user._id;

    try {
      // Utiliser le service pour créer le commentaire
      const comment = await CommentService.createComment(commentData, authorId);

      // Retourner la réponse
      return reply.status(201).send({
        message: 'Commentaire créé avec succès',
        comment,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID article invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Article non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'ID commentaire parent invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire parent non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Le commentaire parent n\'appartient pas à cet article') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Les réponses imbriquées ne sont pas autorisées') {
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
      message: 'Une erreur est survenue lors de la création du commentaire',
    });
  }
};

/**
 * Contrôleur pour mettre à jour un commentaire
 */
export const updateComment = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCommentInput }>,
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

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour mettre à jour le commentaire
      const result = await CommentService.updateComment(
        id,
        updateData,
        currentUserId,
        currentUserRole
      );

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Commentaire mis à jour avec succès',
        comment: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Vous n\'êtes pas autorisé à mettre à jour ce commentaire') {
          return reply.status(403).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour du commentaire',
    });
  }
};

/**
 * Contrôleur pour supprimer un commentaire
 */
export const deleteComment = async (
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

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour supprimer le commentaire
      await CommentService.deleteComment(id, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Commentaire supprimé avec succès',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Vous n\'êtes pas autorisé à supprimer ce commentaire') {
          return reply.status(403).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la suppression du commentaire',
    });
  }
};

/**
 * Contrôleur pour liker un commentaire
 */
export const likeComment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const userId = request.user._id;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour liker le commentaire
      const result = await CommentService.likeComment(id, userId);

      // Invalider le cache des commentaires (centralisé) en résolvant le postId
      try {
        const doc = await Comment.findById(id).select('post');
        const postId = doc?.post?.toString() || '';
        const { invalidateCommentsCache } = await import('../utils/cache-invalidation.js');
        await invalidateCommentsCache(postId);
      } catch (e) {
        request.log.warn('Cache invalidation failed (likeComment): %s', (e as Error).message);
      }
      
      // Retourner la réponse
      return reply.status(200).send({
        message: 'Réaction mise à jour avec succès',
        ...result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Vous avez déjà liké ce commentaire') {
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
      message: 'Une erreur est survenue lors du like du commentaire',
    });
  }
};

/**
 * Contrôleur pour unliker un commentaire
 */
export const unlikeComment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const userId = request.user._id;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour unliker le commentaire
      const result = await CommentService.unlikeComment(id, userId);

      // Invalider le cache des commentaires (centralisé) en résolvant le postId
      try {
        const doc = await Comment.findById(id).select('post');
        const postId = doc?.post?.toString() || '';
        const { invalidateCommentsCache } = await import('../utils/cache-invalidation.js');
        await invalidateCommentsCache(postId);
      } catch (e) {
        request.log.warn('Cache invalidation failed (unlikeComment): %s', (e as Error).message);
      }

      // Retourner la réponse complète avec les données de réaction
      return reply.status(200).send({
        message: 'Commentaire unliké avec succès',
        ...result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Vous n\'avez pas liké ce commentaire') {
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
      message: 'Une erreur est survenue lors du unlike du commentaire',
    });
  }
};

/**
 * Contrôleur pour disliker un commentaire
 */
export const dislikeComment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!request.user) {

      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

    }

    const userId = request.user._id;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID commentaire invalide',
      });
    }

    try {
      // Utiliser le service pour disliker le commentaire
      const result = await CommentService.dislikeComment(id, userId);

      // Invalider le cache des commentaires (centralisé) en résolvant le postId
      try {
        const doc = await Comment.findById(id).select('post');
        const postId = doc?.post?.toString() || '';
        const { invalidateCommentsCache } = await import('../utils/cache-invalidation.js');
        await invalidateCommentsCache(postId);
      } catch (e) {
        request.log.warn('Cache invalidation failed (dislikeComment): %s', (e as Error).message);
      }
      
      // Retourner la réponse
      return reply.status(200).send({
        message: 'Réaction mise à jour avec succès',
        ...result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'ID commentaire invalide') {
          return reply.status(400).send({
            message: error.message,
          });
        } else if (error.message === 'Commentaire non trouvé') {
          return reply.status(404).send({
            message: error.message,
          });
        } else if (error.message === 'Vous avez déjà disliké ce commentaire') {
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
      message: 'Une erreur est survenue lors du dislike du commentaire',
    });
  }
};
