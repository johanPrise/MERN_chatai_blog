import { Comment } from '../models/comment.model.js';

export class SimpleReactionService {
  static async likeComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Commentaire non trouvé');

    if (!comment.likedBy) comment.likedBy = [];
    if (!comment.dislikedBy) comment.dislikedBy = [];

    const hasLiked = comment.likedBy.some((id: any) => id.toString() === userId);

    if (hasLiked) {
      // Retirer le like
      comment.likedBy = comment.likedBy.filter((id: any) => id.toString() !== userId);
    } else {
      // Ajouter le like et retirer le dislike
      comment.likedBy.push(userId as any);
      comment.dislikedBy = comment.dislikedBy.filter((id: any) => id.toString() !== userId);
    }

    await comment.save();
    
    return {
      likes: comment.likedBy.map((id: unknown) => String(id)),
      dislikes: comment.dislikedBy.map((id: unknown) => String(id)),
      likeCount: comment.likedBy.length,
      dislikeCount: comment.dislikedBy.length,
      isLiked: !hasLiked,
      isDisliked: false
    };
  }

  static async dislikeComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Commentaire non trouvé');

    if (!comment.likedBy) comment.likedBy = [];
    if (!comment.dislikedBy) comment.dislikedBy = [];

    const hasDisliked = comment.dislikedBy.some((id: any) => id.toString() === userId);

    if (hasDisliked) {
      // Retirer le dislike
      comment.dislikedBy = comment.dislikedBy.filter((id: any) => id.toString() !== userId);
    } else {
      // Ajouter le dislike et retirer le like
      comment.dislikedBy.push(userId as any);
      comment.likedBy = comment.likedBy.filter((id: any) => id.toString() !== userId);
    }

    await comment.save();
    
    return {
      likes: comment.likedBy.map((id: unknown) => String(id)),
      dislikes: comment.dislikedBy.map((id: unknown) => String(id)),
      likeCount: comment.likedBy.length,
      dislikeCount: comment.dislikedBy.length,
      isLiked: false,
      isDisliked: !hasDisliked
    };
  }

  static async unlikeComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Commentaire non trouvé');

    if (!comment.likedBy) comment.likedBy = [];
    if (!comment.dislikedBy) comment.dislikedBy = [];

    // Retirer uniquement le like si l'utilisateur a liké
    const hasLiked = comment.likedBy.some((id: any) => id.toString() === userId);
    if (!hasLiked) {
      throw new Error("Vous n'avez pas liké ce commentaire");
    }

    comment.likedBy = comment.likedBy.filter((id: any) => id.toString() !== userId);
    await comment.save();
    
    return {
      likes: comment.likedBy.map((id: unknown) => String(id)),
      dislikes: comment.dislikedBy.map((id: unknown) => String(id)),
      likeCount: comment.likedBy.length,
      dislikeCount: comment.dislikedBy.length,
      isLiked: false,
      isDisliked: comment.dislikedBy.some((id: any) => id.toString() === userId)
    };
  }
}