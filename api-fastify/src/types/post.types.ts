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
  content: string;
  excerpt?: string;
  slug: string;
  author: IUser['_id'];
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
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
  content: string;
  excerpt?: string;
  summary?: string; // Ajout du champ summary pour compatibilité avec le frontend
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
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
