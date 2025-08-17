import { Comment } from '../models/comment.model.js';
import { isValidObjectId } from '../utils/index.js';

export enum ReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike'
}

/**
 * Service pour gérer les réactions (likes/dislikes) sur les commentaires
 */
export class ReactionService {
  /**
   * Ajouter ou retirer une réaction
   */
  static async toggleReaction(commentId: string, userId: string, type: ReactionType) {
    if (!isValidObjectId(commentId)) {
      throw new Error('ID commentaire invalide');
    }

    let updateQuery = {};
    
    if (type === ReactionType.LIKE) {
      // Toggle like et retirer dislike
      const comment = await Comment.findById(commentId);
      const hasLiked = comment?.likedBy?.some((id: any) => id.toString() === userId);
      
      if (hasLiked) {
        updateQuery = { $pull: { likedBy: userId } };
      } else {
        updateQuery = { $addToSet: { likedBy: userId }, $pull: { dislikedBy: userId } };
      }
    } else {
      // Toggle dislike et retirer like
      const comment = await Comment.findById(commentId);
      const hasDisliked = comment?.dislikedBy?.some((id: any) => id.toString() === userId);
      
      if (hasDisliked) {
        updateQuery = { $pull: { dislikedBy: userId } };
      } else {
        updateQuery = { $addToSet: { dislikedBy: userId }, $pull: { likedBy: userId } };
      }
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      updateQuery,
      { new: true }
    );

    if (!updatedComment) {
      throw new Error('Commentaire non trouvé');
    }

    return {
      likes: (updatedComment.likedBy || []).map((id: unknown) => String(id)),
      dislikes: (updatedComment.dislikedBy || []).map((id: unknown) => String(id))
    };
  }

  /**
   * Obtenir l'état des réactions pour un commentaire
   */
  static async getReactionState(commentId: string, userId?: string) {
    if (!isValidObjectId(commentId)) {
      throw new Error('ID commentaire invalide');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Commentaire non trouvé');
    }

    const likes = (comment.likedBy || []).map((id: unknown) => String(id));
    const dislikes = (comment.dislikedBy || []).map((id: unknown) => String(id));

    return {
      likes,
      dislikes,
      userLiked: userId ? likes.includes(userId) : false,
      userDisliked: userId ? dislikes.includes(userId) : false
    };
  }
}