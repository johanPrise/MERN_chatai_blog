import { type FastifyRequest, type FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreatePostInput, UpdatePostInput, PostStatus } from '../types/post.types.js';
import * as PostService from '../services/post.service.js';
import { invalidatePostCache } from '../utils/cache-invalidation.js';

type PostListRequest = FastifyRequest<{
  Querystring: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    author?: string;
    status?: PostStatus;
  };
}>;
type PostCreateRequest = FastifyRequest<{ Body: CreatePostInput }>;
type PostGetRequest = FastifyRequest<{ Params: { idOrSlug: string } }>;
type PostIdRequest = FastifyRequest<{ Params: { id: string } }>;
type PostUpdateRequest = FastifyRequest<{
  Params: { id: string };
  Body: UpdatePostInput;
}>;
type PostDeleteRequest = FastifyRequest<{
  Params: { id: string };
  Body?: { soft?: boolean };
}>;
type AuthenticatedUser = NonNullable<FastifyRequest['user']>;
type AuthenticatedPostContext = {
  id: string;
  user: AuthenticatedUser;
};
type PostRequestHandler<Request extends FastifyRequest> = (
  request: Request,
  reply: FastifyReply
) => Promise<unknown>;
type PostReactionName = 'like' | 'unlike' | 'dislike';
type PostReactionResult = Awaited<ReturnType<typeof PostService.likePost>>;
type PostReactionAction = (id: string, userId: string) => Promise<PostReactionResult>;
type PostReactionOptions = {
  action: PostReactionAction;
  successMessage: string;
  fallbackMessage: string;
  cacheActionName: string;
};
type FallbackPayloadFactory = (error: unknown, fallbackMessage: string) => Record<string, unknown>;
type HandlePostRequestOptions = {
  request: FastifyRequest;
  reply: FastifyReply;
  fallbackMessage: string;
  action: () => Promise<unknown>;
  fallbackPayload?: FallbackPayloadFactory;
};

const POST_ERROR_STATUS = new Map<string, 400 | 403 | 404 | 409>([
  ['ID article invalide', 400],
  ['Article non trouvé', 404],
  ["Une ou plusieurs catégories n'existent pas", 400],
  ["Vous n'êtes pas autorisé à mettre à jour cet article", 403],
  ['Article déjà supprimé', 409],
  ["Vous n'êtes pas autorisé à supprimer cet article", 403],
  ['Seuls les administrateurs peuvent supprimer définitivement un article', 403],
  ['Vous avez déjà liké cet article', 400],
  ["Vous n'avez pas liké cet article", 400],
  ['Vous avez déjà disliké cet article', 400],
]);

const POST_REACTIONS: Record<PostReactionName, PostReactionOptions> = {
  like: {
    action: PostService.likePost,
    successMessage: 'Article liké avec succès',
    fallbackMessage: "Une erreur est survenue lors du like de l'article",
    cacheActionName: 'likePost',
  },
  unlike: {
    action: PostService.unlikePost,
    successMessage: 'Article unliké avec succès',
    fallbackMessage: "Une erreur est survenue lors du unlike de l'article",
    cacheActionName: 'unlikePost',
  },
  dislike: {
    action: PostService.dislikePost,
    successMessage: 'Article disliké avec succès',
    fallbackMessage: "Une erreur est survenue lors du dislike de l'article",
    cacheActionName: 'dislikePost',
  },
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

const getErrorMessage = (error: unknown) => {
  if (process.env.NODE_ENV !== 'development') {
    return undefined;
  }

  return toError(error).message;
};

const sendKnownPostError = (error: unknown, reply: FastifyReply) => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const statusCode = POST_ERROR_STATUS.get(error.message);
  if (!statusCode) {
    return undefined;
  }

  return reply.status(statusCode).send({
    message: error.message,
  });
};

const defaultFallbackPayload: FallbackPayloadFactory = (_error, fallbackMessage) => ({
  message: fallbackMessage,
});

const updateFallbackPayload: FallbackPayloadFactory = (error, fallbackMessage) => ({
  success: false,
  message: fallbackMessage,
  error: getErrorMessage(error),
});

const handlePostRequest = async ({
  request,
  reply,
  fallbackMessage,
  action,
  fallbackPayload = defaultFallbackPayload,
}: HandlePostRequestOptions) => {
  try {
    return await action();
  } catch (error) {
    const knownErrorReply = sendKnownPostError(error, reply);
    if (knownErrorReply) {
      return knownErrorReply;
    }

    request.log.error(toError(error));
    return reply.status(500).send(fallbackPayload(error, fallbackMessage));
  }
};

const withPostErrorHandling = <Request extends FastifyRequest>(
  fallbackMessage: string,
  action: PostRequestHandler<Request>,
  fallbackPayload?: FallbackPayloadFactory
) => {
  return (request: Request, reply: FastifyReply) => {
    return handlePostRequest({
      request,
      reply,
      fallbackMessage,
      action: () => action(request, reply),
      fallbackPayload,
    });
  };
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

const sendInvalidPostId = (
  id: string,
  reply: FastifyReply,
  payload?: Record<string, unknown>
) => {
  if (isValidObjectId(id)) {
    return false;
  }

  reply.status(400).send(payload ?? { message: 'ID article invalide' });
  return true;
};

const getAuthenticatedPostContext = (
  request: PostIdRequest,
  reply: FastifyReply,
  invalidIdPayload?: Record<string, unknown>
): AuthenticatedPostContext | undefined => {
  const { id } = request.params;
  const user = requireAuthenticatedUser(request, reply);

  if (!user || sendInvalidPostId(id, reply, invalidIdPayload)) {
    return undefined;
  }

  return { id, user };
};

const invalidatePostCacheAfterMutation = async (
  request: FastifyRequest,
  actionName: string,
  postId?: string
) => {
  try {
    await invalidatePostCache(postId);
  } catch (error) {
    request.log.warn(
      `Cache invalidation failed (${actionName}): %s`,
      toError(error).message
    );
  }
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const isPrimitiveType = (value: unknown): boolean => {
  const type = typeof value;
  return type === 'number' || type === 'boolean' || type === 'bigint';
};

const stringifyPrimitiveIdentifier = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (isPrimitiveType(value)) {
    return (value as number | boolean | bigint).toString();
  }

  return undefined;
};

const stringifyObjectIdentifier = (value: unknown): string | undefined => {
  const valueRecord = asRecord(value);
  const toStringValue = valueRecord?.toString;
  if (typeof toStringValue !== 'function') {
    return undefined;
  }

  const stringValue = toStringValue.call(value);
  return stringValue === '[object Object]' ? undefined : stringValue;
};

const stringifyIdentifier = (value: unknown): string | undefined => {
  return stringifyPrimitiveIdentifier(value) ?? stringifyObjectIdentifier(value);
};

const getPostIdentifier = (post: unknown): string | undefined => {
  const postRecord = asRecord(post);
  return stringifyIdentifier(postRecord?._id) ?? stringifyIdentifier(postRecord?.id);
};

const summarizeContentBlocks = (contentBlocks: unknown) => {
  if (!Array.isArray(contentBlocks)) {
    return contentBlocks;
  }

  return {
    length: contentBlocks.length,
    types: contentBlocks.map(block => asRecord(block)?.type),
  };
};

const logContentBlocksSummary = (
  request: FastifyRequest,
  message: string,
  postLike: unknown
) => {
  const postRecord = asRecord(postLike);
  const contentBlocks = postRecord?.contentBlocks;

  request.log.debug({
    msg: message,
    id: getPostIdentifier(postLike),
    hasContentBlocks: Array.isArray(contentBlocks),
    contentBlocks: summarizeContentBlocks(contentBlocks),
  });
};

const logUpdatePostRequest = (
  request: PostUpdateRequest,
  context: AuthenticatedPostContext
) => {
  const { id, user } = context;
  const updateData = request.body;

  request.log.info({
    msg: '[updatePost] Request received',
    id,
    userId: user._id,
    userRole: user.role,
    dataKeys: Object.keys(updateData),
    hasTitle: Boolean(updateData.title),
    hasContent: Boolean(updateData.content),
    hasContentBlocks: Array.isArray(updateData.contentBlocks),
    status: updateData.status,
    categories: updateData.categories,
  });
};

const logUpdatedPost = (request: FastifyRequest, result: unknown) => {
  const resultRecord = asRecord(result);

  request.log.info({
    msg: '[updatePost] Post updated successfully',
    postId: getPostIdentifier(result),
    title: resultRecord?.title,
    status: resultRecord?.status,
  });
};

const createReactionController = (options: PostReactionOptions) => {
  return (request: PostIdRequest, reply: FastifyReply) => {
    return handlePostRequest({
      request,
      reply,
      fallbackMessage: options.fallbackMessage,
      action: async () => {
        const context = getAuthenticatedPostContext(request, reply);
        if (!context) {
          return reply;
        }

        const result = await options.action(context.id, context.user._id);
        await invalidatePostCacheAfterMutation(
          request,
          options.cacheActionName,
          context.id
        );

        return reply.status(200).send({
          message: options.successMessage,
          ...result,
        });
      },
    });
  };
};

/**
 * Contrôleur pour récupérer tous les articles (avec pagination et filtres)
 */
export const getPosts = withPostErrorHandling<PostListRequest>(
  'Une erreur est survenue lors de la récupération des articles',
  async (request, reply) => {
    const page = request.query.page || 1;
    const limit = request.query.limit || 10;
    const search = request.query.search || '';
    const category = request.query.category;
    const tag = request.query.tag;
    const author = request.query.author;
    const status = request.query.status ?? undefined;
    const currentUserId = request.user?._id;
    const currentUserRole = request.user?.role;

    const result = await PostService.getAllPosts({
      page,
      limit,
      search,
      category,
      tag,
      author,
      status,
      currentUserId,
      currentUserRole,
    });

    return reply.status(200).send(result);
  }
);

/**
 * Contrôleur pour récupérer un article par ID ou slug
 */
export const getPost = withPostErrorHandling<PostGetRequest>(
  "Une erreur est survenue lors de la récupération de l'article",
  async (request, reply) => {
    const { idOrSlug } = request.params;
    const currentUserId = request.user?._id;
    const currentUserRole = request.user?.role;
    const post = await PostService.getPostByIdOrSlug(
      idOrSlug,
      currentUserId,
      currentUserRole
    );

    return reply.status(200).send({
      post,
    });
  }
);

/**
 * Contrôleur pour créer un nouvel article
 */
export const createPost = withPostErrorHandling<PostCreateRequest>(
  "Une erreur est survenue lors de la création de l'article",
  async (request, reply) => {
    const postData = request.body;
    const user = requireAuthenticatedUser(request, reply);
    if (!user) {
      return reply;
    }

    logContentBlocksSummary(request, '[createPost] incoming payload summary', postData);

    const result = await PostService.createPost(postData, user._id);
    await invalidatePostCacheAfterMutation(
      request,
      'createPost',
      getPostIdentifier(result)
    );

    logContentBlocksSummary(request, '[createPost] saved post summary', result);

    return reply.status(201).send({
      message: 'Article créé avec succès',
      post: result,
    });
  }
);

/**
 * Contrôleur pour mettre à jour un article
 */
export const updatePost = withPostErrorHandling<PostUpdateRequest>(
  "Une erreur est survenue lors de la mise à jour de l'article",
  async (request, reply) => {
    const context = getAuthenticatedPostContext(
      request,
      reply,
      { success: false, message: 'ID article invalide' }
    );
    if (!context) {
      return reply;
    }

    logUpdatePostRequest(request, context);

    const result = await PostService.updatePost(
      context.id,
      request.body,
      context.user._id,
      context.user.role
    );
    await invalidatePostCacheAfterMutation(request, 'updatePost', context.id);
    logUpdatedPost(request, result);

    return reply.status(200).send({
      success: true,
      message: 'Article mis à jour avec succès',
      post: result,
      data: result,
    });
  },
  updateFallbackPayload
);

/**
 * Contrôleur pour supprimer un article
 */
export const deletePost = withPostErrorHandling<PostDeleteRequest>(
  "Une erreur est survenue lors de la suppression de l'article",
  async (request, reply) => {
    const context = getAuthenticatedPostContext(request, reply);
    if (!context) {
      return reply;
    }

    const { soft = true } = request.body ?? {};
    await PostService.deletePost(
      context.id,
      context.user._id,
      context.user.role,
      soft
    );
    await invalidatePostCacheAfterMutation(request, 'deletePost', context.id);

    return reply.status(200).send({
      message: soft ? 'Article supprimé avec succès' : 'Article supprimé définitivement',
      data: { soft, deletedAt: new Date() },
    });
  }
);

/**
 * Contrôleur pour liker un article
 */
export const likePost = createReactionController(POST_REACTIONS.like);

/**
 * Contrôleur pour unliker un article
 */
export const unlikePost = createReactionController(POST_REACTIONS.unlike);

/**
 * Contrôleur pour disliker un article
 */
export const dislikePost = createReactionController(POST_REACTIONS.dislike);
