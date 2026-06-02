import { PostStatus } from '../post.types.js';

export interface PostDTO {
  _id: string;
  title: string;
  content?: string;
  contentBlocks?: unknown[];
  excerpt?: string;
  slug: string;
  author: unknown;
  categories: unknown[];
  category?: unknown;
  tags?: string[];
  featuredImage?: string;
  coverImage?: { url: string; alt: string };
  images?: unknown[];
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  likes: string[];
  dislikes: string[];
  views: number;
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  isDeleted: boolean;
}
