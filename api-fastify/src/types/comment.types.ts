import { Document } from 'mongoose';
import { IUser } from './user.types.js';
import { IPost } from './post.types.js';

/**
 * Interface pour le modèle de commentaire
 */
export interface IComment extends Document {
  content: string;
  post: IPost['_id'];
  author: IUser['_id'];
  parent?: IComment['_id'];
  likedBy: IUser['_id'][];
  dislikedBy: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type pour la création d'un commentaire
 */
export type CreateCommentInput = {
  content: string;
  post: string;
  parent?: string;
};

/**
 * Type pour la mise à jour d'un commentaire
 */
export type UpdateCommentInput = {
  content: string;
};

/**
 * Type pour la réponse de commentaire
 */
export type CommentResponse = Omit<IComment, 'likedBy' | 'dislikedBy'> & {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  isLiked?: boolean;
  isDisliked?: boolean;
  replies?: CommentResponse[];
};
