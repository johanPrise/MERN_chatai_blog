import mongoose, { Schema } from 'mongoose';
import { IPost, PostStatus } from '../types/post.types.js';

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    featuredImage: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
    },
    viewCount: {
      type: Number,
      default: 0,
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
    commentCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des recherches
postSchema.index({ title: 'text', content: 'text' });
// Note: slug index is automatically created by unique: true
postSchema.index({ author: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 }); // Index pour le tri par date de publication
postSchema.index({ publishedAt: -1, createdAt: -1 }); // Index composé pour le tri optimisé

// Middleware pré-sauvegarde pour définir la date de publication
postSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === PostStatus.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Créer et exporter le modèle Post
export const Post = mongoose.model<IPost>('Post', postSchema);
