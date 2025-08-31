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
    // Legacy plain content (optional during transition)
    content: {
      type: String,
      required: false,
    },
    // New block-based content (flexible structure)
    contentBlocks: [
      new Schema(
        {
          type: { type: String, required: true },
          data: { type: Schema.Types.Mixed, required: true },
        },
        { _id: false }
      ),
    ],
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
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    featuredImage: {
      type: String,
    },
    coverImage: {
      url: { type: String },
      alt: { type: String },
    },
    images: [
      {
        url: { type: String },
        alt: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.DRAFT,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
  const doc = this as unknown as IPost;
  if (this.isModified('status') && doc.status === PostStatus.PUBLISHED && !doc.publishedAt) {
    doc.publishedAt = new Date();
  }
  next();
});

// Créer et exporter le modèle Post
export const Post = mongoose.model<IPost>('Post', postSchema);
