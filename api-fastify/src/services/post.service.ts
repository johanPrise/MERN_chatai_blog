import { Post } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { User } from '../models/user.model.js';
import { isValidObjectId, generateSlug, extractExcerpt } from '../utils/index.js';
import {
  CreatePostInput,
  UpdatePostInput,
  PostStatus,
  IPost,
  PostResponse,
} from '../types/post.types.js';
import type { FilterQuery } from 'mongoose';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import type { PostDTO } from '../types/dto/post.dto.js';

const MAX_SEARCH_LENGTH = 100;


type CreatePostPayload = CreatePostInput & {
  summary?: string;
  category?: string;
};

type PostQuery = FilterQuery<IPost>;

type CleanUpdateData = UpdatePostInput & {
  slug?: string;
  excerpt?: string;
  publishedAt?: Date;
  categories?: string[];
};

type ContentBlock = {
  type: string;
  data?: Record<string, unknown>;
  text?: string;
  items?: string[];
  code?: string;
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
};

const normalizeSearchTerm = (search?: string): string => {
  return (search || '').trim().slice(0, MAX_SEARCH_LENGTH);
};

const extractTextFromBlock = (block: ContentBlock): string => {
  if (!block) return '';
  const type = block.type;
  const data = block.data ?? block;
  
  if (['paragraph', 'heading', 'quote', 'callout'].includes(type) && typeof data.text === 'string') {
    return data.text;
  }
  if (type === 'list' && Array.isArray(data.items)) {
    return data.items.join(' ');
  }
  if (type === 'code' && typeof data.code === 'string') {
    return data.code;
  }
  return '';
};

const blocksToPlainText = (blocks: ContentBlock[] | undefined | null): string => {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(extractTextFromBlock).filter(Boolean).join(' ').trim();
};

interface GetPostsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: PostStatus;
  currentUserId?: string;
  currentUserRole?: string;
}

// Helper: build status query
const buildStatusQuery = (status?: PostStatus, currentUserId?: string, currentUserRole?: string) => {
  if (!currentUserId) return { status: PostStatus.PUBLISHED };
  
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';
  
  if (status) {
    if (isAdminOrEditor) return { status };
    return status === PostStatus.DRAFT 
      ? { status: PostStatus.DRAFT, author: currentUserId }
      : { status: PostStatus.PUBLISHED };
  }
  
  return isAdminOrEditor ? {} : {
    $or: [
      { status: PostStatus.PUBLISHED },
      { status: PostStatus.DRAFT, author: currentUserId },
    ]
  };
};

const buildPostQuery = (options: GetPostsOptions): PostQuery => {
  const { search, category, tag, author, status, currentUserId, currentUserRole } = options;
  const filters: PostQuery[] = [
    { isDeleted: { $ne: true } },
    buildStatusQuery(status, currentUserId, currentUserRole),
  ];

  const normalizedSearch = normalizeSearchTerm(search);
  if (normalizedSearch) {
    const safeSearchRegex = escapeRegExp(normalizedSearch);
    filters.push({
      $or: [
        { title: { $regex: safeSearchRegex, $options: 'i' } },
        { content: { $regex: safeSearchRegex, $options: 'i' } },
      ],
    });
  }
  if (category) filters.push({ categories: category });
  if (tag) filters.push({ tags: tag });
  if (author) filters.push({ author });

  return { $and: filters };
};

const normalizeCoverImage = (
  coverImage?: { url: string; alt?: string } | string
): { url: string; alt: string } | undefined => {
  if (!coverImage) return undefined;

  if (typeof coverImage === 'string') {
    return { url: coverImage, alt: '' };
  }

  return {
    url: coverImage.url,
    alt: coverImage.alt || '',
  };
};

const normalizePostForFrontend = (post: IPost, currentUserId?: string): PostDTO => {
  const postObj = post.toObject() as PostResponse;
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const dislikedBy = Array.isArray(post.dislikedBy) ? post.dislikedBy : [];

  if (currentUserId) {
    postObj.isLiked = likedBy.some((id: unknown) => String(id) === currentUserId);
    postObj.isDisliked = dislikedBy.some((id: unknown) => String(id) === currentUserId);
  }

  postObj.category = Array.isArray(postObj.categories) && postObj.categories.length > 0 
    ? postObj.categories[0] : null;
  
  const frontendPost: PostDTO = {
    _id: String(postObj._id),
    title: postObj.title,
    content: postObj.content,
    contentBlocks: postObj.contentBlocks,
    excerpt: postObj.excerpt,
    slug: postObj.slug,
    author: postObj.author,
    categories: postObj.categories,
    category: postObj.category,
    tags: postObj.tags,
    featuredImage: postObj.featuredImage,
    coverImage: normalizeCoverImage(postObj.coverImage),
    images: postObj.images,
    status: postObj.status,
    viewCount: postObj.viewCount ?? 0,
    likeCount: likedBy.length,
    dislikeCount: dislikedBy.length,
    commentCount: postObj.commentCount ?? 0,
    isLiked: postObj.isLiked,
    isDisliked: postObj.isDisliked,
    likes: likedBy.map(String),
    dislikes: dislikedBy.map(String),
    views: postObj.viewCount ?? 0,
    stats: {
      viewCount: postObj.viewCount ?? 0,
      likeCount: likedBy.length,
      commentCount: postObj.commentCount ?? 0,
      shareCount: 0
    },
    createdAt: postObj.createdAt,
    updatedAt: postObj.updatedAt,
    publishedAt: postObj.publishedAt,
    isDeleted: postObj.isDeleted ?? false
  };

  return frontendPost;
};

const addAuthorIdAlias = (post: PostDTO): void => {
  const author = post.author;
  if (!author || typeof author !== 'object') return;
  if (!('_id' in author) || 'id' in author) return;
  (author as unknown as Record<string, unknown>).id = String(author._id);
};

const ensureCanDeletePost = (
  post: IPost,
  currentUserId: string,
  currentUserRole: string
): void => {
  const authorId = String(post.author);
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à supprimer cet article");
  }
};

const formatPostReactionResult = (post: IPost, userId: string) => {
  const likedBy = post.likedBy || [];
  const dislikedBy = post.dislikedBy || [];

  return {
    likes: likedBy.map(String),
    dislikes: dislikedBy.map(String),
    likeCount: likedBy.length,
    dislikeCount: dislikedBy.length,
    isLiked: likedBy.some((id: unknown) => String(id) === userId),
    isDisliked: dislikedBy.some((id: unknown) => String(id) === userId),
  };
};

const ensureValidPostId = (id: string): void => {
  if (!isValidObjectId(id)) {
    throw new ValidationError('ID article invalide');
  }
};

const ensurePostExists: (post: IPost | null) => asserts post is IPost = (post) => {
  if (!post || post.isDeleted) {
    throw new NotFoundError('Article non trouvé');
  }
};

const ensureCanEditPost = (post: IPost & { author: { _id: string } }, currentUserId: string, currentUserRole: string): void => {
  const authorId = post.author._id.toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à mettre à jour cet article");
  }
};

const prepareSlugUpdate = (updateData: UpdatePostInput, currentTitle: string): string | undefined => {
  if (updateData.title && updateData.title !== currentTitle) {
    return generateSlug(updateData.title);
  }
  return undefined;
};

const prepareSummaryUpdate = (updateData: UpdatePostInput & { summary?: string }): string | undefined => {
  return updateData.summary;
};

const prepareExcerptUpdate = (
  updateData: UpdatePostInput,
  currentContent?: string,
  contentBlocks?: ContentBlock[]
): string | undefined => {
  if (updateData.content?.trim() && updateData.content !== currentContent) {
    return extractExcerpt(updateData.content);
  }

  if (contentBlocks?.length) {
    const plain = blocksToPlainText(contentBlocks);
    if (plain) {
      return extractExcerpt(plain);
    }
  }

  return undefined;
};

const preparePublishedAtUpdate = (newStatus: PostStatus | undefined, currentStatus: PostStatus): Date | undefined => {
  if (newStatus === PostStatus.PUBLISHED && currentStatus !== PostStatus.PUBLISHED) {
    return new Date();
  }
  return undefined;
};

const prepareCategoriesUpdate = (updateData: UpdatePostInput & { category?: string }): string[] | undefined => {
  if (updateData.category && typeof updateData.category === 'string') {
    return [updateData.category];
  }
  return undefined;
};

const validateCategories = async (categories: string[]): Promise<void> => {
  const categoryCount = await Category.countDocuments({ _id: { $in: categories } });
  if (categoryCount !== categories.length) {
    throw new ValidationError("Une ou plusieurs catégories n'existent pas");
  }
};

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
  return data;
};

const applySlugUpdate = (cleanData: CleanUpdateData, updateData: UpdatePostInput, post: IPost): void => {
  const slug = prepareSlugUpdate(updateData, post.title);
  if (slug) cleanData.slug = slug;
};

const applySummaryUpdate = (cleanData: CleanUpdateData, updateData: UpdatePostInput & { summary?: string }): void => {
  const summary = prepareSummaryUpdate(updateData);
  if (summary) {
    cleanData.excerpt = summary;
    delete (cleanData as Record<string, unknown>).summary;
  }
};

const applyExcerptUpdate = (cleanData: CleanUpdateData, updateData: UpdatePostInput, post: IPost): void => {
  if (!cleanData.excerpt) {
    const excerpt = prepareExcerptUpdate(updateData, post.content, updateData.contentBlocks);
    if (excerpt) cleanData.excerpt = excerpt;
  }
};

const applyPublishedAtUpdate = (cleanData: CleanUpdateData, updateData: UpdatePostInput, post: IPost): void => {
  const publishedAt = preparePublishedAtUpdate(updateData.status, post.status);
  if (publishedAt) cleanData.publishedAt = publishedAt;
};

const applyCategoriesUpdate = async (cleanData: CleanUpdateData, updateData: UpdatePostInput & { category?: string }): Promise<void> => {
  const categories = prepareCategoriesUpdate(updateData);
  if (categories) {
    cleanData.categories = categories;
    delete (cleanData as Record<string, unknown>).category;
  }

  if (cleanData.categories?.length) {
    await validateCategories(cleanData.categories);
  }
};

const preparePostUpdateData = async (
  updateData: UpdatePostInput & { slug?: string; publishedAt?: Date; summary?: string; category?: string },
  post: IPost
): Promise<CleanUpdateData> => {
  const cleanData: CleanUpdateData = { ...updateData };

  applySlugUpdate(cleanData, updateData, post);
  applySummaryUpdate(cleanData, updateData);
  applyExcerptUpdate(cleanData, updateData, post);
  applyPublishedAtUpdate(cleanData, updateData, post);
  await applyCategoriesUpdate(cleanData, updateData);

  return removeUndefinedFields(cleanData);
};

const populatePost = async (postId: string) => {
  return Post.findById(postId)
    .populate('author', '_id username profilePicture role')
    .populate('categories', '_id name slug');
};

const extractContentData = (postData: CreatePostPayload) => {
  const { content, contentBlocks, excerpt, summary } = postData;
  const extractedExcerpt = excerpt || summary;
  return { content, contentBlocks, excerpt: extractedExcerpt };
};

const extractCategoriesData = (postData: CreatePostPayload) => {
  const { categories, category } = postData;
  if (categories) return categories;
  if (category) return [category];
  return undefined;
};

const generateExcerptFromContent = (content?: string, contentBlocks?: ContentBlock[], excerpt?: string): string => {
  if (excerpt) return excerpt;
  
  if (content?.trim()) {
    return extractExcerpt(content);
  }
  
  if (contentBlocks?.length) {
    const plain = blocksToPlainText(contentBlocks);
    return extractExcerpt(plain);
  }
  
  return '';
};

const normalizeContentFromBlocks = (content?: string, contentBlocks?: ContentBlock[]): string => {
  if (content?.trim()) return content;
  if (contentBlocks?.length) {
    return blocksToPlainText(contentBlocks);
  }
  return '';
};

const createPostNotification = async (post: IPost, authorId: string): Promise<void> => {
  try {
    const author = await User.findById(authorId).select('username');
    if (!author) return;

    const { createNotification } = await import('./notification.service.js');
    const isPublished = post.status === PostStatus.PUBLISHED;
    
    await createNotification({
      type: isPublished ? 'post_published' : 'user_activity',
      title: isPublished ? 'Nouveau post publié' : 'Nouveau post créé',
      message: isPublished 
        ? `${author.username} a publié un nouveau post: "${post.title}".`
        : `${author.username} a créé un nouveau brouillon: "${post.title}".`,
      priority: isPublished ? 'low' : 'medium',
      actionUrl: `/admin/posts/${post._id}`,
      metadata: {
        postId: String(post._id),
        postTitle: post.title,
        username: author.username
      },
    });
  } catch (error) {
    console.error('Failed to create post notification:', error);
  }
};

const checkPostViewPermission = (post: IPost & { author: { _id: string } }, currentUserId?: string, currentUserRole?: string): void => {
  if (post.status === PostStatus.PUBLISHED) return;
  
  if (!currentUserId) {
    throw new NotFoundError('Article non trouvé');
  }

  const isAuthor = post.author._id.toString() === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new NotFoundError('Article non trouvé');
  }
};

const incrementViewCount = async (post: IPost & { author: { _id: string } }, currentUserId?: string): Promise<void> => {
  if (!currentUserId || currentUserId !== post.author._id.toString()) {
    post.viewCount += 1;
    await post.save();
  }
};

/**
 * Service pour récupérer tous les articles (avec pagination et filtres)
 */
export const getAllPosts = async (options: GetPostsOptions = {}) => {
  const { page = 1, limit = 10, currentUserId } = options;
  const skip = (page - 1) * limit;
  const query = buildPostQuery(options);

  const posts = await Post.find(query)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug')
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const postsWithLikeStatus = posts.map(post => normalizePostForFrontend(post, currentUserId));

  return { posts: postsWithLikeStatus, total, page, limit, totalPages };
};

/**
 * Service pour récupérer un article par ID ou slug
 */
export const getPostByIdOrSlug = async (
  idOrSlug: string,
  currentUserId?: string,
  currentUserRole?: string
) => {
  const query: PostQuery = {
    isDeleted: { $ne: true },
    ...(isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug })
  };

  const post = await Post.findOne(query)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug') as IPost & {
    author: { _id: string; username: string; profilePicture?: string };
  };

  if (!post) {
    throw new NotFoundError('Article non trouvé');
  }

  checkPostViewPermission(post, currentUserId, currentUserRole);
  await incrementViewCount(post, currentUserId);

  return normalizePostForFrontend(post, currentUserId);
};

/**
 * Service pour créer un nouvel article
 */
export const createPost = async (postData: CreatePostPayload, authorId: string) => {
  const { title, tags, featuredImage, coverImage, images, status } = postData;
  const { content: rawContent, contentBlocks, excerpt: rawExcerpt } = extractContentData(postData);
  const finalCategories = extractCategoriesData(postData);

  const slug = generateSlug(title);
  const finalExcerpt = generateExcerptFromContent(rawContent, contentBlocks, rawExcerpt);
  const content = normalizeContentFromBlocks(rawContent, contentBlocks);

  if (finalCategories && finalCategories.length > 0) {
    await validateCategories(finalCategories);
  }

  const newPost = new Post({
    title,
    content,
    contentBlocks,
    excerpt: finalExcerpt,
    slug,
    author: authorId,
    categories: finalCategories,
    tags,
    featuredImage,
    coverImage,
    images,
    status: status || PostStatus.DRAFT,
  });

  if (newPost.status === PostStatus.PUBLISHED) {
    newPost.publishedAt = new Date();
  }

  await newPost.save();
  await createPostNotification(newPost, authorId);

  const populated = await Post.findById(newPost._id)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug');

  if (!populated) {
    return {
      _id: newPost._id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status,
    };
  }

  return normalizePostForFrontend(populated);
};

/**
 * Service pour mettre à jour un article
 */
export const updatePost = async (
  id: string,
  updateData: UpdatePostInput & { slug?: string; publishedAt?: Date; summary?: string },
  currentUserId: string,
  currentUserRole: string
) => {
  ensureValidPostId(id);

  const post = await Post.findById(id).populate('author', '_id username role') as IPost & {
    author: { _id: string; username: string; role: string };
  };

  ensurePostExists(post);
  ensureCanEditPost(post, currentUserId, currentUserRole);

  const cleanUpdateData = await preparePostUpdateData(updateData, post);

  const updatedPost = await Post.findByIdAndUpdate(
    id,
    { $set: { ...cleanUpdateData, updatedAt: new Date() } },
    { new: true, runValidators: true }
  );

  if (!updatedPost) {
    throw new NotFoundError("Erreur lors de la mise à jour de l'article");
  }

  const populated = await populatePost(String(updatedPost._id));

  if (!populated) {
    return {
      _id: updatedPost._id,
      id: String(updatedPost._id),
      title: updatedPost.title || '',
      slug: updatedPost.slug || '',
      status: updatedPost.status || PostStatus.DRAFT,
    };
  }

  const normalizedPost = normalizePostForFrontend(populated);
  (normalizedPost as PostDTO & { id: string }).id = String(normalizedPost._id);
  addAuthorIdAlias(normalizedPost);

  return normalizedPost;
};

/**
 * Service pour supprimer un article (soft delete par défaut)
 */
export const deletePost = async (
  id: string,
  currentUserId: string,
  currentUserRole: string,
  soft: boolean = true
) => {
  ensureValidPostId(id);

  const post = await Post.findById(id);

  if (!post) {
    throw new NotFoundError('Article non trouvé');
  }

  if (post.isDeleted) {
    throw new ConflictError('Article déjà supprimé');
  }

  ensureCanDeletePost(post, currentUserId, currentUserRole);

  if (soft) {
    // Soft delete - marquer comme supprimé
    await Post.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: currentUserId,
    });
  } else {
    if (currentUserRole !== 'admin') {
      throw new ForbiddenError('Seuls les administrateurs peuvent supprimer définitivement un article');
    }
    await Post.findByIdAndDelete(id);
    // NOTE: Consider implementing cascade delete for associated comments
  }

  return true;
};

/**
 * Service pour liker un article
 */
export const likePost = async (id: string, userId: string) => {
  if (!isValidObjectId(id)) {
    throw new ValidationError('ID article invalide');
  }

  const post = await Post.findOne({ _id: id, isDeleted: { $ne: true } }).select('likedBy dislikedBy');

  if (!post) {
    throw new NotFoundError('Article non trouvé');
  }

  const userHasLiked = post.likedBy.some((likeId: unknown) => String(likeId) === userId);
  const update = userHasLiked
    ? { $pull: { likedBy: userId } }
    : { $addToSet: { likedBy: userId }, $pull: { dislikedBy: userId } };

  const updatedPost = await Post.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    update,
    { new: true }
  ).select('likedBy dislikedBy');
  if (!updatedPost) {
    throw new NotFoundError('Article non trouvé');
  }

  return formatPostReactionResult(updatedPost, userId);
};

/**
 * Service pour unliker un article
 */
export const unlikePost = async (id: string, userId: string) => {
  if (!isValidObjectId(id)) {
    throw new ValidationError('ID article invalide');
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: id, likedBy: userId, isDeleted: { $ne: true } },
    { $pull: { likedBy: userId } },
    { new: true }
  ).select('likedBy dislikedBy');

  if (!updatedPost) {
    const postExists = await Post.exists({ _id: id, isDeleted: { $ne: true } });
    if (!postExists) {
      throw new NotFoundError('Article non trouvé');
    }
    throw new ValidationError("Vous n'avez pas liké cet article");
  }

  return formatPostReactionResult(updatedPost, userId);
};

/**
 * Service pour disliker un article
 */
export const dislikePost = async (id: string, userId: string) => {
  if (!isValidObjectId(id)) {
    throw new ValidationError('ID article invalide');
  }

  const post = await Post.findOne({ _id: id, isDeleted: { $ne: true } }).select('likedBy dislikedBy');

  if (!post) {
    throw new NotFoundError('Article non trouvé');
  }

  const userHasDisliked = post.dislikedBy.some((dislikeId: unknown) => String(dislikeId) === userId);
  const update = userHasDisliked
    ? { $pull: { dislikedBy: userId } }
    : { $addToSet: { dislikedBy: userId }, $pull: { likedBy: userId } };

  const updatedPost = await Post.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    update,
    { new: true }
  ).select('likedBy dislikedBy');
  if (!updatedPost) {
    throw new NotFoundError('Article non trouvé');
  }

  return formatPostReactionResult(updatedPost, userId);
};
