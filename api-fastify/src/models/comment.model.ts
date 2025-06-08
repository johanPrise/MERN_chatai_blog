import mongoose, { Schema } from 'mongoose';
import { IComment } from '../types/comment.types.js';
import { Post } from './post.model.js';

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    dislikeCount: {
      type: Number,
      default: 0,
    },
    dislikedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des recherches
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ author: 1 });

// Middleware post-sauvegarde pour mettre à jour le compteur de commentaires de l'article
commentSchema.post('save', async function () {
  try {
    // Mettre à jour le compteur de commentaires de l'article
    await Post.findByIdAndUpdate(this.post, {
      $inc: { commentCount: 1 },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compteur de commentaires:', error);
  }
});

// Middleware post-suppression pour mettre à jour le compteur de commentaires de l'article
commentSchema.post('deleteOne', { document: true }, async function () {
  try {
    // Mettre à jour le compteur de commentaires de l'article
    await Post.findByIdAndUpdate(this.post, {
      $inc: { commentCount: -1 },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compteur de commentaires:', error);
  }
});

// Middleware pour gérer la suppression via findByIdAndDelete
commentSchema.pre('findOneAndDelete', async function () {
  const commentId = this.getQuery()._id;
  try {
    const comment = await Comment.findById(commentId);
    if (comment) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: -1 },
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compteur de commentaires:', error);
  }
});

// Créer et exporter le modèle Comment
export const Comment = mongoose.model<IComment>('Comment', commentSchema);
