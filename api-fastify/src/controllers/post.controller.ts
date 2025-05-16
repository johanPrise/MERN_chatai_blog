import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreatePostInput, UpdatePostInput, PostStatus } from '../types/post.types.js';
import * as PostService from '../services/post.service.js';

/**
 * Contrôleur pour récupérer tous les articles (avec pagination et filtres)
 */
export const getPosts = async (
  request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      tag?: string;
      author?: string;
      status?: PostStatus;
    }
  }>,
  reply: FastifyReply
) => {
  try {
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const search = request.query.search || '';
    const category = request.query.category;
    const tag = request.query.tag;
    const author = request.query.author;
    const status = request.query.status || PostStatus.PUBLISHED;
    const currentUserId = request.user?._id;
    const currentUserRole = request.user?.role;

    // Utiliser le service pour récupérer les articles
    const result = await PostService.getAllPosts(
      page,
      limit,
      search,
      category,
      tag,
      author,
      status,
      currentUserId,
      currentUserRole
    );

    // Retourner la réponse
    return reply.status(200).send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération des articles',
    });
  }
};

/**
 * Contrôleur pour récupérer un article par ID ou slug
 */
export const getPost = async (
  request: FastifyRequest<{ Params: { idOrSlug: string } }>,
  reply: FastifyReply
) => {
  try {
    const { idOrSlug } = request.params;
    const currentUserId = request.user?._id;
    const currentUserRole = request.user?.role;

    // Utiliser le service pour récupérer l'article
    try {
      const post = await PostService.getPostByIdOrSlug(idOrSlug, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        post,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Article non trouvé') {
        return reply.status(404).send({
          message: 'Article non trouvé',
        });
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération de l\'article',
    });
  }
};

/**
 * Contrôleur pour créer un nouvel article
 */
export const createPost = async (
  request: FastifyRequest<{ Body: CreatePostInput }>,
  reply: FastifyReply
) => {
  try {
    const postData = request.body;
    const authorId = request.user._id;

    // Utiliser le service pour créer l'article
    try {
      const result = await PostService.createPost(postData, authorId);

      // Retourner la réponse
      return reply.status(201).send({
        message: 'Article créé avec succès',
        post: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Une ou plusieurs catégories n\'existent pas') {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la création de l\'article',
    });
  }
};

/**
 * Contrôleur pour mettre à jour un article
 */
export const updatePost = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdatePostInput }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    const currentUserId = request.user._id;
    const currentUserRole = request.user.role;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour mettre à jour l'article
    try {
      const result = await PostService.updatePost(id, updateData, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article mis à jour avec succès',
        post: result,
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
        } else if (error.message === 'Vous n\'êtes pas autorisé à mettre à jour cet article') {
          return reply.status(403).send({
            message: error.message,
          });
        } else if (error.message === 'Une ou plusieurs catégories n\'existent pas') {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour de l\'article',
    });
  }
};

/**
 * Contrôleur pour supprimer un article
 */
export const deletePost = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const currentUserId = request.user._id;
    const currentUserRole = request.user.role;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour supprimer l'article
    try {
      await PostService.deletePost(id, currentUserId, currentUserRole);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article supprimé avec succès',
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
        } else if (error.message === 'Vous n\'êtes pas autorisé à supprimer cet article') {
          return reply.status(403).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la suppression de l\'article',
    });
  }
};

/**
 * Contrôleur pour liker un article
 */
export const likePost = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour liker l'article
    try {
      const result = await PostService.likePost(id, userId);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article liké avec succès',
        likeCount: result.likeCount,
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
        } else if (error.message === 'Vous avez déjà liké cet article') {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du like de l\'article',
    });
  }
};

/**
 * Contrôleur pour unliker un article
 */
export const unlikePost = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      return reply.status(400).send({
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour unliker l'article
    try {
      const result = await PostService.unlikePost(id, userId);

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article unliké avec succès',
        likeCount: result.likeCount,
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
        } else if (error.message === 'Vous n\'avez pas liké cet article') {
          return reply.status(400).send({
            message: error.message,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors du unlike de l\'article',
    });
  }
};
