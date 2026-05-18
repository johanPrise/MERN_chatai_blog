import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreateCommentInput, UpdateCommentInput } from '../types/comment.types.js';
import { UserRole } from '../types/user.types.js';
import * as CommentService from '../services/comment.service.js';
import { Comment } from '../models/comment.model.js';
import { invalidateCommentsCache } from '../utils/cache-invalidation.js';

type CommentIdRequest = FastifyRequest<{ Params: { id: string } }>;
type CommentReactionAction = typeof CommentService.likeComment;
type AuthenticatedUser = NonNullable<FastifyRequest['user']>;
type AuthenticatedCommentContext = {
  id: string;
  user: AuthenticatedUser;
};
type CommentRequestHandler<Request extends FastifyRequest> = (
  request: Request,
  reply: FastifyReply
) => Promise<unknown>;
type AuthenticatedCommentHandler<Request extends CommentIdRequest> = (
  request: Request,
  reply: FastifyReply,
  context: AuthenticatedCommentContext
) => Promise<unknown>;
type CommentMutationHandler<Request extends CommentIdRequest> = (
  request: Request,
  context: AuthenticatedCommentContext
) => Promise<Record<string, unknown> | void>;
type CommentMutationOptions<Request extends CommentIdRequest> = {
  fallbackMessage: string;
  successMessage: string;
  action: CommentMutationHandler<Request>;
};
type CommentReactionOptions = {
  action: CommentReactionAction;
  successMessage: string;
  fallbackMessage: string;
  cacheActionName: string;
};
type CommentReactionName = 'like' | 'unlike' | 'dislike';

const COMMENT_ERROR_STATUS = new Map<string, 400 | 403 | 404>([
  ['ID article invalide', 400],
  ['ID commentaire invalide', 400],
  ['ID commentaire parent invalide', 400],
  ['Article non trouvé', 404],
  ['Commentaire non trouvé', 404],
  ['Commentaire parent non trouvé', 404],
  ["Le commentaire parent n'appartient pas à cet article", 400],
  ['Les réponses imbriquées ne sont pas autorisées', 400],
  ["Vous n'êtes pas autorisé à mettre à jour ce commentaire", 403],
  ["Vous n'êtes pas autorisé à supprimer ce commentaire", 403],
  ['Vous avez déjà liké ce commentaire', 400],
  ["Vous n'avez pas liké ce commentaire", 400],
  ['Vous avez déjà disliké ce commentaire', 400],
]);

const sendKnownCommentError = (error: unknown, reply: FastifyReply) => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const statusCode = COMMENT_ERROR_STATUS.get(error.message);
  if (!statusCode) {
    return undefined;
  }

  return reply.status(statusCode).send({
    message: error.message,
  });
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Erreur inconnue');
};

const handleCommentRequest = async (
  request: FastifyRequest,
  reply: FastifyReply,
  fallbackMessage: string,
  action: () => Promise<unknown>
) => {
  try {
    return await action();
  } catch (error) {
    const knownErrorReply = sendKnownCommentError(error, reply);
    if (knownErrorReply) {
      return await knownErrorReply;
    }

    request.log.error(toError(error));
    return reply.status(500).send({
      message: fallbackMessage,
    });
  }
};

const withCommentErrorHandling = <Request extends FastifyRequest>(
  fallbackMessage: string,
  action: CommentRequestHandler<Request>
) => {
  return (request: Request, reply: FastifyReply) => {
    return handleCommentRequest(request, reply, fallbackMessage, () => {
      return action(request, reply);
    });
  };
};

const sendInvalidObjectId = (
  id: string,
  message: string,
  reply: FastifyReply
) => {
  if (isValidObjectId(id)) {
    return false;
  }

  reply.status(400).send({ message });
  return true;
};

const requireAuthenticatedUser = (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (request.user) {
    return request.user;
  }

  reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  return undefined;
};

const getAuthenticatedCommentContext = (
  request: CommentIdRequest,
  reply: FastifyReply
): AuthenticatedCommentContext | undefined => {
  const { id } = request.params;
  const user = requireAuthenticatedUser(request, reply);

  if (!user || sendInvalidObjectId(id, 'ID commentaire invalide', reply)) {
    return undefined;
  }

  return { id, user };
};

const withAuthenticatedComment = <Request extends CommentIdRequest>(
  fallbackMessage: string,
  action: AuthenticatedCommentHandler<Request>
) => {
  return withCommentErrorHandling<Request>(
    fallbackMessage,
    async (request, reply) => {
      const context = getAuthenticatedCommentContext(request, reply);
      if (!context) {
        return reply;
      }

      return action(request, reply, context);
    }
  );
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const hasToHexStringMethod = (value: unknown): value is { toHexString: () => string } => {
  return typeof asRecord(value)?.toHexString === 'function';
};

const stringifyPrimitiveId = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
};

const stringifyObjectId = (value: unknown): string | undefined => {
  if (hasToHexStringMethod(value)) {
    return value.toHexString();
  }

  return stringifyPrimitiveId(asRecord(value)?._id);
};

const getPostIdFromDocument = (doc: { post?: unknown } | null): string => {
  if (!doc?.post) {
    return '';
  }

  return stringifyPrimitiveId(doc.post) ?? stringifyObjectId(doc.post) ?? '';
};

const invalidateCommentCache = async (
  commentId: string,
  request: FastifyRequest,
  actionName: string
) => {
  try {
    const doc = await Comment.findById(commentId).select('post');
    const postId = getPostIdFromDocument(doc);
    
    if (postId) {
      await invalidateCommentsCache(postId);
    }
  } catch (error) {
    request.log.warn(
      `Cache invalidation failed (${actionName}): %s`,
      toError(error).message
    );
  }
};

const handleReactionRequest = (
  request: CommentIdRequest,
  reply: FastifyReply,
  options: CommentReactionOptions
) => {
  const { action, successMessage, fallbackMessage, cacheActionName } = options;

  return handleCommentRequest(request, reply, fallbackMessage, async () => {
    const context = getAuthenticatedCommentContext(request, reply);
    if (!context) {
      return reply;
    }

    const { id, user } = context;
    const result = await action({ id, user: { id: user._id } });
    await invalidateCommentCache(id, request, cacheActionName);

    return reply.status(200).send({
      message: successMessage,
      ...result,
    });
  });
};

const createReactionController = (options: CommentReactionOptions) => {
  return (request: CommentIdRequest, reply: FastifyReply) => {
    return handleReactionRequest(request, reply, options);
  };
};

const toCurrentUser = ({ user }: AuthenticatedCommentContext) => ({
  id: user._id,
  role: user.role as UserRole,
});

const createCommentMutationController = <Request extends CommentIdRequest>({
  fallbackMessage,
  successMessage,
  action,
}: CommentMutationOptions<Request>) => {
  return withAuthenticatedComment<Request>(
    fallbackMessage,
    async (request, reply, context) => {
      const payload = await action(request, context);

      return reply.status(200).send({
        message: successMessage,
        ...payload,
      });
    }
  );
};

const COMMENT_REACTIONS: Record<CommentReactionName, CommentReactionOptions> = {
  like: {
    action: CommentService.likeComment,
    successMessage: 'Réaction mise à jour avec succès',
    fallbackMessage: 'Une erreur est survenue lors du like du commentaire',
    cacheActionName: 'likeComment',
  },
  unlike: {
    action: CommentService.unlikeComment,
    successMessage: 'Commentaire unliké avec succès',
    fallbackMessage: 'Une erreur est survenue lors du unlike du commentaire',
    cacheActionName: 'unlikeComment',
  },
  dislike: {
    action: CommentService.dislikeComment,
    successMessage: 'Réaction mise à jour avec succès',
    fallbackMessage: 'Une erreur est survenue lors du dislike du commentaire',
    cacheActionName: 'dislikeComment',
  },
};

/**
 * Contrôleur pour récupérer les commentaires d'un article
 */
export const getComments = withCommentErrorHandling<
  FastifyRequest<{
    Params: {
      post: string;
    },
    Querystring: {
      parent?: string;
      page?: number;
      limit?: number;
    }
  }>
>(
  'Une erreur est survenue lors de la récupération des commentaires',
  async (request, reply) => {
    const { post } = request.params;
    const { parent } = request.query;
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const currentUserId = request.user?._id?.toString();

    if (sendInvalidObjectId(post, 'ID article invalide', reply)) {
      return reply;
    }

    const result = await CommentService.getPostComments({
      postId: post,
      parentId: parent,
      page,
      limit,
      viewer: currentUserId ? { id: currentUserId } : undefined,
    });

    return reply.status(200).send(result);
  }
);

/**
 * Contrôleur pour récupérer un commentaire par ID
 */
export const getComment = withCommentErrorHandling<CommentIdRequest>(
  'Une erreur est survenue lors de la récupération du commentaire',
  async (request, reply) => {
    const { id } = request.params;
    const currentUserId = request.user?._id?.toString();

    if (sendInvalidObjectId(id, 'ID commentaire invalide', reply)) {
      return reply;
    }

    const comment = await CommentService.getCommentById({
      id,
      viewer: currentUserId ? { id: currentUserId } : undefined,
    });

    return reply.status(200).send({
      comment,
    });
  }
);

/**
 * Contrôleur pour créer un nouveau commentaire
 */
export const createComment = withCommentErrorHandling<
  FastifyRequest<{ Body: CreateCommentInput }>
>(
  'Une erreur est survenue lors de la création du commentaire',
  async (request, reply) => {
    const commentData = request.body;
    const user = requireAuthenticatedUser(request, reply);
    if (!user) {
      return reply;
    }

    const comment = await CommentService.createComment({
      commentData,
      author: { id: user._id },
    });

    return reply.status(201).send({
      message: 'Commentaire créé avec succès',
      comment,
    });
  }
);

/**
 * Contrôleur pour mettre à jour un commentaire
 */
export const updateComment = createCommentMutationController<
  FastifyRequest<{ Params: { id: string }; Body: UpdateCommentInput }>
>({
  fallbackMessage: 'Une erreur est survenue lors de la mise à jour du commentaire',
  successMessage: 'Commentaire mis à jour avec succès',
  action: async (request, context) => {
    const comment = await CommentService.updateComment({
      id: context.id,
      updateData: request.body,
      currentUser: toCurrentUser(context),
    });

    return { comment };
  },
});

/**
 * Contrôleur pour supprimer un commentaire
 */
export const deleteComment = createCommentMutationController<CommentIdRequest>({
  fallbackMessage: 'Une erreur est survenue lors de la suppression du commentaire',
  successMessage: 'Commentaire supprimé avec succès',
  action: async (_request, context) => {
    await CommentService.deleteComment({
      id: context.id,
      currentUser: toCurrentUser(context),
    });
  },
});

/**
 * Contrôleur pour liker un commentaire
 */
export const likeComment = createReactionController(COMMENT_REACTIONS.like);

/**
 * Contrôleur pour unliker un commentaire
 */
export const unlikeComment = createReactionController(COMMENT_REACTIONS.unlike);

/**
 * Contrôleur pour disliker un commentaire
 */
export const dislikeComment = createReactionController(COMMENT_REACTIONS.dislike);
