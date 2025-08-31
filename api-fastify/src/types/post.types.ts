import { Document } from 'mongoose';
import { IUser } from './user.types.js';

/**
 * Statut de publication d'un article
 */
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Interface pour le modèle d'article
 */
export interface IPost extends Document {
  title: string;
  // Legacy plain content (optional during transition)
  content?: string;
  // New block-based content
  contentBlocks?: Block[];
  excerpt?: string;
  slug: string;
  author: IUser['_id'];
  categories?: string[];
  tags?: string[];
  // Legacy featured image URL
  featuredImage?: string;
  // New cover image structure
  coverImage?: { url: string; alt?: string };
  // Additional images embedded/attached to the post
  images?: Array<{ url: string; alt?: string }>;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  likedBy: IUser['_id'][];
  dislikeCount: number;
  dislikedBy: IUser['_id'][];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  // Soft delete fields
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: IUser['_id'];
}

/**
 * Type pour la création d'un article
 */
export type CreatePostInput = {
  title: string;
  content?: string;
  contentBlocks?: Block[];
  excerpt?: string;
  summary?: string; // Ajout du champ summary pour compatibilité avec le frontend
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  coverImage?: { url: string; alt?: string };
  images?: Array<{ url: string; alt?: string }>;
  status?: PostStatus;
};

/**
 * Type pour la mise à jour d'un article
 */
export type UpdatePostInput = Partial<CreatePostInput>;

/**
 * Type pour la réponse d'article
 */
export type PostResponse = Omit<IPost, 'likedBy'> & {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  isLiked?: boolean;
  isDisliked?: boolean;
  categories?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  // Ajout pour compatibilité frontend : catégorie principale (singulier)
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  // Champs normalisés pour le frontend
  likes?: IUser['_id'][];
  dislikes?: IUser['_id'][];
};

// Block-based content types
export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'embed'; provider: 'youtube' | 'x' | 'github' | 'generic'; url: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'success' | 'danger'; text: string };
