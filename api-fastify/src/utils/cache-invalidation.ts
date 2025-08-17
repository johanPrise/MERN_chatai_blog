import { cache } from '../services/cache.service.js';

export const invalidatePostCache = async (postId?: string) => {
  await cache.del('cache:/api/posts*');
  if (postId) {
    await cache.del(`cache:/api/posts/${postId}*`);
  }
};

export const invalidateCommentsCache = async (postId: string) => {
  if (!postId) return;
  await cache.del(`cache:/api/comments/post/${postId}*`);
};

export const invalidateCategoryCache = async () => {
  await cache.del('cache:/api/categories*');
  await cache.del('cache:/api/posts*'); // Posts peuvent être filtrés par catégorie
};