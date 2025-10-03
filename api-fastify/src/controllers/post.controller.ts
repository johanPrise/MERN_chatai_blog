import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreatePostInput, UpdatePostInput, PostStatus } from '../types/post.types.js';
import * as PostService from '../services/post.service.js';

// Helper pour gérer les erreurs communes
const handleCommonErrors = (error: Error, reply: FastifyReply) => {
  if (error.message === 'ID article invalide') {
    return reply.status(400).send({ success: false, message: error.message });
  }
  if (error.message === 'Article non trouvé') {
    return reply.status(404).send({ success: false, message: error.message });
  }
  if (error.message === "Vous n'êtes pas autorisé à mettre à jour cet article") {
    return reply.status(403).send({ success: false, message: error.message });
  }
  if (error.message === "Une ou plusieurs catégories n'existent pas") {
    return reply.status(400).send({ success: false, message: error.message });
  }
  return null;
};

// Helper pour extraire le message d'erreur en mode développement
const getErrorMessage = (error: unknown) => {
  if (process.env.NODE_ENV !== 'development') return undefined;
  return error instanceof Error ? error.message : String(error);
};

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
    };
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
    const status = request.query.status ?? undefined;
    const currentUserId = request.user?._id;
    const currentUserRole = request.user?.role;

    // Utiliser le service pour récupérer les articles
    const result = await PostService.getAllPosts({
      page,
      limit,
      search,
      category,
      tag,
      author,
      status,
      currentUserId,
      currentUserRole
    });

    // Retourner la réponse
    return reply.status(200).send(result);
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
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
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: "Une erreur est survenue lors de la récupération de l'article",
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
    
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const authorId = request.user._id;

    // Debug: summarize incoming contentBlocks
    try {
      const cb: any = (postData as any)?.contentBlocks;
      request.log.debug({
        msg: '[createPost] incoming payload summary',
        hasContentBlocks: Array.isArray(cb),
        contentBlocks: Array.isArray(cb)
          ? { length: cb.length, types: cb.map((b: any) => b?.type) }
          : cb,
      });
    } catch {}

    // Utiliser le service pour créer l'article
    try {
      const result = await PostService.createPost(postData, authorId);

      // Debug: summarize saved contentBlocks
      try {
        const cb: any = (result as any)?.contentBlocks;
        request.log.debug({
          msg: '[createPost] saved post summary',
          id: (result as any)?._id || (result as any)?.id,
          hasContentBlocks: Array.isArray(cb),
          contentBlocks: Array.isArray(cb)
            ? { length: cb.length, types: cb.map((b: any) => b?.type) }
            : cb,
        });
      } catch {}

      // Retourner la réponse
      return reply.status(201).send({
        message: 'Article créé avec succès',
        post: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Une ou plusieurs catégories n'existent pas") {
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
      message: "Une erreur est survenue lors de la création de l'article",
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

    // Check authentication first
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const currentUserId = request.user._id;
    const currentUserRole = request.user.role;

    // Log détaillé pour debug
    request.log.info({
      msg: '[updatePost] Request received',
      id,
      userId: currentUserId,
      userRole: currentUserRole,
      dataKeys: Object.keys(updateData),
      hasTitle: !!updateData.title,
      hasContent: !!updateData.content,
      hasContentBlocks: Array.isArray((updateData as any)?.contentBlocks),
      status: updateData.status,
      categories: updateData.categories,
    });

    // Vérifier si l'ID est valide
    if (!isValidObjectId(id)) {
      request.log.warn('[updatePost] Invalid post ID', { id });
      return reply.status(400).send({
        success: false,
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour mettre à jour l'article
    try {
      const result = await PostService.updatePost(id, updateData, currentUserId, currentUserRole);

      request.log.info({
        msg: '[updatePost] Post updated successfully',
        postId: (result as any)?._id || (result as any)?.id,
        title: (result as any)?.title,
        status: (result as any)?.status,
      });

      // Retourner la réponse avec structure cohérente
      return reply.status(200).send({
        success: true,
        message: 'Article mis à jour avec succès',
        post: result,
        data: result, // Ajout pour compatibilité frontend
      });
    } catch (error) {
      request.log.error('[updatePost] Service error', {
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof Error) {
        const commonErrorResponse = handleCommonErrors(error, reply);
        if (commonErrorResponse) return commonErrorResponse;
      }
      throw error;
    }
  } catch (error) {
    request.log.error('[updatePost] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
    return reply.status(500).send({
      success: false,
      message: "Une erreur est survenue lors de la mise à jour de l'article",
      error: getErrorMessage(error),
    });
  }
};

/**
 * Contrôleur pour supprimer un article
 */
export const deletePost = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: { soft?: boolean } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { soft = true } = request.body || {}; // Par défaut, soft delete
    
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

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
      await PostService.deletePost(id, currentUserId, currentUserRole, soft);

      // Retourner la réponse
      return reply.status(200).send({
        message: soft ? 'Article supprimé avec succès' : 'Article supprimé définitivement',
        data: { soft, deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof Error) {
        const commonErrorResponse = handleCommonErrors(error, reply);
        if (commonErrorResponse) return commonErrorResponse;
        
        if (error.message === 'Article déjà supprimé') {
          return reply.status(409).send({ message: error.message });
        }
        if (error.message === "Vous n'êtes pas autorisé à supprimer cet article" ||
            error.message === 'Seuls les administrateurs peuvent supprimer définitivement un article') {
          return reply.status(403).send({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: "Une erreur est survenue lors de la suppression de l'article",
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
    
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

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

      // Invalidation du cache lié aux posts
      try {
        const { invalidatePostCache } = await import('../utils/cache-invalidation.js');
        await invalidatePostCache(id);
      } catch (e) {
        request.log.warn('Cache invalidation failed (likePost): %s', (e as Error).message);
      }

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article liké avec succès',
        likes: result.likes,
        dislikes: result.dislikes,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        isLiked: result.isLiked,
        isDisliked: result.isDisliked,
      });
    } catch (error) {
      if (error instanceof Error) {
        const commonErrorResponse = handleCommonErrors(error, reply);
        if (commonErrorResponse) return commonErrorResponse;
        
        if (error.message === 'Vous avez déjà liké cet article') {
          return reply.status(400).send({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: "Une erreur est survenue lors du like de l'article",
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
    
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

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

      // Invalidation du cache lié aux posts
      try {
        const { invalidatePostCache } = await import('../utils/cache-invalidation.js');
        await invalidatePostCache(id);
      } catch (e) {
        request.log.warn('Cache invalidation failed (unlikePost): %s', (e as Error).message);
      }

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article unliké avec succès',
        likes: result.likes,
        dislikes: result.dislikes,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        isLiked: result.isLiked,
        isDisliked: result.isDisliked,
      });
    } catch (error) {
      if (error instanceof Error) {
        const commonErrorResponse = handleCommonErrors(error, reply);
        if (commonErrorResponse) return commonErrorResponse;
        
        if (error.message === "Vous n'avez pas liké cet article") {
          return reply.status(400).send({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: "Une erreur est survenue lors du unlike de l'article",
    });
  }
};

/**
 * Contrôleur pour disliker un article
 */
export const dislikePost = async (
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
        message: 'ID article invalide',
      });
    }

    // Utiliser le service pour disliker l'article
    try {
      const result = await PostService.dislikePost(id, userId);

      // Invalidation du cache lié aux posts
      try {
        const { invalidatePostCache } = await import('../utils/cache-invalidation.js');
        await invalidatePostCache(id);
      } catch (e) {
        request.log.warn('Cache invalidation failed (dislikePost): %s', (e as Error).message);
      }

      // Retourner la réponse
      return reply.status(200).send({
        message: 'Article disliké avec succès',
        likes: result.likes,
        dislikes: result.dislikes,
        likeCount: result.likeCount,
        dislikeCount: result.dislikeCount,
        isLiked: result.isLiked,
        isDisliked: result.isDisliked,
      });
    } catch (error) {
      if (error instanceof Error) {
        const commonErrorResponse = handleCommonErrors(error, reply);
        if (commonErrorResponse) return commonErrorResponse;
        
        if (error.message === 'Vous avez déjà disliké cet article') {
          return reply.status(400).send({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: "Une erreur est survenue lors du dislike de l'article",
    });
  }
};
